"use client";

import {
  FolderPlus,
  Loader2,
  MoreVertical,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import Container from "@/components/admin-layout/container";
import Header from "@/components/admin-layout/header";
import ProductCard from "@/components/admin-layout/product-card";
import { AuthFeedbackDialog } from "@/components/ui/auth-feedback-dialog";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
};

type ProductItem = {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
  stock: number;
  soldCount: number;
  coverImageUrl: string;
};

type ProductsResponse = {
  items: ProductItem[];
};

type CategoryDialogMode = "create" | "edit";

async function fetchCategories() {
  const response = await fetch("/api/admin/categories", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    return [] as CategoryItem[];
  }

  const data = (await response.json().catch(() => ({}))) as {
    categories?: CategoryItem[];
  };

  return data.categories ?? [];
}

export default function ProductsPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [categoryDialogMode, setCategoryDialogMode] = useState<CategoryDialogMode>("create");
  const [categoryNameInput, setCategoryNameInput] = useState("");
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [isCategorySaving, setIsCategorySaving] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);
  const [isCategoryDeleting, setIsCategoryDeleting] = useState(false);

  const [feedback, setFeedback] = useState<{
    open: boolean;
    variant: "success" | "error";
    title: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const nextCategories = await fetchCategories();
      if (!mounted) return;
      setCategories(nextCategories);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.set("q", searchTerm);
      if (activeCategory !== "all") {
        params.set("categorySlug", activeCategory);
      }
      params.set("pageSize", "48");

      const response = await fetch(`/api/admin/products?${params.toString()}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        if (!mounted) return;
        setProducts([]);
        setIsLoading(false);
        return;
      }

      const data = (await response.json().catch(() => ({}))) as ProductsResponse;
      if (!mounted) return;
      setProducts(data.items ?? []);
      setIsLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [activeCategory, searchTerm]);

  const categoryButtons = useMemo(
    () => [
      {
        id: "all",
        slug: "all",
        name: "Semua Produk",
        productCount: categories.reduce((sum, item) => sum + item.productCount, 0),
        isSystem: true,
      },
      ...categories.map((category) => ({
        id: category.id,
        slug: category.slug,
        name: category.name,
        productCount: category.productCount,
        isSystem: false,
      })),
    ],
    [categories],
  );

  const activeCategoryLabel =
    categoryButtons.find((category) => category.slug === activeCategory)?.name ?? "Semua Produk";

  const refreshCategoriesAfterMutation = async () => {
    const nextCategories = await fetchCategories();
    setCategories(nextCategories);

    if (activeCategory !== "all" && !nextCategories.some((item) => item.slug === activeCategory)) {
      setActiveCategory("all");
      setIsLoading(true);
    }
  };

  const openCreateCategoryDialog = () => {
    setIsFabOpen(false);
    setCategoryDialogMode("create");
    setEditingCategory(null);
    setCategoryNameInput("");
    setIsCategoryDialogOpen(true);
  };

  const openEditCategoryDialog = (category: CategoryItem) => {
    setCategoryDialogMode("edit");
    setEditingCategory(category);
    setCategoryNameInput(category.name);
    setIsCategoryDialogOpen(true);
  };

  const openDeleteCategoryDialog = (category: CategoryItem) => {
    setDeletingCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitCategory = async () => {
    const normalizedName = categoryNameInput.trim();
    if (normalizedName.length < 2) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Nama Kategori Tidak Valid",
        description: "Nama kategori minimal 2 karakter.",
      });
      return;
    }

    setIsCategorySaving(true);

    const isEdit = categoryDialogMode === "edit" && editingCategory;
    const response = await fetch(
      isEdit ? `/api/admin/categories/${editingCategory.id}` : "/api/admin/categories",
      {
        method: isEdit ? "PATCH" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: normalizedName,
        }),
      },
    );

    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setIsCategorySaving(false);

    if (!response.ok) {
      setFeedback({
        open: true,
        variant: "error",
        title: isEdit ? "Gagal Memperbarui Kategori" : "Gagal Menambahkan Kategori",
        description: data.error ?? "Coba lagi beberapa saat.",
      });
      return;
    }

    await refreshCategoriesAfterMutation();
    setIsCategoryDialogOpen(false);
    setCategoryNameInput("");
    setEditingCategory(null);

    setFeedback({
      open: true,
      variant: "success",
      title: isEdit ? "Kategori Diperbarui" : "Kategori Ditambahkan",
      description: isEdit
        ? "Perubahan kategori berhasil disimpan."
        : "Kategori baru berhasil dibuat.",
    });
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    setIsCategoryDeleting(true);
    const response = await fetch(`/api/admin/categories/${deletingCategory.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setIsCategoryDeleting(false);

    if (!response.ok) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Menghapus Kategori",
        description: data.error ?? "Kategori tidak berhasil dihapus.",
      });
      return;
    }

    await refreshCategoriesAfterMutation();
    setIsDeleteDialogOpen(false);
    setDeletingCategory(null);

    setFeedback({
      open: true,
      variant: "success",
      title: "Kategori Dihapus",
      description: "Kategori berhasil dihapus.",
    });
  };

  return (
    <div>
      <Header title="Produk" />

      <Container className="flex flex-col gap-6 py-6 pb-24">
        <section className="flex items-stretch gap-4 overflow-x-auto pb-2">
          {categoryButtons.map((category) => {
            const isActive = category.slug === activeCategory;
            const realCategory = categories.find((item) => item.id === category.id);

            return (
              <div
                key={category.id}
                className={cn(
                  "relative min-w-48 rounded-lg border bg-white px-4 py-3",
                  isActive ? "border-primary-orange" : "border-transparent hover:border-dark-grey/25",
                )}
              >
                <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
                  {!category.isSystem && realCategory ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-border-grey text-dark-grey/70 hover:bg-light-grey"
                          onClick={(event) => {
                            event.stopPropagation();
                          }}
                          aria-label={`Aksi kategori ${category.name}`}
                        >
                          <MoreVertical className="size-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" sideOffset={6}>
                        <DropdownMenuItem
                          onClick={() => openEditCategoryDialog(realCategory)}
                          className="cursor-pointer"
                        >
                          <Pencil className="size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openDeleteCategoryDialog(realCategory)}
                          className="cursor-pointer text-rose-600 focus:text-rose-600"
                        >
                          <Trash2 className="size-4" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsLoading(true);
                    setActiveCategory(category.slug);
                  }}
                  className="block w-full cursor-pointer pr-9 text-left"
                >
                  <p
                    className={cn(
                      "text-xs",
                      isActive ? "font-semibold text-primary-orange" : "font-normal text-secondary/80",
                    )}
                  >
                    {category.name}
                  </p>
                  <p className={cn("mt-2 text-xs text-dark-grey/80", isActive ? "text-primary-orange" : "")}>
                    {category.productCount} items
                  </p>
                </button>
              </div>
            );
          })}
        </section>

        <section className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-sm font-semibold text-secondary">
              Daftar Produk{" "}
              <span className="font-extralight text-dark-grey">{activeCategoryLabel}</span>
            </h2>

            <InputGroup className="w-full max-w-[540px] rounded-full border-border-grey bg-white px-1 py-5 shadow-none">
              <InputGroupAddon align="inline-start" className="text-dark-grey">
                <Search className="h-4 w-4" />
              </InputGroupAddon>
              <InputGroupInput
                type="text"
                placeholder="Cari produk (nama/SKU/slug)"
                value={searchInput}
                onChange={(event) => {
                  setIsLoading(true);
                  setSearchInput(event.target.value);
                }}
                className="text-sm text-secondary placeholder:text-dark-grey"
              />
            </InputGroup>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-5 animate-spin text-dark-grey/60" />
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border-grey bg-white p-6 text-center text-sm text-dark-grey/70">
              Belum ada produk pada filter ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {products.map((product) => (
                <Link key={product.id} href={`/product-admin/${product.slug}`} className="no-underline">
                  <ProductCard
                    title={product.name}
                    price={product.basePrice}
                    stock={product.stock}
                    sold={product.soldCount}
                    imageSrc={product.coverImageUrl || "/image.png"}
                    className="h-full max-w-none"
                  />
                </Link>
              ))}
            </div>
          )}
        </section>
      </Container>

      <div className="fixed right-6 bottom-6 z-30 flex flex-col items-end gap-3 md:right-8 md:bottom-8">
        <div
          className={cn(
            "flex flex-col items-end gap-2 transition-all duration-300",
            isFabOpen
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-2 opacity-0",
          )}
        >
          <Link
            href="/products-admin/new"
            onClick={() => setIsFabOpen(false)}
            className="flex items-center gap-2 rounded-full border border-border-grey bg-white px-4 py-2 text-sm text-secondary shadow-sm hover:bg-light-grey"
          >
            <PackagePlus className="size-4 text-primary-orange" />
            Tambah Produk
          </Link>

          <button
            type="button"
            onClick={openCreateCategoryDialog}
            className="flex items-center gap-2 rounded-full border border-border-grey bg-white px-4 py-2 text-sm text-secondary shadow-sm hover:bg-light-grey"
          >
            <FolderPlus className="size-4 text-primary-orange" />
            Tambah Kategori
          </button>
        </div>

        <button
          type="button"
          aria-label="Aksi tambah"
          onClick={() => setIsFabOpen((prev) => !prev)}
          className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-primary-orange text-white shadow-lg transition hover:bg-primary-orange/90"
        >
          <Plus className={cn("h-7 w-7 transition-transform duration-300", isFabOpen && "rotate-45")} />
        </button>
      </div>

      <Dialog
        open={isCategoryDialogOpen}
        onOpenChange={(open) => {
          if (!isCategorySaving) {
            setIsCategoryDialogOpen(open);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {categoryDialogMode === "create" ? "Tambah Kategori" : "Edit Kategori"}
            </DialogTitle>
            <DialogDescription>
              {categoryDialogMode === "create"
                ? "Masukkan nama kategori baru untuk produk."
                : "Ubah nama kategori sesuai kebutuhan."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-secondary">Nama Kategori</label>
            <InputGroup className="w-full rounded-lg border border-border-grey bg-white">
              <InputGroupInput
                value={categoryNameInput}
                onChange={(event) => setCategoryNameInput(event.target.value)}
                placeholder="Contoh: Aksesoris"
              />
            </InputGroup>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isCategorySaving}
              onClick={() => setIsCategoryDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              className="bg-primary-orange text-white hover:bg-primary-orange/90"
              disabled={isCategorySaving}
              onClick={() => {
                void handleSubmitCategory();
              }}
            >
              {isCategorySaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : categoryDialogMode === "create" ? (
                "Simpan Kategori"
              ) : (
                "Simpan Perubahan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!isCategoryDeleting) {
            setIsDeleteDialogOpen(open);
          }
        }}
        variant="error"
        visualStyle="dangerCard"
        title="Hapus kategori?"
        description={`Yakin ingin menghapus kategori ${
          deletingCategory?.name ? `"${deletingCategory.name}"` : "ini"
        }? Produk yang memakai kategori ini akan menjadi tanpa kategori.`}
        confirmLabel="Ya, hapus"
        confirmTone="dangerSoft"
        confirmIcon={<Trash2 className="h-4 w-4" />}
        cancelLabel=""
        loading={isCategoryDeleting}
        onConfirm={() => {
          void handleDeleteCategory();
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
