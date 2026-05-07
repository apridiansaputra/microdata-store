type RegionNode = {
  id: string;
  name: string;
};

export type LocationOption = {
  code: string;
  name: string;
};

const PRIMARY_BASE_URL = "https://emsifa.github.io/api-wilayah-indonesia/api";
const FALLBACK_BASE_URL = "https://www.emsifa.com/api-wilayah-indonesia/api";
const FETCH_TIMEOUT_MS = 10_000;

function normalizeLocationOptions(nodes: RegionNode[]): LocationOption[] {
  return nodes
    .map((node) => ({
      code: String(node.id ?? "").trim(),
      name: String(node.name ?? "").trim(),
    }))
    .filter((node) => node.code.length > 0 && node.name.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name, "id"));
}

async function fetchWithFallback(pathname: string): Promise<Response> {
  const FETCH_TIMEOUT = 3000;
  
  try {
    const res = await fetch(`${PRIMARY_BASE_URL}/${pathname}`, { 
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT)
    });
    if (res.ok) return res;
  } catch (err) {
    // Primary failed (timeout or network error), proceed to fallback
  }

  const fallbackRes = await fetch(`${FALLBACK_BASE_URL}/${pathname}`, { 
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT)
  });
  
  if (!fallbackRes.ok) {
    throw new Error(`Gagal mengambil data wilayah (${fallbackRes.status}).`);
  }
  return fallbackRes;
}

async function fetchRegion(pathname: string): Promise<LocationOption[]> {
  let response: Response;

  try {
    response = await fetchWithFallback(pathname);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Gagal mengambil data wilayah.");
  }

  const data = (await response.json().catch(() => null)) as RegionNode[] | null;
  if (!Array.isArray(data)) {
    throw new Error("Format data wilayah tidak valid.");
  }

  return normalizeLocationOptions(data);
}

export async function fetchProvinces() {
  return fetchRegion("provinces.json");
}

export async function fetchCitiesByProvince(provinceCode: string) {
  return fetchRegion(`regencies/${encodeURIComponent(provinceCode)}.json`);
}

export async function fetchDistrictsByCity(cityCode: string) {
  return fetchRegion(`districts/${encodeURIComponent(cityCode)}.json`);
}
