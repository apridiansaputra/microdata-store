"use client";

import { useState, type FormEvent, useCallback, useEffect } from "react";
import { ChevronDown, Loader2, Plus, Trash2 } from "lucide-react";

import { AuthFeedbackDialog } from "@/components/ui/auth-feedback-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import AccountSection from "./AccountSection";

type ShippingAddress = {
  id: string;
  name: string;
  phone: string;
  provinceCode: string | null;
  provinceName: string;
  cityCode: string | null;
  cityName: string;
  districtName: string;
  postalCode: string;
  region: string;
  street: string;
  detail: string;
  isPrimary: boolean;
};

type LocationOption = {
  code: string;
  name: string;
};

type AddressFormState = {
  fullName: string;
  phone: string;
  provinceCode: string;
  provinceName: string;
  cityCode: string;
  cityName: string;
  districtName: string;
  postalCode: string;
  street: string;
  detail: string;
};

const EMPTY_ADDRESS_FORM: AddressFormState = {
  fullName: "",
  phone: "",
  provinceCode: "",
  provinceName: "",
  cityCode: "",
  cityName: "",
  districtName: "",
  postalCode: "",
  street: "",
  detail: "",
};

const getFormattedAddress = (address: ShippingAddress) =>
  [address.street, address.detail, address.region]
    .map((item) => item.trim())
    .filter(Boolean)
    .join(", ");

function findOptionByName(items: LocationOption[], name: string) {
  const normalized = name.trim().toLowerCase();
  return items.find((item) => item.name.trim().toLowerCase() === normalized) ?? null;
}

function normalizePhoneInput(rawValue: string) {
  const compact = rawValue
    .normalize("NFKC")
    .trim()
    .replace(/[^0-9+]/g, "");

  const hasLeadingPlus = compact.startsWith("+");
  const digitsOnly = compact.replace(/\+/g, "");

  if (!/^\d+$/.test(digitsOnly)) return null;
  if (digitsOnly.length < 8 || digitsOnly.length > 24) return null;

  return hasLeadingPlus ? `+${digitsOnly}` : digitsOnly;
}

export default function ProfileAddressSection() {
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [addressDialogMode, setAddressDialogMode] = useState<"add" | "edit">("add");
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressToDeleteId, setAddressToDeleteId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<AddressFormState>(EMPTY_ADDRESS_FORM);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isDeletingAddress, setIsDeletingAddress] = useState(false);
  const [isSettingPrimaryId, setIsSettingPrimaryId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    variant: "success" | "error";
    title: string;
    description: string;
  } | null>(null);

  const [provinces, setProvinces] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);

  const loadAddresses = useCallback(async () => {
    setIsLoading(true);
    const response = await fetch("/api/account/addresses", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    const data = (await response.json().catch(() => ({}))) as {
      addresses?: ShippingAddress[];
      error?: string;
    };

    if (!response.ok) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Memuat Alamat",
        description: data.error ?? "Alamat belum tersedia.",
      });
      setAddresses([]);
      setIsLoading(false);
      return;
    }

    setAddresses(data.addresses ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadAddresses();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadAddresses]);

  const loadProvinces = useCallback(async () => {
    setIsLoadingProvinces(true);
    const response = await fetch("/api/locations/provinces", {
      method: "GET",
      credentials: "include",
      cache: "force-cache",
    });
    const data = (await response.json().catch(() => ({}))) as {
      items?: LocationOption[];
      error?: string;
    };
    setIsLoadingProvinces(false);

    if (!response.ok) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Memuat Provinsi",
        description: data.error ?? "Data provinsi belum bisa diambil.",
      });
      return null;
    }

    const nextItems = data.items ?? [];
    setProvinces(nextItems);
    return nextItems;
  }, []);

  const loadCities = useCallback(async (provinceCode: string) => {
    setIsLoadingCities(true);
    const response = await fetch(
      `/api/locations/cities?provinceCode=${encodeURIComponent(provinceCode)}`,
      {
        method: "GET",
        credentials: "include",
        cache: "force-cache",
      },
    );
    const data = (await response.json().catch(() => ({}))) as {
      items?: LocationOption[];
      error?: string;
    };
    setIsLoadingCities(false);

    if (!response.ok) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Memuat Kota/Kabupaten",
        description: data.error ?? "Data kota/kabupaten belum bisa diambil.",
      });
      return null;
    }

    const nextItems = data.items ?? [];
    setCities(nextItems);
    return nextItems;
  }, []);

  const loadDistricts = useCallback(async (cityCode: string) => {
    setIsLoadingDistricts(true);
    const response = await fetch(
      `/api/locations/districts?cityCode=${encodeURIComponent(cityCode)}`,
      {
        method: "GET",
        credentials: "include",
        cache: "force-cache",
      },
    );
    const data = (await response.json().catch(() => ({}))) as {
      items?: LocationOption[];
      error?: string;
    };
    setIsLoadingDistricts(false);

    if (!response.ok) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Memuat Kecamatan",
        description: data.error ?? "Data kecamatan belum bisa diambil.",
      });
      return null;
    }

    const nextItems = data.items ?? [];
    setDistricts(nextItems);
    return nextItems;
  }, []);

  const updateAddressForm = (field: keyof AddressFormState, value: string) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));
  };

  const openAddAddressDialog = () => {
    setAddressDialogMode("add");
    setEditingAddressId(null);
    setAddressForm(EMPTY_ADDRESS_FORM);
    setCities([]);
    setDistricts([]);
    setIsAddressDialogOpen(true);
    void loadProvinces();
  };

  const openEditAddressDialog = (address: ShippingAddress) => {
    setAddressDialogMode("edit");
    setEditingAddressId(address.id);
    setAddressForm({
      fullName: address.name,
      phone: address.phone,
      provinceCode: address.provinceCode ?? "",
      provinceName: address.provinceName,
      cityCode: address.cityCode ?? "",
      cityName: address.cityName,
      districtName: address.districtName,
      postalCode: address.postalCode,
      street: address.street,
      detail: address.detail,
    });
    setCities([]);
    setDistricts([]);
    setIsAddressDialogOpen(true);

    void (async () => {
      const provinceItems = await loadProvinces();
      if (!provinceItems) return;

      const matchedProvince =
        (address.provinceCode
          ? provinceItems.find((item) => item.code === address.provinceCode)
          : null) ?? findOptionByName(provinceItems, address.provinceName);
      if (!matchedProvince) return;

      setAddressForm((prev) => ({
        ...prev,
        provinceCode: matchedProvince.code,
        provinceName: matchedProvince.name,
      }));

      const cityItems = await loadCities(matchedProvince.code);
      if (!cityItems) return;

      const matchedCity =
        (address.cityCode ? cityItems.find((item) => item.code === address.cityCode) : null) ??
        findOptionByName(cityItems, address.cityName);
      if (!matchedCity) return;

      setAddressForm((prev) => ({
        ...prev,
        cityCode: matchedCity.code,
        cityName: matchedCity.name,
      }));

      const districtItems = await loadDistricts(matchedCity.code);
      if (!districtItems) return;

      const matchedDistrict = findOptionByName(districtItems, address.districtName);
      if (matchedDistrict) {
        setAddressForm((prev) => ({
          ...prev,
          districtName: matchedDistrict.name,
        }));
      }
    })();
  };

  const handleProvinceChange = (nextProvinceCode: string) => {
    const selectedProvince = provinces.find((item) => item.code === nextProvinceCode) ?? null;

    setAddressForm((prev) => ({
      ...prev,
      provinceCode: nextProvinceCode,
      provinceName: selectedProvince?.name ?? "",
      cityCode: "",
      cityName: "",
      districtName: "",
    }));
    setCities([]);
    setDistricts([]);

    if (nextProvinceCode) {
      void loadCities(nextProvinceCode);
    }
  };

  const handleCityChange = (nextCityCode: string) => {
    const selectedCity = cities.find((item) => item.code === nextCityCode) ?? null;

    setAddressForm((prev) => ({
      ...prev,
      cityCode: nextCityCode,
      cityName: selectedCity?.name ?? "",
      districtName: "",
    }));
    setDistricts([]);

    if (nextCityCode) {
      void loadDistricts(nextCityCode);
    }
  };

  const handleAddressSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !addressForm.provinceCode ||
      !addressForm.provinceName ||
      !addressForm.cityCode ||
      !addressForm.cityName ||
      !addressForm.districtName
    ) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Wilayah Belum Lengkap",
        description: "Pilih provinsi, kota/kabupaten, dan kecamatan terlebih dahulu.",
      });
      return;
    }

    const normalizedPhone = normalizePhoneInput(addressForm.phone);
    if (!normalizedPhone) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Nomor Telepon Tidak Valid",
        description:
          "Gunakan format nomor telepon yang valid, contoh: 081234567890 atau +6281234567890.",
      });
      return;
    }

    const payload = {
      fullName: addressForm.fullName.trim(),
      phone: normalizedPhone,
      provinceCode: addressForm.provinceCode,
      provinceName: addressForm.provinceName,
      cityCode: addressForm.cityCode,
      cityName: addressForm.cityName,
      districtName: addressForm.districtName,
      postalCode: addressForm.postalCode.trim(),
      region: [
        addressForm.provinceName,
        addressForm.cityName,
        addressForm.districtName,
        addressForm.postalCode.trim(),
      ].join(", "),
      street: addressForm.street.trim(),
      detail: addressForm.detail.trim() || null,
      ...(addressDialogMode === "add" ? { isPrimary: addresses.length === 0 } : {}),
    };

    setIsSavingAddress(true);
    const response = await fetch(
      addressDialogMode === "edit" && editingAddressId
        ? `/api/account/addresses/${editingAddressId}`
        : "/api/account/addresses",
      {
        method: addressDialogMode === "edit" ? "PATCH" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      debugIssue?: {
        path?: string;
        code?: string;
      } | null;
    };
    setIsSavingAddress(false);

    if (!response.ok) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Menyimpan Alamat",
        description:
          process.env.NODE_ENV !== "production" && data.debugIssue?.path
            ? `${data.error ?? "Periksa kembali data alamat yang diisi."} (field: ${data.debugIssue.path})`
            : (data.error ?? "Periksa kembali data alamat yang diisi."),
      });
      return;
    }

    await loadAddresses();
    setAddressForm(EMPTY_ADDRESS_FORM);
    setEditingAddressId(null);
    setIsAddressDialogOpen(false);
    setFeedback({
      open: true,
      variant: "success",
      title: addressDialogMode === "edit" ? "Alamat Diperbarui" : "Alamat Ditambahkan",
      description:
        addressDialogMode === "edit"
          ? "Perubahan alamat berhasil disimpan."
          : "Alamat baru berhasil ditambahkan.",
    });
  };

  const handleDeleteAddress = async () => {
    if (!addressToDeleteId) return;

    setIsDeletingAddress(true);
    const response = await fetch(`/api/account/addresses/${addressToDeleteId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setIsDeletingAddress(false);

    if (!response.ok) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Menghapus Alamat",
        description: data.error ?? "Alamat tidak berhasil dihapus.",
      });
      return;
    }

    await loadAddresses();
    setAddressToDeleteId(null);
    setFeedback({
      open: true,
      variant: "success",
      title: "Alamat Dihapus",
      description: "Alamat berhasil dihapus dari daftar pengiriman.",
    });
  };

  const handleSetPrimary = async (addressId: string) => {
    setIsSettingPrimaryId(addressId);
    const response = await fetch(`/api/account/addresses/${addressId}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        isPrimary: true,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setIsSettingPrimaryId(null);

    if (!response.ok) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Mengatur Alamat Utama",
        description: data.error ?? "Coba lagi beberapa saat.",
      });
      return;
    }

    await loadAddresses();
  };

  return (
    <>
      <AccountSection
        title="Alamat Pengiriman"
        action={<ChevronDown className="h-5 w-5 text-gray-600" />}
      >
        <div className="mb-5 flex justify-end">
          <button
            type="button"
            onClick={openAddAddressDialog}
            className="inline-flex items-center gap-1 rounded-md border border-primary-orange px-3 py-1.5 text-[11px] font-medium text-primary-orange"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah Alamat
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-dark-grey/70">
            <Loader2 className="size-4 animate-spin" />
            Memuat alamat...
          </div>
        ) : addresses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-grey bg-white p-4 text-xs text-dark-grey/70">
            Belum ada alamat. Tambahkan alamat pengiriman pertamamu.
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => {
              const isPrimary = address.isPrimary;

              return (
                <div
                  key={address.id}
                  className={`rounded-xl bg-white p-4 ${
                    isPrimary ? "border border-primary-orange" : "border border-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-secondary">
                        {address.name}
                        <span className="ml-2 text-[11px] font-normal text-dark-grey">
                          {address.phone}
                        </span>
                      </p>
                      <p className="max-w-3xl text-xs text-dark-grey">
                        {getFormattedAddress(address)}
                      </p>
                      {isPrimary ? (
                        <p className="text-[11px] font-medium text-primary-orange">Alamat utama</p>
                      ) : (
                        <button
                          type="button"
                          disabled={isSettingPrimaryId === address.id}
                          onClick={() => {
                            void handleSetPrimary(address.id);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary-orange"
                        >
                          {isSettingPrimaryId === address.id ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : null}
                          Atur sebagai utama
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-medium text-dark-grey">
                      <button
                        type="button"
                        onClick={() => openEditAddressDialog(address)}
                        className="underline"
                      >
                        Edit
                      </button>
                      <button type="button" onClick={() => setAddressToDeleteId(address.id)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AccountSection>

      <Dialog
        open={isAddressDialogOpen}
        onOpenChange={(open) => {
          setIsAddressDialogOpen(open);
          if (!open) {
            setEditingAddressId(null);
            setAddressForm(EMPTY_ADDRESS_FORM);
            setCities([]);
            setDistricts([]);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-secondary">
              {addressDialogMode === "edit" ? "Edit Alamat" : "Alamat Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs text-dark-grey">
              {addressDialogMode === "edit"
                ? "Perbarui detail alamat pengirimanmu."
                : "Tambahkan alamat baru untuk pengiriman pesananmu."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddressSubmit} className="mt-5 space-y-3">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                name="fullName"
                placeholder="Nama Lengkap"
                value={addressForm.fullName}
                onChange={(event) => updateAddressForm("fullName", event.target.value)}
                required
                className="h-10 border-gray-300 bg-transparent text-xs text-gray-700 placeholder:text-xs placeholder:text-gray-500"
              />
              <Input
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="Nomor Telepon"
                value={addressForm.phone}
                onChange={(event) => updateAddressForm("phone", event.target.value)}
                required
                className="h-10 border-gray-300 bg-transparent text-xs text-gray-700 placeholder:text-xs placeholder:text-gray-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                value={addressForm.provinceCode}
                onValueChange={handleProvinceChange}
                disabled={isLoadingProvinces}
              >
                <SelectTrigger className="h-10 w-full border-gray-300 bg-transparent text-xs text-gray-700 data-[placeholder]:text-xs data-[placeholder]:text-gray-500">
                  <SelectValue
                    placeholder={isLoadingProvinces ? "Memuat provinsi..." : "Pilih Provinsi"}
                  />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {provinces.map((province) => (
                    <SelectItem key={province.code} value={province.code}>
                      {province.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={addressForm.cityCode}
                onValueChange={handleCityChange}
                disabled={!addressForm.provinceCode || isLoadingCities}
              >
                <SelectTrigger className="h-10 w-full border-gray-300 bg-transparent text-xs text-gray-700 data-[placeholder]:text-xs data-[placeholder]:text-gray-500">
                  <SelectValue
                    placeholder={
                      isLoadingCities
                        ? "Memuat kota/kabupaten..."
                        : "Pilih Kota/Kabupaten"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {cities.map((city) => (
                    <SelectItem key={city.code} value={city.code}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                value={addressForm.districtName}
                onValueChange={(value) => updateAddressForm("districtName", value)}
                disabled={!addressForm.cityCode || isLoadingDistricts}
              >
                <SelectTrigger className="h-10 w-full border-gray-300 bg-transparent text-xs text-gray-700 data-[placeholder]:text-xs data-[placeholder]:text-gray-500">
                  <SelectValue
                    placeholder={isLoadingDistricts ? "Memuat kecamatan..." : "Pilih Kecamatan"}
                  />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {districts.map((district) => (
                    <SelectItem key={district.code} value={district.name}>
                      {district.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                name="postalCode"
                type="tel"
                placeholder="Kode Pos"
                inputMode="numeric"
                pattern="[0-9]{4,10}"
                value={addressForm.postalCode}
                onChange={(event) =>
                  updateAddressForm("postalCode", event.target.value.replace(/[^0-9]/g, ""))
                }
                required
                className="h-10 border-gray-300 bg-transparent text-xs text-gray-700 placeholder:text-xs placeholder:text-gray-500"
              />
            </div>

            <Input
              name="street"
              placeholder="Nama Jalan, Gedung, No. Rumah"
              value={addressForm.street}
              onChange={(event) => updateAddressForm("street", event.target.value)}
              required
              className="h-10 border-gray-300 bg-transparent text-xs text-gray-700 placeholder:text-xs placeholder:text-gray-500"
            />

            <Textarea
              name="detail"
              placeholder="Detail Lainnya (Cth: Blok/Unit No., Patokan)"
              value={addressForm.detail}
              onChange={(event) => updateAddressForm("detail", event.target.value)}
              className="min-h-20 border-gray-300 bg-transparent text-xs text-gray-700 placeholder:text-xs placeholder:text-gray-500"
            />

            <DialogFooter className="pt-4 sm:justify-end">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-md border-primary-orange px-6 text-xs font-semibold text-primary-orange hover:bg-primary-orange/10 hover:text-primary-orange"
                >
                  Nanti Saja
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isSavingAddress}
                className="h-9 rounded-md bg-primary-orange px-8 text-xs font-semibold text-white hover:bg-primary-orange/90"
              >
                {isSavingAddress ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : addressDialogMode === "edit" ? (
                  "Simpan"
                ) : (
                  "OK"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(addressToDeleteId)}
        onOpenChange={(open) => {
          if (!open) setAddressToDeleteId(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-secondary">
              Hapus Alamat?
            </DialogTitle>
            <DialogDescription className="text-xs text-dark-grey">
              Alamat yang dipilih akan dihapus dari daftar alamat pengiriman.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-md border-primary-orange px-6 text-xs font-semibold text-primary-orange hover:bg-primary-orange/10 hover:text-primary-orange"
              >
                Batal
              </Button>
            </DialogClose>
            <Button
              type="button"
              disabled={isDeletingAddress}
              onClick={() => {
                void handleDeleteAddress();
              }}
              className="h-9 rounded-md bg-primary-orange px-6 text-xs font-semibold text-white hover:bg-primary-orange/90"
            >
              {isDeletingAddress ? <Loader2 className="size-4 animate-spin" /> : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AuthFeedbackDialog
        open={feedback?.open ?? false}
        onOpenChange={(open) => {
          if (!open) setFeedback(null);
        }}
        variant={feedback?.variant ?? "success"}
        title={feedback?.title ?? ""}
        description={feedback?.description ?? ""}
      />
    </>
  );
}
