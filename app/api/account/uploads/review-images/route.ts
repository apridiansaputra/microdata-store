import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";

import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/api-guard";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Form upload tidak valid." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File gambar wajib diisi." }, { status: 400 });
  }

  if (file.size <= 0) {
    return NextResponse.json({ error: "File gambar kosong." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Ukuran gambar maksimal 5MB." },
      { status: 413 },
    );
  }

  const extension = ALLOWED_MIME_TYPES.get(file.type);
  if (!extension) {
    return NextResponse.json(
      { error: "Format gambar tidak didukung. Gunakan JPG, PNG, atau WEBP." },
      { status: 415 },
    );
  }

  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");

  const fileName = `uploads/reviews/${year}/${month}/${Date.now()}-${randomUUID()}${extension}`;

  const blob = await put(fileName, file, {
    access: "public",
  });

  return NextResponse.json(
    {
      success: true,
      url: blob.url,
    },
    { status: 201 },
  );
}
