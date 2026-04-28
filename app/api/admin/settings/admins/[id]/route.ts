import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth/api-guard";
import { normalizeEmail, normalizeUsername } from "@/lib/auth/normalize";
import { hashPassword, isStrongPassword } from "@/lib/auth/password";
import { getCurrentSessionUser } from "@/lib/auth/server-auth";
import { prisma } from "@/lib/prisma";
import { updateAdminSchema } from "@/lib/settings/validation";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) {
        return auth.response;
    }

    const session = await getCurrentSessionUser("admin");
    const { id } = await params;

    // Super Admin tidak bisa mengedit dirinya sendiri via endpoint ini (gunakan profile)
    if (session?.id === id) {
        return NextResponse.json(
            { error: "Gunakan halaman profil untuk mengubah data akun Anda sendiri." },
            { status: 403 },
        );
    }

    const body = await request.json().catch(() => null);
    const parsed = updateAdminSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0]?.message ?? "Payload tidak valid." },
            { status: 400 },
        );
    }

    const target = await prisma.user.findFirst({
        where: { id, deletedAt: null, role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    });
    if (!target) {
        return NextResponse.json({ error: "Admin tidak ditemukan." }, { status: 404 });
    }

    const payload = parsed.data;

    // Cek password strength jika diubah
    if (payload.password && !isStrongPassword(payload.password)) {
        return NextResponse.json(
            {
                error:
                    "Password harus 12-128 karakter dan mengandung huruf besar, huruf kecil, angka, serta simbol.",
            },
            { status: 400 },
        );
    }

    const updateData: Record<string, unknown> = {};

    if (payload.fullName !== undefined) updateData.fullName = payload.fullName;
    if (payload.role !== undefined) updateData.role = payload.role;
    if (payload.status !== undefined) updateData.status = payload.status;

    if (payload.email !== undefined) {
        updateData.email = payload.email;
        updateData.emailNormalized = normalizeEmail(payload.email);
    }

    if (payload.username !== undefined) {
        updateData.username = payload.username
            ? normalizeUsername(payload.username)
            : null;
    }

    if (payload.phone !== undefined) {
        updateData.phone = payload.phone ? payload.phone.trim() : null;
    }

    if (payload.password) {
        updateData.passwordHash = await hashPassword(payload.password);
    }

    try {
        const admin = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                fullName: true,
                email: true,
                username: true,
                role: true,
                status: true,
                createdAt: true,
                lastLoginAt: true,
            },
        });

        return NextResponse.json({ success: true, admin }, { status: 200 });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return NextResponse.json(
                { error: "Email atau username sudah digunakan oleh akun lain." },
                { status: 409 },
            );
        }
        console.error("Update admin error:", error);
        return NextResponse.json({ error: "Gagal memperbarui data admin." }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) {
        return auth.response;
    }

    const session = await getCurrentSessionUser("admin");
    const { id } = await params;

    // Tidak boleh hapus diri sendiri
    if (session?.id === id) {
        return NextResponse.json(
            { error: "Anda tidak bisa menghapus akun Anda sendiri." },
            { status: 403 },
        );
    }

    const target = await prisma.user.findFirst({
        where: { id, deletedAt: null, role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    });
    if (!target) {
        return NextResponse.json({ error: "Admin tidak ditemukan." }, { status: 404 });
    }

    // Soft delete
    await prisma.user.update({
        where: { id },
        data: { deletedAt: new Date(), status: "DELETED" },
    });

    return NextResponse.json({ success: true }, { status: 200 });
}
