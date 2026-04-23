import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/api-guard";
import { fetchDistrictsByCity } from "@/lib/location/indonesia";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  const cityCode = request.nextUrl.searchParams.get("cityCode")?.trim() ?? "";
  if (!cityCode) {
    return NextResponse.json({ error: "cityCode wajib diisi." }, { status: 400 });
  }

  try {
    const items = await fetchDistrictsByCity(cityCode);
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil data kecamatan.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
