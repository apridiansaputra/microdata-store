type RegionNode = {
  id: string;
  name: string;
};

export type LocationOption = {
  code: string;
  name: string;
};

const EMSIFA_BASE_URL = "https://www.emsifa.com/api-wilayah-indonesia/api";

function normalizeLocationOptions(nodes: RegionNode[]): LocationOption[] {
  return nodes
    .map((node) => ({
      code: String(node.id ?? "").trim(),
      name: String(node.name ?? "").trim(),
    }))
    .filter((node) => node.code.length > 0 && node.name.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name, "id"));
}

async function fetchRegion(pathname: string): Promise<LocationOption[]> {
  const response = await fetch(`${EMSIFA_BASE_URL}/${pathname}`, {
    method: "GET",
    next: { revalidate: 60 * 60 * 24 },
  });

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
