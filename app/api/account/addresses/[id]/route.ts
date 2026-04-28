import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/api-guard";
import { prisma } from "@/lib/prisma";
import { resolveRegionPayload } from "@/lib/account/address";
import { accountAddressUpdateSchema } from "@/lib/account/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  const existing = await prisma.address.findFirst({
    where: {
      id,
      userId: auth.user.id,
      deletedAt: null,
      isActive: true,
    },
    select: {
      id: true,
      isPrimary: true,
      provinceCode: true,
      provinceName: true,
      cityCode: true,
      cityName: true,
      districtName: true,
      postalCode: true,
      rajaOngkirSubdistrictId: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Alamat tidak ditemukan." }, { status: 404 });
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
  const parsedBody = accountAddressUpdateSchema.safeParse(normalizedBody);
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
  const hasLocationField =
    payload.region !== undefined ||
    payload.provinceCode !== undefined ||
    payload.provinceName !== undefined ||
    payload.cityCode !== undefined ||
    payload.cityName !== undefined ||
    payload.districtName !== undefined ||
    payload.postalCode !== undefined ||
    payload.rajaOngkirSubdistrictId !== undefined;

  const resolvedRegion = hasLocationField
    ? resolveRegionPayload({
        region: payload.region,
        provinceCode: payload.provinceCode ?? existing.provinceCode,
        provinceName: payload.provinceName ?? existing.provinceName,
        cityCode: payload.cityCode ?? existing.cityCode,
        cityName: payload.cityName ?? existing.cityName,
        districtName: payload.districtName ?? existing.districtName,
        postalCode: payload.postalCode ?? existing.postalCode,
        rajaOngkirSubdistrictId:
          payload.rajaOngkirSubdistrictId ?? existing.rajaOngkirSubdistrictId,
      })
    : null;

  if (hasLocationField && !resolvedRegion) {
    return NextResponse.json(
      {
        error: "Data wilayah tidak valid. Pilih Provinsi, Kota/Kabupaten, Kecamatan, dan isi kode pos.",
      },
      { status: 400 },
    );
  }

  await prisma.$transaction(async (tx) => {
    if (payload.isPrimary) {
      await tx.address.updateMany({
        where: {
          userId: auth.user.id,
          deletedAt: null,
          isActive: true,
          isPrimary: true,
          NOT: {
            id: existing.id,
          },
        },
        data: {
          isPrimary: false,
        },
      });
    }

    await tx.address.update({
      where: { id: existing.id },
      data: {
        ...(payload.fullName !== undefined
          ? { recipientName: payload.fullName.trim() }
          : {}),
        ...(payload.phone !== undefined ? { phone: payload.phone.trim() } : {}),
        ...(resolvedRegion
          ? {
              provinceCode: resolvedRegion.provinceCode,
              provinceName: resolvedRegion.provinceName,
              cityCode: resolvedRegion.cityCode,
              cityName: resolvedRegion.cityName,
              districtName: resolvedRegion.districtName,
              postalCode: resolvedRegion.postalCode,
              rajaOngkirSubdistrictId: resolvedRegion.rajaOngkirSubdistrictId,
            }
          : {}),
        ...(payload.street !== undefined ? { street: payload.street.trim() } : {}),
        ...(payload.detail !== undefined
          ? { detail: payload.detail?.trim() || null }
          : {}),
        ...(payload.isPrimary !== undefined ? { isPrimary: payload.isPrimary } : {}),
      },
    });
  });

  return NextResponse.json(
    {
      success: true,
      message: "Alamat berhasil diperbarui.",
    },
    { status: 200 },
  );
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  const existing = await prisma.address.findFirst({
    where: {
      id,
      userId: auth.user.id,
      deletedAt: null,
      isActive: true,
    },
    select: {
      id: true,
      isPrimary: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Alamat tidak ditemukan." }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.address.update({
      where: { id: existing.id },
      data: {
        isActive: false,
        isPrimary: false,
        deletedAt: new Date(),
      },
    });

    if (existing.isPrimary) {
      const fallbackAddress = await tx.address.findFirst({
        where: {
          userId: auth.user.id,
          deletedAt: null,
          isActive: true,
          NOT: {
            id: existing.id,
          },
        },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });

      if (fallbackAddress) {
        await tx.address.update({
          where: { id: fallbackAddress.id },
          data: { isPrimary: true },
        });
      }
    }
  });

  return NextResponse.json(
    {
      success: true,
      message: "Alamat berhasil dihapus.",
    },
    { status: 200 },
  );
}
