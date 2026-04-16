import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/api-guard";
import { getAppSettings } from "@/lib/settings/app-settings";
import { appSettingsSchema } from "@/lib/settings/validation";
import { prisma } from "@/lib/prisma";
import { getCourierDisplayName, normalizeCourierCode } from "@/lib/shipping/couriers";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const settings = await getAppSettings();
  return NextResponse.json({ settings }, { status: 200 });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = appSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Payload tidak valid." },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const courierCode = normalizeCourierCode(payload.shippingCourierCode);
  const courierName =
    payload.shippingCourierName?.trim() ||
    getCourierDisplayName(courierCode, payload.shippingCourierName ?? undefined);

  const settings = await prisma.appSetting.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      shippingCourierCode: courierCode || "jne",
      shippingCourierName: courierName || "JNE",
      shippingTrackingBaseUrl: payload.shippingTrackingBaseUrl ?? null,
      bannerAutoplayMs: payload.bannerAutoplayMs ?? 5000,
    },
    update: {
      shippingCourierCode: courierCode || "jne",
      shippingCourierName: courierName || "JNE",
      shippingTrackingBaseUrl: payload.shippingTrackingBaseUrl ?? null,
      bannerAutoplayMs: payload.bannerAutoplayMs ?? 5000,
    },
  });

  return NextResponse.json(
    { success: true, settings },
    { status: 200 },
  );
}
