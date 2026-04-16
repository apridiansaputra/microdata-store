"use client";

import { Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";

import Container from "@/components/admin-layout/container";
import Header from "@/components/admin-layout/header";
import { ProductDescriptionEditor } from "@/components/admin-layout/product-description-editor";
import { AuthFeedbackDialog } from "@/components/ui/auth-feedback-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadProductImageFile } from "@/lib/products/upload-client";

type CategoryOption = {
  id: string;
  name: string;
};

type CreateProductResponse = {
  success: boolean;
  product: {
    slug: string;
  };
};

const INITIAL_FORM = {
  name: "",
  sku: "",
  shortSpec: "",
  description: "",
  basePrice: "",
  compareAtPrice: "",
  stock: "",
  weightGrams: "",
  categoryId: "",
  status: "DRAFT" as "DRAFT" | "PUBLISHED",
};

export default function AddProductPage() {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [coverImageUrl, setCoverImageUrl] = useState<string>("");
  const [galleryImageUrls, setGalleryImageUrls] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    variant: "success" | "error";
    title: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const response = await fetch("/api/admin/categories", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        const data = (await response.json().catch(() => ({}))) as {
          categories?: CategoryOption[];
        };
        setCategories(data.categories ?? []);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    void loadCategories();
  }, []);

  const handleCoverUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    const uploaded = await uploadProductImageFile(file);
    setIsUploadingCover(false);
    event.target.value = "";

    if (!uploaded.ok) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Upload Gagal",
        description: uploaded.error,
      });
      return;
    }

    setCoverImageUrl(uploaded.url);
  };

  const handleGalleryUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length === 0) return;

    setIsUploadingGallery(true);
    const nextGallery: string[] = [...galleryImageUrls];

    for (const file of files) {
      const uploaded = await uploadProductImageFile(file);
      if (!uploaded.ok) {
        setFeedback({
          open: true,
          variant: "error",
          title: "Upload Gagal",
          description: uploaded.error,
        });
        continue;
      }
      if (!nextGallery.includes(uploaded.url) && uploaded.url !== coverImageUrl) {
        nextGallery.push(uploaded.url);
      }
    }

    setGalleryImageUrls(nextGallery.slice(0, 12));
    setIsUploadingGallery(false);
    event.target.value = "";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!coverImageUrl) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gambar Sampul Wajib",
        description: "Upload gambar sampul produk terlebih dahulu.",
      });
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/admin/products", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: form.name,
        sku: form.sku,
        shortSpec: form.shortSpec || null,
        description: form.description || null,
        basePrice: Number(form.basePrice || 0),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
        stock: Number(form.stock || 0),
        weightGrams: Number(form.weightGrams || 0),
        categoryId: form.categoryId || null,
        status: form.status,
        coverImageUrl,
        galleryImageUrls,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as
      | CreateProductResponse
      | { error?: string };

    setIsSubmitting(false);

    if (!response.ok || !("success" in data && data.success)) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Menyimpan Produk",
        description: ("error" in data && data.error) || "Periksa kembali data produk.",
      });
      return;
    }

    setFeedback({
      open: true,
      variant: "success",
      title: "Produk Berhasil Ditambahkan",
      description: "Data produk tersimpan dan siap digunakan.",
    });

    router.push(`/product-admin/${data.product.slug}`);
  };

  return (
    <div className="min-h-screen pb-24">
      <Header
        breadcrumbItems={[
          { label: "Produk", href: "/products-admin" },
          { label: "Tambah Produk" },
        ]}
      />

      <Container className="space-y-4 py-4">
        <form className="grid items-start gap-4 xl:grid-cols-[2fr_1.3fr]" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <section className="space-y-5 rounded-lg bg-white p-4">
              <h2 className="text-sm font-semibold text-secondary">Informasi Dasar</h2>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-secondary">Nama Produk</label>
                <Input
                  required
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Masukkan nama produk"
                  className="h-10 border-border-grey bg-white text-sm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-secondary">SKU</label>
                <Input
                  required
                  value={form.sku}
                  onChange={(event) => setForm((prev) => ({ ...prev, sku: event.target.value }))}
                  placeholder="Kode unik produk, contoh: LTP-001"
                  className="h-10 border-border-grey bg-white text-sm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-secondary">Spesifikasi Singkat</label>
                <Input
                  value={form.shortSpec}
                  onChange={(event) => setForm((prev) => ({ ...prev, shortSpec: event.target.value }))}
                  placeholder="Contoh: Intel Core i5, RAM 16GB, SSD 512GB"
                  className="h-10 border-border-grey bg-white text-sm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-secondary">Deskripsi</label>
                <ProductDescriptionEditor
                  initialValue={form.description}
                  onChange={(nextValue) =>
                    setForm((prev) => ({ ...prev, description: nextValue }))
                  }
                />
              </div>
            </section>

            <section className="space-y-4 rounded-lg bg-white p-4">
              <h2 className="text-sm font-semibold text-secondary">Harga & Inventory</h2>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-secondary">Harga Jual (Rp)</label>
                  <Input
                    required
                    type="number"
                    min={0}
                    value={form.basePrice}
                    onChange={(event) => setForm((prev) => ({ ...prev, basePrice: event.target.value }))}
                    placeholder="Contoh: 8500000"
                    className="h-10 rounded-lg border-border-grey bg-white text-sm"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-secondary">Harga Coret (Rp)</label>
                  <Input
                    type="number"
                    min={0}
                    value={form.compareAtPrice}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, compareAtPrice: event.target.value }))
                    }
                    placeholder="Opsional"
                    className="h-10 rounded-lg border-border-grey bg-white text-sm"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-secondary">Stok</label>
                  <Input
                    required
                    type="number"
                    min={0}
                    value={form.stock}
                    onChange={(event) => setForm((prev) => ({ ...prev, stock: event.target.value }))}
                    placeholder="Jumlah stok"
                    className="h-10 rounded-lg border-border-grey bg-white text-sm"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-secondary">Berat (gram)</label>
                  <Input
                    required
                    type="number"
                    min={0}
                    value={form.weightGrams}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, weightGrams: event.target.value }))
                    }
                    placeholder="Contoh: 1200"
                    className="h-10 rounded-lg border-border-grey bg-white text-sm"
                  />
                </div>
              </div>
            </section>
          </div>

          <section className="space-y-4 rounded-lg bg-white p-4">
            <h2 className="text-sm font-semibold text-secondary">Media Produk</h2>

            <input
              ref={coverInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => {
                void handleCoverUpload(event);
              }}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              onChange={(event) => {
                void handleGalleryUpload(event);
              }}
            />

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-secondary">Gambar Sampul</label>
              {coverImageUrl ? (
                <div className="relative w-full overflow-hidden rounded-xl border border-border-grey p-3">
                  <img
                    src={coverImageUrl}
                    alt="Cover produk"
                    className="h-36 w-full rounded-md object-contain"
                  />
                  <button
                    type="button"
                    className="absolute top-2 right-2 rounded-full bg-white p-1 text-rose-600 shadow"
                    onClick={() => setCoverImageUrl("")}
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : null}

              <Button
                type="button"
                variant="outline"
                className="h-10 justify-start border-dashed text-dark-grey"
                onClick={() => coverInputRef.current?.click()}
              >
                {isUploadingCover ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Upload Gambar Sampul"
                )}
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-secondary">Galeri Gambar</label>
              {galleryImageUrls.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {galleryImageUrls.map((imageUrl) => (
                    <div key={imageUrl} className="relative overflow-hidden rounded-lg border p-1">
                      <img
                        src={imageUrl}
                        alt="Galeri produk"
                        className="h-20 w-full rounded object-cover"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 rounded-full bg-white p-1 text-rose-600 shadow"
                        onClick={() =>
                          setGalleryImageUrls((prev) => prev.filter((url) => url !== imageUrl))
                        }
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              <Button
                type="button"
                variant="outline"
                className="h-10 justify-start border-dashed text-dark-grey"
                onClick={() => galleryInputRef.current?.click()}
              >
                {isUploadingGallery ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Upload Galeri (maks 12)"
                )}
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-secondary">Kategori</label>
                <Select
                  value={form.categoryId || "none"}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, categoryId: value === "none" ? "" : value }))
                  }
                  disabled={isLoadingCategories}
                >
                  <SelectTrigger className="h-10 w-full rounded-lg border-border-grey bg-white text-xs">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tanpa Kategori</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-secondary">Status Produk</label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, status: value as "DRAFT" | "PUBLISHED" }))
                  }
                >
                  <SelectTrigger className="h-10 w-full rounded-lg border-border-grey bg-white text-xs">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Publish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <div className="fixed right-0 bottom-0 left-0 z-30 border-t border-border-grey bg-white md:left-60">
            <div className="flex items-center justify-end gap-3 px-4 py-4.5 md:px-6">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-lg border-primary-orange bg-white px-4 text-sm text-primary-orange hover:bg-primary-orange/5"
                onClick={() => router.push("/products-admin")}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isUploadingCover || isUploadingGallery}
                className="h-10 rounded-lg bg-primary-orange px-5 text-sm font-semibold text-white hover:bg-primary-orange/90"
              >
                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Simpan Produk"}
              </Button>
            </div>
          </div>
        </form>
      </Container>

      <AuthFeedbackDialog
        open={feedback?.open ?? false}
        onOpenChange={(open) => {
          if (!open) setFeedback(null);
        }}
        variant={feedback?.variant ?? "success"}
        title={feedback?.title ?? ""}
        description={feedback?.description ?? ""}
      />
    </div>
  );
}
