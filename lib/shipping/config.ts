import { getAppSettings } from "@/lib/settings/app-settings";
import { getCourierDisplayName, normalizeCourierCode } from "@/lib/shipping/couriers";

type ShippingProviderConfig = {
  apiKey: string;
  originId: string;
  courierCode: string;
  courierName: string;
};

export async function getShippingProviderConfig(): Promise<ShippingProviderConfig | null> {
  const apiKey = process.env.RAJAONGKIR_API_KEY?.trim();
  const originId = process.env.RAJAONGKIR_ORIGIN_ID?.trim();
  const settings = await getAppSettings();

  const courierCode = settings?.shippingCourierCode
    ? normalizeCourierCode(settings.shippingCourierCode)
    : normalizeCourierCode(process.env.RAJAONGKIR_COURIER_CODE) ||
      normalizeCourierCode(process.env.RAJAONGKIR_DEFAULT_COURIERS?.split(":")[0]) ||
      "jne";
  const courierName =
    settings?.shippingCourierName?.trim() ||
    getCourierDisplayName(courierCode, settings?.shippingCourierName ?? undefined);

  if (!apiKey || !originId) {
    return null;
  }

  return {
    apiKey,
    originId,
    courierCode,
    courierName,
  };
}
