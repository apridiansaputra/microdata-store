export type CheckoutAddress = {
  id: string;
  name: string;
  phone: string;
  provinceCode: string | null;
  provinceName: string;
  cityCode: string | null;
  cityName: string;
  districtName: string;
  postalCode: string;
  region: string;
  street: string;
  detail: string;
  isPrimary: boolean;
};

export type CheckoutShippingQuote = {
  courierCode: string;
  courierName: string;
  serviceCode: string;
  serviceName: string;
  cost: number;
  etdRaw: string;
  etdLabel: string;
  weightGrams: number;
  destinationId: number;
};

export function formatAddressLine(address: CheckoutAddress) {
  return [address.street, address.detail, address.districtName]
    .map((item) => item.trim())
    .filter(Boolean)
    .join(", ");
}

export function formatAddressRegion(address: CheckoutAddress) {
  return [address.cityName, address.provinceName, address.postalCode]
    .map((item) => item.trim())
    .filter(Boolean)
    .join(", ");
}
