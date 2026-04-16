import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/api-guard";
import { prisma } from "@/lib/prisma";
import { bannerSchema } from "@/lib/settings/validation";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const banners = await prisma.homeBanner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ banners }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = bannerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Payload tidak valid." },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const maxOrder = await prisma.homeBanner.aggregate({
    _max: { sortOrder: true },
  });
  const nextSortOrder =
    payload.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1;

  const banner = await prisma.homeBanner.create({
    data: {
      title: payload.title?.trim() || null,
      subtitle: payload.subtitle?.trim() || null,
      imageUrl: payload.imageUrl.trim(),
      altText: payload.altText?.trim() || null,
      targetUrl: payload.targetUrl?.trim() || null,
      isActive: payload.isActive ?? true,
      sortOrder: nextSortOrder,
    },
  });

  return NextResponse.json({ success: true, banner }, { status: 201 });
}
