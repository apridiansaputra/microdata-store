import { prisma } from "@/lib/prisma";

export type AppSettingsPayload = {
  shippingCourierCode: string;
  shippingCourierName: string;
  shippingTrackingBaseUrl: string | null;
  bannerAutoplayMs: number;
};

const DEFAULT_SETTINGS: AppSettingsPayload = {
  shippingCourierCode: "jne",
  shippingCourierName: "JNE",
  shippingTrackingBaseUrl: null,
  bannerAutoplayMs: 5000,
};

export async function getAppSettings() {
  return prisma.appSetting.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      ...DEFAULT_SETTINGS,
    },
    update: {},
  });
}

export async function getPublicAppSettings(): Promise<AppSettingsPayload> {
  const settings = await getAppSettings();
  return {
    shippingCourierCode: settings.shippingCourierCode,
    shippingCourierName: settings.shippingCourierName,
    shippingTrackingBaseUrl: settings.shippingTrackingBaseUrl,
    bannerAutoplayMs: settings.bannerAutoplayMs,
  };
}
