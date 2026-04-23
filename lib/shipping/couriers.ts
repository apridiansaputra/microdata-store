const COURIER_NAME_MAP: Record<string, string> = {
  jne: "JNE",
  sicepat: "SiCepat",
  jnt: "J&T Express",
  pos: "POS Indonesia",
  tiki: "TIKI",
  ninja: "Ninja Xpress",
  lion: "Lion Parcel",
};

export function normalizeCourierCode(value: string | null | undefined) {
  if (!value) return "";
  return value.trim().toLowerCase();
}

export function getCourierDisplayName(code: string, fallback?: string) {
  const normalized = normalizeCourierCode(code);
  if (!normalized) return fallback ?? "Ekspedisi";
  return COURIER_NAME_MAP[normalized] ?? fallback ?? normalized.toUpperCase();
}
