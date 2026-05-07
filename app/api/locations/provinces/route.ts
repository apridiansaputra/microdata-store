import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/api-guard";
import { fetchProvinces } from "@/lib/location/indonesia";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (!auth.ok) {
      return auth.response;
    }

    const items = await fetchProvinces();
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil data provinsi.";
    return NextResponse.json({ error: message, type: error?.constructor?.name }, { status: 502 });
  }
}
