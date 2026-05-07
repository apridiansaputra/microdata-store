import { NextResponse } from "next/server";
import { fetchProvinces } from "@/lib/location/indonesia";

export async function GET() {
  try {
    const items = await fetchProvinces();
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message, stack: error instanceof Error ? error.stack : undefined }, { status: 502 });
  }
}
