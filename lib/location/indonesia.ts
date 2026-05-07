type RegionNode = {
  id: string;
  name?: string;
  nama?: string;
};

export type LocationOption = {
  code: string;
  name: string;
};

const IBNUX_BASE_URL = "https://ibnux.github.io/data-indonesia";
const EMSIFA_BASE_URL = "https://emsifa.github.io/api-wilayah-indonesia/api";
const FETCH_TIMEOUT = 3000;

function normalizeLocationOptions(nodes: RegionNode[]): LocationOption[] {
  return nodes
    .map((node) => ({
      code: String(node.id ?? "").trim(),
      name: String(node.name ?? node.nama ?? "").trim().toUpperCase(),
    }))
    .filter((node) => node.code.length > 0 && node.name.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name, "id"));
}

async function fetchWithFallback(primaryUrl: string, fallbackUrl: string): Promise<LocationOption[]> {
  try {
    const res = await fetch(primaryUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (Array.isArray(data)) return normalizeLocationOptions(data);
    }
  } catch (err) {
    // Primary failed (timeout or network error)
  }

  const fallbackRes = await fetch(fallbackUrl, {
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });
  
  if (!fallbackRes.ok) {
    throw new Error(`Gagal mengambil data wilayah (${fallbackRes.status}).`);
  }

  const data = await fallbackRes.json().catch(() => null);
  if (!Array.isArray(data)) {
    throw new Error("Format data wilayah tidak valid.");
  }
  return normalizeLocationOptions(data);
}

import provincesData from "./provinces-data.json";

export async function fetchProvinces() {
  return normalizeLocationOptions(provincesData as RegionNode[]);
}

export async function fetchCitiesByProvince(provinceCode: string) {
  return fetchWithFallback(
    `${IBNUX_BASE_URL}/kabupaten/${encodeURIComponent(provinceCode)}.json`,
    `${EMSIFA_BASE_URL}/regencies/${encodeURIComponent(provinceCode)}.json`
  );
}

export async function fetchDistrictsByCity(cityCode: string) {
  return fetchWithFallback(
    `${IBNUX_BASE_URL}/kecamatan/${encodeURIComponent(cityCode)}.json`,
    `${EMSIFA_BASE_URL}/districts/${encodeURIComponent(cityCode)}.json`
  );
}
