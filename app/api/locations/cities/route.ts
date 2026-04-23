import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/api-guard";
import { fetchCitiesByProvince } from "@/lib/location/indonesia";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  const provinceCode = request.nextUrl.searchParams.get("provinceCode")?.trim() ?? "";
  if (!provinceCode) {
    return NextResponse.json({ error: "provinceCode wajib diisi." }, { status: 400 });
  }

  try {
    const items = await fetchCitiesByProvince(provinceCode);
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal mengambil data kota/kabupaten.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
