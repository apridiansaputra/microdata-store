"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Camera,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import Container from "@/components/admin-layout/container";
import Header from "@/components/admin-layout/header";
import { useAdminAuth } from "@/components/auth/admin-auth-context";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { uploadBannerImageFile } from "@/lib/settings/upload-client";
import { cn } from "@/lib/utils";

type AppSettings = {
  shippingCourierCode: string;
  shippingCourierName: string;
  shippingTrackingBaseUrl: string | null;
  bannerAutoplayMs: number;
};

type BannerItem = {
  id: string;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  altText: string | null;
  targetUrl: string | null;
  isActive: boolean;
  sortOrder: number;
};

type AuthBannerItem = {
  id: string;
  imageUrl: string;
  altText: string | null;
  title: string | null;
  subtitle: string | null;
  isActive: boolean;
  sortOrder: number;
};

type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  username: string | null;
  role: "ADMIN" | "SUPER_ADMIN";
  status: "ACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED" | "DELETED";
  createdAt: string;
  lastLoginAt?: string | null;
};

const COURIER_OPTIONS = [
  { code: "jne", name: "JNE" },
  { code: "sicepat", name: "SiCepat" },
  { code: "jnt", name: "J&T Express" },
  { code: "pos", name: "POS Indonesia" },
  { code: "tiki", name: "TIKI" },
  { code: "ninja", name: "Ninja Xpress" },
  { code: "lion", name: "Lion Parcel" },
];

const emptyBannerForm = {
  id: "",
  title: "",
  subtitle: "",
  imageUrl: "",
  altText: "",
  targetUrl: "",
  isActive: true,
  sortOrder: "",
};

const emptyAuthBannerForm = {
  id: "",
  imageUrl: "",
  altText: "",
  title: "",
  subtitle: "",
  isActive: true,
  sortOrder: "",
};

export default function AdminSettingsPage() {
  const { user } = useAdminAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [isLoadingBanners, setIsLoadingBanners] = useState(true);
  const [isBannerDialogOpen, setIsBannerDialogOpen] = useState(false);
  const [bannerDialogMode, setBannerDialogMode] = useState<"create" | "edit">("create");
  const [bannerForm, setBannerForm] = useState({ ...emptyBannerForm });
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isSavingBanner, setIsSavingBanner] = useState(false);
  const [isDeleteBannerOpen, setIsDeleteBannerOpen] = useState(false);
  const [deletingBannerId, setDeletingBannerId] = useState<string | null>(null);

  // Auth Banner state
  const [authBanners, setAuthBanners] = useState<AuthBannerItem[]>([]);
  const [isLoadingAuthBanners, setIsLoadingAuthBanners] = useState(true);
  const [isAuthBannerDialogOpen, setIsAuthBannerDialogOpen] = useState(false);
  const [authBannerDialogMode, setAuthBannerDialogMode] = useState<"create" | "edit">("create");
  const [authBannerForm, setAuthBannerForm] = useState({ ...emptyAuthBannerForm });
  const [isUploadingAuthBanner, setIsUploadingAuthBanner] = useState(false);
  const [isSavingAuthBanner, setIsSavingAuthBanner] = useState(false);
  const [isDeleteAuthBannerOpen, setIsDeleteAuthBannerOpen] = useState(false);
  const [deletingAuthBannerId, setDeletingAuthBannerId] = useState<string | null>(null);

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminForm, setAdminForm] = useState({
    fullName: "",
    email: "",
    username: "",
    phone: "",
    password: "",
  });

  // Edit admin state
  const [isEditAdminDialogOpen, setIsEditAdminDialogOpen] = useState(false);
  const [isSavingEditAdmin, setIsSavingEditAdmin] = useState(false);
  const [showEditAdminPassword, setShowEditAdminPassword] = useState(false);
  const [editAdminForm, setEditAdminForm] = useState({
    id: "",
    fullName: "",
    email: "",
    username: "",
    phone: "",
    role: "ADMIN" as "ADMIN" | "SUPER_ADMIN",
    status: "ACTIVE" as "ACTIVE" | "SUSPENDED",
    password: "",
  });

  // Delete admin state
  const [isDeleteAdminOpen, setIsDeleteAdminOpen] = useState(false);
  const [deletingAdminId, setDeletingAdminId] = useState<string | null>(null);

  const adminPasswordRules = [
    { label: "Minimal 12 karakter", isValid: adminForm.password.length >= 12 },
    {
      label: "Mengandung huruf kapital (A-Z)",
      isValid: /[A-Z]/.test(adminForm.password),
    },
    {
      label: "Mengandung huruf kecil (a-z)",
      isValid: /[a-z]/.test(adminForm.password),
    },
    {
      label: "Mengandung angka (0-9)",
      isValid: /\d/.test(adminForm.password),
    },
    {
      label: "Mengandung simbol (contoh: !@#$%)",
      isValid: /[^A-Za-z0-9]/.test(adminForm.password),
    },
  ];

  const [feedback, setFeedback] = useState<{
    open: boolean;
    variant: "success" | "error" | "warning" | "info";
    title: string;
    description: string;
  } | null>(null);

  const courierLabel = useMemo(() => {
    if (!settings?.shippingCourierCode) return "Ekspedisi";
    const match = COURIER_OPTIONS.find((item) => item.code === settings.shippingCourierCode);
    return match?.name ?? settings.shippingCourierName ?? "Ekspedisi";
  }, [settings]);

  const loadSettings = useCallback(async () => {
    setIsLoadingSettings(true);
    const response = await fetch("/api/admin/settings/app", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    const data = (await response.json().catch(() => ({}))) as {
      settings?: AppSettings;
      error?: string;
    };
    setIsLoadingSettings(false);

    if (!response.ok || !data.settings) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Memuat Settings",
        description: data.error ?? "Data settings belum bisa ditampilkan.",
      });
      return;
    }
    setSettings(data.settings);
  }, []);

  const loadBanners = useCallback(async () => {
    setIsLoadingBanners(true);
    const response = await fetch("/api/admin/settings/banners", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    const data = (await response.json().catch(() => ({}))) as {
      banners?: BannerItem[];
      error?: string;
    };
    setIsLoadingBanners(false);

    if (!response.ok) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Memuat Banner",
        description: data.error ?? "Daftar banner belum dapat ditampilkan.",
      });
      return;
    }
    setBanners(data.banners ?? []);
  }, []);

  const loadAuthBanners = useCallback(async () => {
    setIsLoadingAuthBanners(true);
    const response = await fetch("/api/admin/settings/auth-banner", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    const data = (await response.json().catch(() => ({}))) as {
      banners?: AuthBannerItem[];
      error?: string;
    };
    setIsLoadingAuthBanners(false);

    if (!response.ok) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Memuat Auth Banner",
        description: data.error ?? "Daftar auth banner belum dapat ditampilkan.",
      });
      return;
    }
    setAuthBanners(data.banners ?? []);
  }, []);

  const loadAdmins = useCallback(async () => {
    if (!isSuperAdmin) return;
    setIsLoadingAdmins(true);
    const response = await fetch("/api/admin/settings/admins", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    const data = (await response.json().catch(() => ({}))) as {
      admins?: AdminUser[];
      error?: string;
    };
    setIsLoadingAdmins(false);

    if (!response.ok) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Memuat Admin",
        description: data.error ?? "Data admin belum dapat ditampilkan.",
      });
      return;
    }
    setAdminUsers(data.admins ?? []);
  }, [isSuperAdmin]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSettings();
      void loadBanners();
      void loadAuthBanners();
      void loadAdmins();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAdmins, loadBanners, loadAuthBanners, loadSettings]);

  const handleSaveSettings = async () => {
    if (!settings) return;
    setIsSavingSettings(true);
    const response = await fetch("/api/admin/settings/app", {
      method: "PUT",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = (await response.json().catch(() => ({}))) as {
      settings?: AppSettings;
      error?: string;
    };
    setIsSavingSettings(false);

    if (!response.ok || !data.settings) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Menyimpan Settings",
        description: data.error ?? "Perubahan belum tersimpan.",
      });
      return;
    }

    setSettings(data.settings);
    setFeedback({
      open: true,
      variant: "success",
      title: "Settings Tersimpan",
      description: "Pengaturan ekspedisi berhasil diperbarui.",
    });
  };

  // ── HomeBanner handlers ────────────────────────────────────────────────────

  const openCreateBanner = () => {
    setBannerDialogMode("create");
    setBannerForm({ ...emptyBannerForm });
    setIsBannerDialogOpen(true);
  };

  const openEditBanner = (banner: BannerItem) => {
    setBannerDialogMode("edit");
    setBannerForm({
      id: banner.id,
      title: banner.title ?? "",
      subtitle: banner.subtitle ?? "",
      imageUrl: banner.imageUrl,
      altText: banner.altText ?? "",
      targetUrl: banner.targetUrl ?? "",
      isActive: banner.isActive,
      sortOrder: String(banner.sortOrder ?? 0),
    });
    setIsBannerDialogOpen(true);
  };

  const handleUploadBanner = async (file: File | null) => {
    if (!file) return;
    setIsUploadingBanner(true);
    const uploaded = await uploadBannerImageFile(file);
    setIsUploadingBanner(false);

    if (!uploaded.ok) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Upload Gambar Gagal",
        description: uploaded.error,
      });
      return;
    }

    setBannerForm((prev) => ({ ...prev, imageUrl: uploaded.url }));
  };

  const handleSaveBanner = async () => {
    if (!bannerForm.imageUrl) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gambar Banner Kosong",
        description: "Silakan upload gambar banner terlebih dahulu.",
      });
      return;
    }

    setIsSavingBanner(true);
    const payload = {
      title: bannerForm.title.trim() || undefined,
      subtitle: bannerForm.subtitle.trim() || undefined,
      imageUrl: bannerForm.imageUrl,
      altText: bannerForm.altText.trim() || undefined,
      targetUrl: bannerForm.targetUrl.trim() || undefined,
      isActive: bannerForm.isActive,
      sortOrder: bannerForm.sortOrder ? Number(bannerForm.sortOrder) : undefined,
    };

    const response = await fetch(
      bannerDialogMode === "create"
        ? "/api/admin/settings/banners"
        : `/api/admin/settings/banners/${bannerForm.id}`,
      {
        method: bannerDialogMode === "create" ? "POST" : "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setIsSavingBanner(false);

    if (!response.ok) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Menyimpan Banner",
        description: data.error ?? "Perubahan banner belum tersimpan.",
      });
      return;
    }

    setIsBannerDialogOpen(false);
    await loadBanners();
    setFeedback({
      open: true,
      variant: "success",
      title: "Banner Tersimpan",
      description: "Banner berhasil diperbarui.",
    });
  };

  const handleDeleteBanner = async () => {
    if (!deletingBannerId) return;
    const response = await fetch(`/api/admin/settings/banners/${deletingBannerId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Menghapus Banner",
        description: data.error ?? "Banner belum terhapus.",
      });
      return;
    }
    setIsDeleteBannerOpen(false);
    setDeletingBannerId(null);
    await loadBanners();
  };

  // ── AuthBanner handlers ────────────────────────────────────────────────────

  const openCreateAuthBanner = () => {
    setAuthBannerDialogMode("create");
    setAuthBannerForm({ ...emptyAuthBannerForm });
    setIsAuthBannerDialogOpen(true);
  };

  const openEditAuthBanner = (banner: AuthBannerItem) => {
    setAuthBannerDialogMode("edit");
    setAuthBannerForm({
      id: banner.id,
      imageUrl: banner.imageUrl,
      altText: banner.altText ?? "",
      title: banner.title ?? "",
      subtitle: banner.subtitle ?? "",
      isActive: banner.isActive,
      sortOrder: String(banner.sortOrder ?? 0),
    });
    setIsAuthBannerDialogOpen(true);
  };

  const handleUploadAuthBanner = async (file: File | null) => {
    if (!file) return;
    setIsUploadingAuthBanner(true);
    const uploaded = await uploadBannerImageFile(file);
    setIsUploadingAuthBanner(false);

    if (!uploaded.ok) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Upload Gambar Gagal",
        description: uploaded.error,
      });
      return;
    }

    setAuthBannerForm((prev) => ({ ...prev, imageUrl: uploaded.url }));
  };

  const handleSaveAuthBanner = async () => {
    if (!authBannerForm.imageUrl) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gambar Banner Kosong",
        description: "Silakan upload gambar banner terlebih dahulu.",
      });
      return;
    }

    setIsSavingAuthBanner(true);
    const payload = {
      imageUrl: authBannerForm.imageUrl,
      altText: authBannerForm.altText.trim() || undefined,
      title: authBannerForm.title.trim() || undefined,
      subtitle: authBannerForm.subtitle.trim() || undefined,
      isActive: authBannerForm.isActive,
      sortOrder: authBannerForm.sortOrder ? Number(authBannerForm.sortOrder) : undefined,
    };

    const response = await fetch(
      authBannerDialogMode === "create"
        ? "/api/admin/settings/auth-banner"
        : `/api/admin/settings/auth-banner/${authBannerForm.id}`,
      {
        method: authBannerDialogMode === "create" ? "POST" : "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setIsSavingAuthBanner(false);

    if (!response.ok) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Menyimpan Auth Banner",
        description: data.error ?? "Perubahan auth banner belum tersimpan.",
      });
      return;
    }

    setIsAuthBannerDialogOpen(false);
    await loadAuthBanners();
    setFeedback({
      open: true,
      variant: "success",
      title: "Auth Banner Tersimpan",
      description: "Banner halaman login/register berhasil diperbarui.",
    });
  };

  const handleDeleteAuthBanner = async () => {
    if (!deletingAuthBannerId) return;
    const response = await fetch(`/api/admin/settings/auth-banner/${deletingAuthBannerId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Menghapus Auth Banner",
        description: data.error ?? "Auth banner belum terhapus.",
      });
      return;
    }
    setIsDeleteAuthBannerOpen(false);
    setDeletingAuthBannerId(null);
    await loadAuthBanners();
  };

  // ── Admin handlers ─────────────────────────────────────────────────────────

  const handleCreateAdmin = async () => {
    if (!isSuperAdmin) return;
    setIsCreatingAdmin(true);
    const response = await fetch("/api/admin/settings/admins", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(adminForm),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setIsCreatingAdmin(false);

    if (!response.ok) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Menambah Admin",
        description: data.error ?? "Admin baru belum bisa dibuat.",
      });
      return;
    }

    setAdminForm({
      fullName: "",
      email: "",
      username: "",
      phone: "",
      password: "",
    });
    await loadAdmins();
    setFeedback({
      open: true,
      variant: "success",
      title: "Admin Ditambahkan",
      description: "Admin baru berhasil dibuat.",
    });
  };

  const openEditAdmin = (admin: AdminUser) => {
    setEditAdminForm({
      id: admin.id,
      fullName: admin.fullName,
      email: admin.email,
      username: admin.username ?? "",
      phone: "",
      role: admin.role,
      status: admin.status === "ACTIVE" || admin.status === "SUSPENDED" ? admin.status : "ACTIVE",
      password: "",
    });
    setShowEditAdminPassword(false);
    setIsEditAdminDialogOpen(true);
  };

  const handleSaveEditAdmin = async () => {
    setIsSavingEditAdmin(true);
    const payload: Record<string, unknown> = {
      fullName: editAdminForm.fullName,
      email: editAdminForm.email,
      username: editAdminForm.username.trim() || undefined,
      phone: editAdminForm.phone.trim() || undefined,
      role: editAdminForm.role,
      status: editAdminForm.status,
    };
    if (editAdminForm.password.trim()) {
      payload.password = editAdminForm.password;
    }
    const response = await fetch(`/api/admin/settings/admins/${editAdminForm.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setIsSavingEditAdmin(false);

    if (!response.ok) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Memperbarui Admin",
        description: data.error ?? "Data admin belum tersimpan.",
      });
      return;
    }
    setIsEditAdminDialogOpen(false);
    await loadAdmins();
    setFeedback({
      open: true,
      variant: "success",
      title: "Admin Diperbarui",
      description: "Data admin berhasil diperbarui.",
    });
  };

  const handleDeleteAdmin = async () => {
    if (!deletingAdminId) return;
    const response = await fetch(`/api/admin/settings/admins/${deletingAdminId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Menghapus Admin",
        description: data.error ?? "Admin belum terhapus.",
      });
      return;
    }
    setIsDeleteAdminOpen(false);
    setDeletingAdminId(null);
    await loadAdmins();
    setFeedback({
      open: true,
      variant: "success",
      title: "Admin Dihapus",
      description: "Admin berhasil dihapus dari sistem.",
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header title="Settings" />

      <Container className="space-y-6 py-6 pb-24">

        {/* ── Section: Home Banner ──────────────────────────────────────── */}
        <section className="rounded-2xl bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-secondary">Kelola Konten Aplikasi</h2>
              <p className="mt-1 text-xs text-dark-grey">
                Atur banner utama yang tampil di halaman user.
              </p>
            </div>
            <Button
              type="button"
              onClick={openCreateBanner}
              className="h-9 rounded-md bg-primary-orange px-4 text-xs font-semibold text-white hover:bg-primary-orange/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Banner
            </Button>
          </div>

          {isLoadingBanners ? (
            <div className="mt-4 flex items-center gap-2 text-xs text-dark-grey/70">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memuat banner...
            </div>
          ) : banners.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-border-grey bg-light-grey/30 p-6 text-center text-xs text-dark-grey">
              Belum ada banner aktif. Tambahkan banner pertama untuk halaman utama.
            </div>
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {banners.map((banner) => (
                <div key={banner.id} className="rounded-xl border border-border-grey bg-white p-4">
                  <div className="flex gap-4">
                    <div className="relative h-24 w-36 overflow-hidden rounded-lg bg-light-grey">
                      <Image
                        src={banner.imageUrl}
                        alt={banner.altText ?? banner.title ?? "Banner"}
                        fill
                        className="object-cover"
                        sizes="144px"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-secondary">
                          {banner.title ?? "Banner tanpa judul"}
                        </h3>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            banner.isActive ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-500",
                          )}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {banner.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                      <p className="text-xs text-dark-grey">
                        {banner.subtitle ?? "Tidak ada deskripsi tambahan."}
                      </p>
                      <p className="text-[11px] text-dark-grey">
                        Urutan tampil: {banner.sortOrder}
                      </p>
                      <div className="flex gap-2 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 border-primary-orange text-[11px] text-primary-orange hover:bg-primary-orange/10"
                          onClick={() => openEditBanner(banner)}
                        >
                          <Pencil className="mr-1 h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 border-rose-200 text-[11px] text-rose-600 hover:bg-rose-50"
                          onClick={() => {
                            setDeletingBannerId(banner.id);
                            setIsDeleteBannerOpen(true);
                          }}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Hapus
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Section: Auth Banner (Login & Register) ───────────────────── */}
        <section className="rounded-2xl bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-secondary">Banner Halaman Login &amp; Register</h2>
              <p className="mt-1 text-xs text-dark-grey">
                Atur gambar dekoratif yang tampil di sisi kanan halaman login dan register.
              </p>
            </div>
            <Button
              type="button"
              onClick={openCreateAuthBanner}
              className="h-9 rounded-md bg-primary-orange px-4 text-xs font-semibold text-white hover:bg-primary-orange/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Banner
            </Button>
          </div>

          {isLoadingAuthBanners ? (
            <div className="mt-4 flex items-center gap-2 text-xs text-dark-grey/70">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memuat auth banner...
            </div>
          ) : authBanners.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-border-grey bg-light-grey/30 p-6 text-center text-xs text-dark-grey">
              Belum ada banner. Tambahkan banner untuk ditampilkan di halaman login &amp; register.
            </div>
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {authBanners.map((banner) => (
                <div key={banner.id} className="rounded-xl border border-border-grey bg-white p-4">
                  <div className="flex gap-4">
                    <div className="relative h-24 w-36 overflow-hidden rounded-lg bg-light-grey">
                      <Image
                        src={banner.imageUrl}
                        alt={banner.altText ?? banner.title ?? "Auth Banner"}
                        fill
                        className="object-cover"
                        sizes="144px"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-secondary">
                          {banner.title ?? "Banner tanpa judul"}
                        </h3>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            banner.isActive ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-500",
                          )}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {banner.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                      <p className="text-xs text-dark-grey">
                        {banner.subtitle ?? "Tidak ada deskripsi tambahan."}
                      </p>
                      <p className="text-[11px] text-dark-grey">
                        Urutan tampil: {banner.sortOrder}
                      </p>
                      <div className="flex gap-2 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 border-primary-orange text-[11px] text-primary-orange hover:bg-primary-orange/10"
                          onClick={() => openEditAuthBanner(banner)}
                        >
                          <Pencil className="mr-1 h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 border-rose-200 text-[11px] text-rose-600 hover:bg-rose-50"
                          onClick={() => {
                            setDeletingAuthBannerId(banner.id);
                            setIsDeleteAuthBannerOpen(true);
                          }}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Hapus
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Section: Shipping Settings (Super Admin only) ─────────────── */}
        {isSuperAdmin ? (
          <section className="rounded-2xl bg-white p-6">
            <div>
              <h2 className="text-sm font-semibold text-secondary">Kelola Ekspedisi</h2>
              <p className="mt-1 text-xs text-dark-grey">
                Ekspedisi ini akan menjadi pilihan default di checkout.
              </p>
            </div>

            {isLoadingSettings || !settings ? (
              <div className="mt-4 flex items-center gap-2 text-xs text-dark-grey/70">
                <Loader2 className="h-4 w-4 animate-spin" />
                Memuat pengaturan...
              </div>
            ) : (
              <div className="mt-5 grid gap-4 lg:grid-cols-[240px_1fr]">
                <div className="rounded-lg border border-border-grey bg-light-grey/40 p-4 text-xs text-dark-grey">
                  <p className="text-xs font-semibold text-secondary">Ekspedisi Aktif</p>
                  <p className="mt-2 text-sm font-semibold text-primary-orange">{courierLabel}</p>
                  <p className="mt-1 text-[11px] text-dark-grey/80">
                    Kode: {settings.shippingCourierCode}
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-secondary">Pilih Ekspedisi</p>
                    <Select
                      value={settings.shippingCourierCode}
                      onValueChange={(value) =>
                        setSettings((prev) =>
                          prev
                            ? {
                              ...prev,
                              shippingCourierCode: value,
                              shippingCourierName:
                                COURIER_OPTIONS.find((item) => item.code === value)?.name ??
                                prev.shippingCourierName,
                            }
                            : prev,
                        )
                      }
                    >
                      <SelectTrigger className="h-9 border-border-grey bg-white text-xs text-secondary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COURIER_OPTIONS.map((option) => (
                          <SelectItem key={option.code} value={option.code}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-secondary">Nama Ekspedisi</p>
                    <Input
                      value={settings.shippingCourierName}
                      onChange={(event) =>
                        setSettings((prev) =>
                          prev ? { ...prev, shippingCourierName: event.target.value } : prev,
                        )
                      }
                      className="h-9 border-border-grey text-xs"
                      placeholder="Nama ekspedisi"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <p className="text-xs font-semibold text-secondary">Tautan Ekspedisi</p>
                    <Input
                      type="url"
                      inputMode="url"
                      value={settings.shippingTrackingBaseUrl ?? ""}
                      onChange={(event) =>
                        setSettings((prev) =>
                          prev ? { ...prev, shippingTrackingBaseUrl: event.target.value } : prev,
                        )
                      }
                      className="h-9 border-border-grey text-xs"
                      placeholder="https://ekspedisi.com/cek-resi"
                    />
                    <p className="text-[11px] text-dark-grey/80">
                      Tautan ini akan tampil di halaman pesanan user.
                    </p>
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      disabled={isSavingSettings}
                      onClick={handleSaveSettings}
                      className="h-9 rounded-md bg-primary-orange px-4 text-xs font-semibold text-white hover:bg-primary-orange/90"
                    >
                      {isSavingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </section>
        ) : null}

        {/* ── Section: Add Admin (Super Admin only) ─────────────────────── */}
        {isSuperAdmin ? (
          <section className="rounded-2xl bg-white p-6">
            <div>
              <h2 className="text-sm font-semibold text-secondary">Tambah Admin</h2>
              <p className="mt-1 text-xs text-dark-grey">
                Hanya Super Admin yang bisa membuat admin baru.
              </p>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
              <div className="space-y-3">
                <Input
                  value={adminForm.fullName}
                  onChange={(event) => setAdminForm((prev) => ({ ...prev, fullName: event.target.value }))}
                  className="h-9 border-border-grey text-xs"
                  placeholder="Nama lengkap"
                />
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={adminForm.email}
                  onChange={(event) => setAdminForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="h-9 border-border-grey text-xs"
                  placeholder="Email admin"
                />
                <Input
                  value={adminForm.username}
                  onChange={(event) => setAdminForm((prev) => ({ ...prev, username: event.target.value }))}
                  className="h-9 border-border-grey text-xs"
                  placeholder="Username (opsional)"
                />
                <Input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={adminForm.phone}
                  onChange={(event) => setAdminForm((prev) => ({ ...prev, phone: event.target.value }))}
                  className="h-9 border-border-grey text-xs"
                  placeholder="Nomor telepon (opsional)"
                />
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type={showAdminPassword ? "text" : "password"}
                      value={adminForm.password}
                      onChange={(event) =>
                        setAdminForm((prev) => ({ ...prev, password: event.target.value }))
                      }
                      className="h-9 border-border-grey pr-10 text-xs"
                      placeholder="Password admin"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword((prev) => !prev)}
                      aria-label={showAdminPassword ? "Sembunyikan password" : "Tampilkan password"}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-dark-grey/70 transition-colors hover:text-secondary"
                    >
                      {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="rounded-md border border-border-grey bg-light-grey/30 px-3 py-2">
                    <p className="mb-2 text-[11px] font-medium text-dark-grey/80">
                      Password harus memenuhi:
                    </p>
                    <div className="space-y-1">
                      {adminPasswordRules.map((rule) => (
                        <div
                          key={rule.label}
                          className={cn(
                            "flex items-center gap-2 text-[11px]",
                            rule.isValid ? "text-emerald-700" : "text-dark-grey/70",
                          )}
                        >
                          {rule.isValid ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <Circle className="h-3.5 w-3.5" />
                          )}
                          <span>{rule.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  disabled={isCreatingAdmin}
                  onClick={handleCreateAdmin}
                  className="h-9 rounded-md bg-primary-orange px-4 text-xs font-semibold text-white hover:bg-primary-orange/90"
                >
                  {isCreatingAdmin ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tambah Admin"}
                </Button>
              </div>

              <div className="rounded-lg border border-border-grey p-4">
                <p className="text-xs font-semibold text-secondary">Daftar Admin</p>
                {isLoadingAdmins ? (
                  <div className="mt-3 flex items-center gap-2 text-xs text-dark-grey/70">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memuat admin...
                  </div>
                ) : adminUsers.length === 0 ? (
                  <p className="mt-3 text-xs text-dark-grey">Belum ada admin tambahan.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {adminUsers.map((admin) => (
                      <div key={admin.id} className="rounded-md border border-border-grey/70 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-semibold text-secondary">{admin.fullName}</p>
                            <p className="text-[11px] text-dark-grey">{admin.email}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-dark-grey/80">
                              <span className={cn(
                                "rounded-full px-2 py-0.5 font-semibold",
                                admin.role === "SUPER_ADMIN" ? "bg-amber-100 text-amber-700" : "bg-light-grey"
                              )}>{admin.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}</span>
                              <span className={cn(
                                "rounded-full px-2 py-0.5",
                                admin.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"
                              )}>{admin.status}</span>
                            </div>
                          </div>
                          <div className="flex shrink-0 gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 border-primary-orange px-2 text-[11px] text-primary-orange hover:bg-primary-orange/10"
                              onClick={() => openEditAdmin(admin)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 border-rose-200 px-2 text-[11px] text-rose-600 hover:bg-rose-50"
                              onClick={() => {
                                setDeletingAdminId(admin.id);
                                setIsDeleteAdminOpen(true);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : null}
      </Container>

      {/* ── Dialog: HomeBanner ────────────────────────────────────────────── */}
      <Dialog open={isBannerDialogOpen} onOpenChange={setIsBannerDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {bannerDialogMode === "create" ? "Tambah Banner" : "Edit Banner"}
            </DialogTitle>
            <DialogDescription>
              Lengkapi informasi banner yang akan tampil pada halaman utama.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-[180px_1fr]">
            <div className="space-y-3">
              <div className="relative h-40 w-full overflow-hidden rounded-lg border border-border-grey bg-light-grey">
                {bannerForm.imageUrl ? (
                  <Image
                    src={bannerForm.imageUrl}
                    alt="Preview banner"
                    fill
                    className="object-cover"
                    sizes="180px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-dark-grey">
                    Preview Banner
                  </div>
                )}
              </div>
              <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-primary-orange px-3 py-2 text-xs font-semibold text-primary-orange">
                {isUploadingBanner ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                Upload Gambar
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    void handleUploadBanner(file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <p className="text-[11px] text-dark-grey/80">Ukuran disarankan: 1440x480</p>
            </div>
            <div className="space-y-3">
              <Input
                value={bannerForm.title}
                onChange={(event) => setBannerForm((prev) => ({ ...prev, title: event.target.value }))}
                className="h-9 border-border-grey text-xs"
                placeholder="Judul banner"
              />
              <Textarea
                value={bannerForm.subtitle}
                onChange={(event) => setBannerForm((prev) => ({ ...prev, subtitle: event.target.value }))}
                className="min-h-[90px] border-border-grey text-xs"
                placeholder="Deskripsi singkat"
              />
              <Input
                type="url"
                inputMode="url"
                value={bannerForm.targetUrl}
                onChange={(event) => setBannerForm((prev) => ({ ...prev, targetUrl: event.target.value }))}
                className="h-9 border-border-grey text-xs"
                placeholder="Link tujuan (opsional)"
              />
              <Input
                value={bannerForm.altText}
                onChange={(event) => setBannerForm((prev) => ({ ...prev, altText: event.target.value }))}
                className="h-9 border-border-grey text-xs"
                placeholder="Teks alternatif (opsional)"
              />
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={bannerForm.sortOrder}
                  onChange={(event) => setBannerForm((prev) => ({ ...prev, sortOrder: event.target.value }))}
                  className="h-9 border-border-grey text-xs"
                  placeholder="Urutan tampil (angka)"
                />
                <Select
                  value={bannerForm.isActive ? "active" : "inactive"}
                  onValueChange={(value) =>
                    setBannerForm((prev) => ({ ...prev, isActive: value === "active" }))
                  }
                >
                  <SelectTrigger className="h-9 border-border-grey bg-white text-xs text-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSavingBanner}
              onClick={() => setIsBannerDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isSavingBanner || isUploadingBanner}
              onClick={handleSaveBanner}
              className="bg-primary-orange text-white hover:bg-primary-orange/90"
            >
              {isSavingBanner ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan Banner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={isDeleteBannerOpen}
        onOpenChange={setIsDeleteBannerOpen}
        variant="error"
        visualStyle="dangerCard"
        title="Hapus banner?"
        description="Banner yang dihapus tidak bisa dipulihkan. Yakin ingin melanjutkan?"
        confirmLabel="Ya, hapus banner"
        confirmTone="dangerSoft"
        confirmIcon={<Trash2 className="h-4 w-4" />}
        cancelLabel=""
        onConfirm={handleDeleteBanner}
      />

      {/* ── Dialog: AuthBanner ────────────────────────────────────────────── */}
      <Dialog open={isAuthBannerDialogOpen} onOpenChange={setIsAuthBannerDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {authBannerDialogMode === "create" ? "Tambah Auth Banner" : "Edit Auth Banner"}
            </DialogTitle>
            <DialogDescription>
              Lengkapi informasi banner yang akan tampil di sisi kanan halaman login dan register.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-[180px_1fr]">
            <div className="space-y-3">
              <div className="relative h-40 w-full overflow-hidden rounded-lg border border-border-grey bg-light-grey">
                {authBannerForm.imageUrl ? (
                  <Image
                    src={authBannerForm.imageUrl}
                    alt="Preview auth banner"
                    fill
                    className="object-cover"
                    sizes="180px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-dark-grey">
                    Preview Banner
                  </div>
                )}
              </div>
              <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-primary-orange px-3 py-2 text-xs font-semibold text-primary-orange">
                {isUploadingAuthBanner ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                Upload Gambar
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    void handleUploadAuthBanner(file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <p className="text-[11px] text-dark-grey/80">Ukuran disarankan: 720x960</p>
            </div>
            <div className="space-y-3">
              <Input
                value={authBannerForm.title}
                onChange={(event) => setAuthBannerForm((prev) => ({ ...prev, title: event.target.value }))}
                className="h-9 border-border-grey text-xs"
                placeholder="Judul banner (opsional)"
              />
              <Textarea
                value={authBannerForm.subtitle}
                onChange={(event) => setAuthBannerForm((prev) => ({ ...prev, subtitle: event.target.value }))}
                className="min-h-[90px] border-border-grey text-xs"
                placeholder="Deskripsi singkat (opsional)"
              />
              <Input
                value={authBannerForm.altText}
                onChange={(event) => setAuthBannerForm((prev) => ({ ...prev, altText: event.target.value }))}
                className="h-9 border-border-grey text-xs"
                placeholder="Teks alternatif (opsional)"
              />
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={authBannerForm.sortOrder}
                  onChange={(event) => setAuthBannerForm((prev) => ({ ...prev, sortOrder: event.target.value }))}
                  className="h-9 border-border-grey text-xs"
                  placeholder="Urutan tampil (angka)"
                />
                <Select
                  value={authBannerForm.isActive ? "active" : "inactive"}
                  onValueChange={(value) =>
                    setAuthBannerForm((prev) => ({ ...prev, isActive: value === "active" }))
                  }
                >
                  <SelectTrigger className="h-9 border-border-grey bg-white text-xs text-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSavingAuthBanner}
              onClick={() => setIsAuthBannerDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isSavingAuthBanner || isUploadingAuthBanner}
              onClick={handleSaveAuthBanner}
              className="bg-primary-orange text-white hover:bg-primary-orange/90"
            >
              {isSavingAuthBanner ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan Banner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={isDeleteAuthBannerOpen}
        onOpenChange={setIsDeleteAuthBannerOpen}
        variant="error"
        visualStyle="dangerCard"
        title="Hapus auth banner?"
        description="Banner yang dihapus tidak bisa dipulihkan. Yakin ingin melanjutkan?"
        confirmLabel="Ya, hapus banner"
        confirmTone="dangerSoft"
        confirmIcon={<Trash2 className="h-4 w-4" />}
        cancelLabel=""
        onConfirm={handleDeleteAuthBanner}
      />


      {/* ── Dialog: Edit Admin ──────────────────────────────────────────── */}
      <Dialog open={isEditAdminDialogOpen} onOpenChange={setIsEditAdminDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
            <DialogDescription>Perbarui data admin. Kosongkan password jika tidak ingin mengubahnya.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={editAdminForm.fullName}
              onChange={(e) => setEditAdminForm((p) => ({ ...p, fullName: e.target.value }))}
              className="h-9 border-border-grey text-xs"
              placeholder="Nama lengkap"
            />
            <Input
              type="email"
              value={editAdminForm.email}
              onChange={(e) => setEditAdminForm((p) => ({ ...p, email: e.target.value }))}
              className="h-9 border-border-grey text-xs"
              placeholder="Email"
            />
            <Input
              value={editAdminForm.username}
              onChange={(e) => setEditAdminForm((p) => ({ ...p, username: e.target.value }))}
              className="h-9 border-border-grey text-xs"
              placeholder="Username (opsional)"
            />
            <Input
              type="tel"
              value={editAdminForm.phone}
              onChange={(e) => setEditAdminForm((p) => ({ ...p, phone: e.target.value }))}
              className="h-9 border-border-grey text-xs"
              placeholder="Nomor telepon (opsional)"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                value={editAdminForm.role}
                onValueChange={(v) => setEditAdminForm((p) => ({ ...p, role: v as "ADMIN" | "SUPER_ADMIN" }))}
              >
                <SelectTrigger className="h-9 border-border-grey bg-white text-xs text-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={editAdminForm.status}
                onValueChange={(v) => setEditAdminForm((p) => ({ ...p, status: v as "ACTIVE" | "SUSPENDED" }))}
              >
                <SelectTrigger className="h-9 border-border-grey bg-white text-xs text-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Aktif</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="relative">
              <Input
                type={showEditAdminPassword ? "text" : "password"}
                value={editAdminForm.password}
                onChange={(e) => setEditAdminForm((p) => ({ ...p, password: e.target.value }))}
                className="h-9 border-border-grey pr-10 text-xs"
                placeholder="Password baru (kosongkan jika tidak diubah)"
              />
              <button
                type="button"
                onClick={() => setShowEditAdminPassword((p) => !p)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-dark-grey/70"
              >
                {showEditAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditAdminDialogOpen(false)} disabled={isSavingEditAdmin}>
              Batal
            </Button>
            <Button
              onClick={handleSaveEditAdmin}
              disabled={isSavingEditAdmin}
              className="bg-primary-orange text-white hover:bg-primary-orange/90"
            >
              {isSavingEditAdmin ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={isDeleteAdminOpen}
        onOpenChange={setIsDeleteAdminOpen}
        variant="error"
        visualStyle="dangerCard"
        title="Hapus admin?"
        description="Admin yang dihapus tidak bisa dipulihkan. Yakin ingin melanjutkan?"
        confirmLabel="Ya, hapus admin"
        confirmTone="dangerSoft"
        confirmIcon={<Trash2 className="h-4 w-4" />}
        cancelLabel=""
        onConfirm={handleDeleteAdmin}
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
