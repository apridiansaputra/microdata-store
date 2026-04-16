type RajaOngkirMeta = {
  code?: number;
  status?: string;
  message?: string;
};

type RajaOngkirDestination = {
  id: number;
  label: string;
  province_name: string;
  city_name: string;
  district_name: string;
  subdistrict_name: string | null;
  zip_code: string | null;
};

type RajaOngkirCost = {
  name: string;
  code: string;
  service: string;
  description: string;
  cost: number;
  etd: string;
};

const RAJAONGKIR_BASE_URL = "https://rajaongkir.komerce.id/api/v1";

function createErrorMessage(input: {
  message?: string;
  statusCode?: number;
}) {
  if (input.message?.trim()) return input.message.trim();
  if (input.statusCode) return `RajaOngkir error (${input.statusCode}).`;
  return "RajaOngkir request gagal.";
}

async function requestJson<T>(input: {
  endpoint: string;
  apiKey: string;
  method?: "GET" | "POST";
  query?: URLSearchParams;
  formBody?: URLSearchParams;
}) {
  const method = input.method ?? "GET";
  const queryString = input.query?.toString();
  const url = `${RAJAONGKIR_BASE_URL}${input.endpoint}${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method,
    headers: {
      key: input.apiKey,
      ...(method === "POST"
        ? { "Content-Type": "application/x-www-form-urlencoded" }
        : {}),
    },
    body: method === "POST" ? input.formBody?.toString() : undefined,
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as {
    meta?: RajaOngkirMeta;
    data?: T;
  } | null;

  if (!response.ok) {
    throw new Error(
      createErrorMessage({
        message: payload?.meta?.message,
        statusCode: response.status,
      }),
    );
  }

  if (!payload?.data) {
    throw new Error("RajaOngkir response tidak berisi data.");
  }

  return payload.data;
}

export async function searchDomesticDestinations(input: {
  apiKey: string;
  search: string;
  limit?: number;
}) {
  const query = new URLSearchParams({
    search: input.search,
    limit: String(input.limit ?? 20),
    offset: "0",
  });

  return requestJson<RajaOngkirDestination[]>({
    endpoint: "/destination/domestic-destination",
    apiKey: input.apiKey,
    method: "GET",
    query,
  });
}

export async function calculateDomesticCosts(input: {
  apiKey: string;
  originId: string;
  destinationId: number;
  weightGrams: number;
  courierCode: string;
}) {
  const formBody = new URLSearchParams({
    origin: input.originId,
    destination: String(input.destinationId),
    weight: String(Math.max(1, Math.floor(input.weightGrams))),
    courier: input.courierCode,
    price: "lowest",
  });

  return requestJson<RajaOngkirCost[]>({
    endpoint: "/calculate/domestic-cost",
    apiKey: input.apiKey,
    method: "POST",
    formBody,
  });
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function scoreDestination(input: {
  targetProvince: string;
  targetCity: string;
  targetDistrict: string;
  targetPostalCode: string;
  candidate: RajaOngkirDestination;
}) {
  let score = 0;

  if (normalizeText(input.targetProvince) === normalizeText(input.candidate.province_name)) {
    score += 2;
  }
  if (normalizeText(input.targetCity) === normalizeText(input.candidate.city_name)) {
    score += 3;
  }
  if (normalizeText(input.targetDistrict) === normalizeText(input.candidate.district_name)) {
    score += 4;
  }
  if (normalizeText(input.targetPostalCode) === normalizeText(input.candidate.zip_code)) {
    score += 3;
  }

  return score;
}

export async function resolveDomesticDestinationId(input: {
  apiKey: string;
  provinceName: string;
  cityName: string;
  districtName: string;
  postalCode: string;
  street: string;
  detail?: string | null;
}) {
  const searchTerms = [
    `${input.street} ${input.districtName} ${input.cityName} ${input.postalCode}`,
    `${input.districtName} ${input.cityName} ${input.postalCode}`,
    `${input.cityName} ${input.postalCode}`,
  ]
    .map((item) => item.trim())
    .filter(Boolean);

  for (const search of searchTerms) {
    const candidates = await searchDomesticDestinations({
      apiKey: input.apiKey,
      search,
      limit: 20,
    });

    if (!candidates.length) {
      continue;
    }

    const best = [...candidates]
      .sort((left, right) => {
        const leftScore = scoreDestination({
          targetProvince: input.provinceName,
          targetCity: input.cityName,
          targetDistrict: input.districtName,
          targetPostalCode: input.postalCode,
          candidate: left,
        });
        const rightScore = scoreDestination({
          targetProvince: input.provinceName,
          targetCity: input.cityName,
          targetDistrict: input.districtName,
          targetPostalCode: input.postalCode,
          candidate: right,
        });

        if (rightScore !== leftScore) return rightScore - leftScore;
        return left.id - right.id;
      })[0];

    if (best) {
      return best.id;
    }
  }

  throw new Error("Tujuan pengiriman tidak ditemukan di RajaOngkir.");
}

export function toReadableEtd(rawEtd: string) {
  const normalized = rawEtd.trim().toLowerCase();
  if (!normalized) return "Estimasi tidak tersedia";

  if (normalized === "0 day" || normalized === "0 days") {
    return "Hari ini";
  }

  return rawEtd
    .replace(/days?/gi, "Hari")
    .replace(/\s*-\s*/g, " - ")
    .trim();
}
