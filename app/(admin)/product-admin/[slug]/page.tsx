"use client";

import { Loader2, Trash2, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

import Container from "@/components/admin-layout/container";
import Header from "@/components/admin-layout/header";
import { ProductDescriptionEditor } from "@/components/admin-layout/product-description-editor";
import { AuthFeedbackDialog } from "@/components/ui/auth-feedback-dialog";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
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

type ProductDetail = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  shortSpec: string | null;
  description: string | null;
  basePrice: number;
  compareAtPrice: number | null;
  stock: number;
  weightGrams: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  coverImageUrl: string;
  galleryImageUrls: string[];
  category: { id: string; name: string; slug: string } | null;
};

type EditableForm = {
  name: string;
  sku: string;
  shortSpec: string;
  description: string;
  basePrice: string;
  compareAtPrice: string;
  stock: string;
  weightGrams: string;
  categoryId: string;
  status: "DRAFT" | "PUBLISHED";
};

function toEditableForm(product: ProductDetail): EditableForm {
  return {
    name: product.name,
    sku: product.sku,
    shortSpec: product.shortSpec ?? "",
    description: product.description ?? "",
    basePrice: String(product.basePrice),
    compareAtPrice: product.compareAtPrice !== null ? String(product.compareAtPrice) : "",
    stock: String(product.stock),
    weightGrams: String(product.weightGrams),
    categoryId: product.category?.id ?? "",
    status: product.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
  };
}

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const currentSlug = params.slug;
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [form, setForm] = useState<EditableForm | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [galleryImageUrls, setGalleryImageUrls] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    variant: "success" | "error";
    title: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    if (!currentSlug) return;

    const loadData = async () => {
      setIsLoading(true);

      const [productResponse, categoriesResponse] = await Promise.all([
        fetch(`/api/admin/products/${currentSlug}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/admin/categories", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      const productData = (await productResponse.json().catch(() => ({}))) as {
        product?: ProductDetail;
        error?: string;
      };
      const categoryData = (await categoriesResponse.json().catch(() => ({}))) as {
        categories?: CategoryOption[];
      };

      setCategories(categoryData.categories ?? []);

      if (!productResponse.ok || !productData.product) {
        setProduct(null);
        setForm(null);
        setIsLoading(false);
        return;
      }

      setProduct(productData.product);
      setForm(toEditableForm(productData.product));
      setCoverImageUrl(productData.product.coverImageUrl);
      setGalleryImageUrls(productData.product.galleryImageUrls ?? []);
      setIsLoading(false);
    };

    void loadData();
  }, [currentSlug]);

  const pageTitle = useMemo(() => {
    if (!product) return "Detail Produk";
    return product.name.length > 48 ? `${product.name.slice(0, 48)}...` : product.name;
  }, [product]);

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
    setGalleryImageUrls((prev) => prev.filter((image) => image !== uploaded.url));
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
    if (!form || !product) return;

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
    const response = await fetch(`/api/admin/products/${product.slug}`, {
      method: "PATCH",
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

    const data = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      product?: ProductDetail;
      error?: string;
    };

    setIsSubmitting(false);

    if (!response.ok || !data.success || !data.product) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Menyimpan Perubahan",
        description: data.error ?? "Periksa kembali data produk.",
      });
      return;
    }

    setProduct(data.product);
    setForm(toEditableForm(data.product));
    setCoverImageUrl(data.product.coverImageUrl);
    setGalleryImageUrls(data.product.galleryImageUrls ?? []);

    setFeedback({
      open: true,
      variant: "success",
      title: "Perubahan Tersimpan",
      description: "Data produk berhasil diperbarui.",
    });

    if (data.product.slug !== currentSlug) {
      router.replace(`/product-admin/${data.product.slug}`);
    } else {
      router.refresh();
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    
    setIsDeleting(true);
    const response = await fetch(`/api/admin/products/${product.slug}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setIsDeleting(false);

    if (!response.ok) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Menghapus Produk",
        description: data.error ?? "Terjadi kendala saat menghapus produk.",
      });
      return;
    }

    setIsDeleteDialogOpen(false);
    router.push("/products-admin");
  };

  return (
    <div className="min-h-screen pb-24">
      <Header
        breadcrumbItems={[
          { label: "Produk", href: "/products-admin" },
          { label: pageTitle },
        ]}
      />

      <Container className="space-y-4 py-4">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-5 animate-spin text-dark-grey/60" />
          </div>
        ) : !form || !product ? (
          <div className="rounded-lg border border-dashed border-border-grey bg-white p-6 text-center text-sm text-dark-grey/70">
            Produk tidak ditemukan atau sudah dihapus.
          </div>
        ) : (
          <form className="grid items-start gap-4 xl:grid-cols-[2fr_1.3fr]" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <section className="space-y-5 rounded-lg bg-white p-4">
                <h2 className="text-sm font-semibold text-secondary">Informasi Dasar</h2>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-secondary">Nama Produk</label>
                  <Input
                    required
                    value={form.name}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
                    className="h-10 border-border-grey bg-white text-sm"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-secondary">SKU</label>
                  <Input
                    required
                    value={form.sku}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, sku: event.target.value } : prev))}
                    className="h-10 border-border-grey bg-white text-sm"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-secondary">Spesifikasi Singkat</label>
                  <Input
                    value={form.shortSpec}
                    onChange={(event) =>
                      setForm((prev) => (prev ? { ...prev, shortSpec: event.target.value } : prev))
                    }
                    className="h-10 border-border-grey bg-white text-sm"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-secondary">Deskripsi</label>
                  <ProductDescriptionEditor
                    initialValue={form.description}
                    onChange={(nextValue) =>
                      setForm((prev) => (prev ? { ...prev, description: nextValue } : prev))
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
                      onChange={(event) =>
                        setForm((prev) => (prev ? { ...prev, basePrice: event.target.value } : prev))
                      }
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
                        setForm((prev) =>
                          prev ? { ...prev, compareAtPrice: event.target.value } : prev,
                        )
                      }
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
                      onChange={(event) =>
                        setForm((prev) => (prev ? { ...prev, stock: event.target.value } : prev))
                      }
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
                        setForm((prev) => (prev ? { ...prev, weightGrams: event.target.value } : prev))
                      }
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
                      setForm((prev) =>
                        prev ? { ...prev, categoryId: value === "none" ? "" : value } : prev,
                      )
                    }
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
                      setForm((prev) => (prev ? { ...prev, status: value as "DRAFT" | "PUBLISHED" } : prev))
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
                  className="h-10 rounded-lg border-rose-200 bg-white px-4 text-sm text-rose-600 hover:bg-rose-50"
                  disabled={isDeleting || isSubmitting}
                  onClick={() => {
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  {isDeleting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="size-4" />
                      Hapus Produk
                    </>
                  )}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isUploadingCover || isUploadingGallery}
                  className="h-10 rounded-lg bg-primary-orange px-5 text-sm font-semibold text-white hover:bg-primary-orange/90"
                >
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Simpan Perubahan"
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </Container>

      <ConfirmActionDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!isDeleting) {
            setIsDeleteDialogOpen(open);
          }
        }}
        variant="error"
        visualStyle="dangerCard"
        title="Hapus produk?"
        description="Yakin ingin menghapus produk ini? Setelah dihapus, data tidak dapat dipulihkan lagi."
        confirmLabel="Ya, hapus permanen"
        confirmTone="dangerSoft"
        confirmIcon={<Trash2 className="h-4 w-4" />}
        cancelLabel=""
        loading={isDeleting}
        onConfirm={() => {
          void handleDelete();
        }}
      />

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
