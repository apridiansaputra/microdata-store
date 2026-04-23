import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/api-guard";
import { prisma } from "@/lib/prisma";
import { bannerUpdateSchema } from "@/lib/settings/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "ID banner tidak valid." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bannerUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Payload tidak valid." },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  const banner = await prisma.homeBanner.update({
    where: { id },
    data: {
      title: payload.title?.trim() ?? undefined,
      subtitle: payload.subtitle?.trim() ?? undefined,
      imageUrl: payload.imageUrl?.trim() ?? undefined,
      altText: payload.altText?.trim() ?? undefined,
      targetUrl: payload.targetUrl?.trim() ?? undefined,
      isActive: payload.isActive ?? undefined,
      sortOrder: payload.sortOrder ?? undefined,
    },
  });

  return NextResponse.json({ success: true, banner }, { status: 200 });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "ID banner tidak valid." }, { status: 400 });
  }

  await prisma.homeBanner.delete({ where: { id } });
  return NextResponse.json({ success: true }, { status: 200 });
}
