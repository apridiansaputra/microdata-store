import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

/**
 * Public endpoint — tanpa autentikasi.
 * Digunakan oleh halaman login & register untuk menampilkan banner aktif.
 */
export async function GET() {
    const banners = await prisma.authBanner.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        select: {
            id: true,
            imageUrl: true,
            altText: true,
            title: true,
            subtitle: true,
        },
    });

    return NextResponse.json({ banners }, { status: 200 });
}
