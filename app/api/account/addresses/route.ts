import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/api-guard";
import { prisma } from "@/lib/prisma";
import { resolveRegionPayload, toRegionLabel } from "@/lib/account/address";
import { accountAddressCreateSchema } from "@/lib/account/validation";

function normalizePhoneForPayload(rawValue: unknown) {
  if (typeof rawValue !== "string") return rawValue;

  const compact = rawValue
    .normalize("NFKC")
    .trim()
    .replace(/[^0-9+]/g, "");

  const hasLeadingPlus = compact.startsWith("+");
  const digitsOnly = compact.replace(/\+/g, "");

  if (!digitsOnly) return "";
  return hasLeadingPlus ? `+${digitsOnly}` : digitsOnly;
}

function serializeAddress(address: {
  id: string;
  recipientName: string;
  phone: string;
  provinceCode: string | null;
  provinceName: string;
  cityCode: string | null;
  cityName: string;
  districtName: string;
  postalCode: string;
  street: string;
  detail: string | null;
  isPrimary: boolean;
}) {
  return {
    id: address.id,
    name: address.recipientName,
    phone: address.phone,
    provinceCode: address.provinceCode,
    provinceName: address.provinceName,
    cityCode: address.cityCode,
    cityName: address.cityName,
    districtName: address.districtName,
    postalCode: address.postalCode,
    region: toRegionLabel({
      provinceName: address.provinceName,
      cityName: address.cityName,
      districtName: address.districtName,
      postalCode: address.postalCode,
    }),
    street: address.street,
    detail: address.detail ?? "",
    isPrimary: address.isPrimary,
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  const addresses = await prisma.address.findMany({
    where: {
      userId: auth.user.id,
      deletedAt: null,
      isActive: true,
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      recipientName: true,
      phone: true,
      provinceCode: true,
      provinceName: true,
      cityCode: true,
      cityName: true,
      districtName: true,
      postalCode: true,
      street: true,
      detail: true,
      isPrimary: true,
    },
  });

  return NextResponse.json(
    {
      addresses: addresses.map((address) => serializeAddress(address)),
    },
    { status: 200 },
  );
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  const normalizedBody =
    body && typeof body === "object"
      ? {
          ...body,
          phone: normalizePhoneForPayload(
            (body as { phone?: unknown }).phone,
          ),
        }
      : body;
  const parsedBody = accountAddressCreateSchema.safeParse(normalizedBody);
  if (!parsedBody.success) {
    const firstIssue = parsedBody.error.issues[0];
    return NextResponse.json(
      {
        error: firstIssue?.message ?? "Payload tidak valid.",
        ...(process.env.NODE_ENV !== "production"
          ? {
              debugIssue: firstIssue
                ? {
                    path: firstIssue.path.join("."),
                    code: firstIssue.code,
                  }
                : null,
            }
          : {}),
      },
      { status: 400 },
    );
  }

  const payload = parsedBody.data;
  const resolvedRegion = resolveRegionPayload(payload);
  if (!resolvedRegion) {
    return NextResponse.json(
      {
        error: "Data wilayah tidak valid. Pilih Provinsi, Kota/Kabupaten, Kecamatan, dan isi kode pos.",
      },
      { status: 400 },
    );
  }

  const currentAddressCount = await prisma.address.count({
    where: {
      userId: auth.user.id,
      deletedAt: null,
      isActive: true,
    },
  });
  const shouldBePrimary = payload.isPrimary ?? currentAddressCount === 0;

  const createdAddress = await prisma.$transaction(async (tx) => {
    if (shouldBePrimary) {
      await tx.address.updateMany({
        where: {
          userId: auth.user.id,
          deletedAt: null,
          isActive: true,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    return tx.address.create({
      data: {
        userId: auth.user.id,
        label: "OTHER",
        recipientName: payload.fullName.trim(),
        phone: payload.phone.trim(),
        provinceCode: resolvedRegion.provinceCode,
        provinceName: resolvedRegion.provinceName,
        cityCode: resolvedRegion.cityCode,
        cityName: resolvedRegion.cityName,
        districtName: resolvedRegion.districtName,
        postalCode: resolvedRegion.postalCode,
        rajaOngkirSubdistrictId: resolvedRegion.rajaOngkirSubdistrictId,
        street: payload.street.trim(),
        detail: payload.detail?.trim() || null,
        isPrimary: shouldBePrimary,
        isActive: true,
      },
      select: {
        id: true,
        recipientName: true,
        phone: true,
        provinceCode: true,
        provinceName: true,
        cityCode: true,
        cityName: true,
        districtName: true,
        postalCode: true,
        street: true,
        detail: true,
        isPrimary: true,
      },
    });
  });

  return NextResponse.json(
    {
      success: true,
      address: serializeAddress(createdAddress),
    },
    { status: 201 },
  );
}
