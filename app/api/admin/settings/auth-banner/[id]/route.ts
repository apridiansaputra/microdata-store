import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/api-guard";
import { prisma } from "@/lib/prisma";
import { authBannerUpdateSchema } from "@/lib/settings/validation";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const auth = await requireAdmin(request);
    if (!auth.ok) {
        return auth.response;
    }

    const { id } = await params;

    const body = await request.json().catch(() => null);
    const parsed = authBannerUpdateSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0]?.message ?? "Payload tidak valid." },
            { status: 400 },
        );
    }

    const existing = await prisma.authBanner.findUnique({ where: { id } });
    if (!existing) {
        return NextResponse.json({ error: "Banner tidak ditemukan." }, { status: 404 });
    }

    const payload = parsed.data;
    const banner = await prisma.authBanner.update({
        where: { id },
        data: {
            ...(payload.imageUrl !== undefined && { imageUrl: payload.imageUrl.trim() }),
            ...(payload.altText !== undefined && { altText: payload.altText.trim() || null }),
            ...(payload.title !== undefined && { title: payload.title.trim() || null }),
            ...(payload.subtitle !== undefined && { subtitle: payload.subtitle.trim() || null }),
            ...(payload.isActive !== undefined && { isActive: payload.isActive }),
            ...(payload.sortOrder !== undefined && { sortOrder: payload.sortOrder }),
        },
    });

    return NextResponse.json({ success: true, banner }, { status: 200 });
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const auth = await requireAdmin(request);
    if (!auth.ok) {
        return auth.response;
    }

    const { id } = await params;

    const existing = await prisma.authBanner.findUnique({ where: { id } });
    if (!existing) {
        return NextResponse.json({ error: "Banner tidak ditemukan." }, { status: 404 });
    }

    await prisma.authBanner.delete({ where: { id } });

    return NextResponse.json({ success: true }, { status: 200 });
}
