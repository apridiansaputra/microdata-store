export type ParsedRegion = {
  provinceCode: string | null;
  provinceName: string;
  cityCode: string | null;
  cityName: string;
  districtName: string;
  postalCode: string;
  rajaOngkirSubdistrictId: string | null;
};

export function parseRegionInput(region: string): ParsedRegion | null {
  const parts = region
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 4) {
    return null;
  }

  const [provinceName, cityName, districtName, postalCode] = parts;
  return {
    provinceCode: null,
    provinceName,
    cityCode: null,
    cityName,
    districtName,
    postalCode,
    rajaOngkirSubdistrictId: null,
  };
}

type RegionPayloadInput = {
  region?: string | null;
  provinceCode?: string | null;
  provinceName?: string | null;
  cityCode?: string | null;
  cityName?: string | null;
  districtName?: string | null;
  postalCode?: string | null;
  rajaOngkirSubdistrictId?: string | null;
};

function normalizeNullableString(value: string | null | undefined) {
  if (value == null) return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function resolveRegionPayload(input: RegionPayloadInput): ParsedRegion | null {
  const region = normalizeNullableString(input.region);
  if (region) {
    const parsed = parseRegionInput(region);
    if (!parsed) {
      return null;
    }

    return {
      ...parsed,
      provinceCode: normalizeNullableString(input.provinceCode),
      cityCode: normalizeNullableString(input.cityCode),
      rajaOngkirSubdistrictId: normalizeNullableString(input.rajaOngkirSubdistrictId),
    };
  }

  const provinceName = normalizeNullableString(input.provinceName);
  const cityName = normalizeNullableString(input.cityName);
  const districtName = normalizeNullableString(input.districtName);
  const postalCode = normalizeNullableString(input.postalCode);

  if (provinceName && cityName && districtName && postalCode) {
    return {
      provinceCode: normalizeNullableString(input.provinceCode),
      provinceName,
      cityCode: normalizeNullableString(input.cityCode),
      cityName,
      districtName,
      postalCode,
      rajaOngkirSubdistrictId: normalizeNullableString(input.rajaOngkirSubdistrictId),
    };
  }
  return null;
}

export function toRegionLabel(input: {
  provinceName: string;
  cityName: string;
  districtName: string;
  postalCode: string;
}) {
  return [
    input.provinceName,
    input.cityName,
    input.districtName,
    input.postalCode,
  ]
    .map((item) => item.trim())
    .filter(Boolean)
    .join(", ");
}
