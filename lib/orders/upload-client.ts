"use client";

export async function uploadReviewImageFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/account/uploads/review-images", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const data = (await response.json().catch(() => ({}))) as {
    url?: string;
    error?: string;
  };

  if (!response.ok || !data.url) {
    return {
      ok: false as const,
      error: data.error ?? "Gagal upload gambar ulasan.",
    };
  }

  return {
    ok: true as const,
    url: data.url,
  };
}
