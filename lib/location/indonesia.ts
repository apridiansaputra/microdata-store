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

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchRegion(pathname: string): Promise<LocationOption[]> {
  let response: Response | null = null;

  try {
    response = await fetchWithTimeout(`${PRIMARY_BASE_URL}/${pathname}`);
  } catch {
    // Primary URL failed, will try fallback below
  }

  if (!response || !response.ok) {
    try {
      response = await fetchWithTimeout(`${FALLBACK_BASE_URL}/${pathname}`);
    } catch {
      throw new Error("Gagal mengambil data wilayah: kedua sumber tidak tersedia.");
    }
  }

  if (!response.ok) {
    throw new Error(`Gagal mengambil data wilayah (${response.status}).`);
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
