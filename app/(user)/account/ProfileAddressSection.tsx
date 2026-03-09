"use client";

import { useState, type FormEvent } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
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
  SelectGroup,
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
  region: string;
  street: string;
  detail: string;
};

type AddressFormState = {
  fullName: string;
  phone: string;
  region: string;
  street: string;
  detail: string;
};

const SHIPPING_ADDRESSES: ShippingAddress[] = [
  {
    id: "addr-1",
    name: "Udin Sedunia",
    phone: "(+62) 809 7630 1738",
    region: "Lampung, Kota Bandar Lampung, Sukarame, 35131",
    street: "Jalan Satria I, Korpri Raya, Sukarame",
    detail: "Gg kcl smpg rmh wrng",
  },
  {
    id: "addr-2",
    name: "Udin Sedunia",
    phone: "(+62) 809 7630 1738",
    region: "DKI Jakarta, Jakarta Selatan, Tebet, 12820",
    street: "Jalan Satria I, Korpri Raya, Sukarame",
    detail: "Gg kcl smpg rmh wrng",
  },
];

const REGION_OPTIONS = [
  "Lampung, Kota Bandar Lampung, Sukarame, 35131",
  "DKI Jakarta, Jakarta Selatan, Tebet, 12820",
  "Jawa Barat, Kota Bandung, Coblong, 40132",
];

const EMPTY_ADDRESS_FORM: AddressFormState = {
  fullName: "",
  phone: "",
  region: "",
  street: "",
  detail: "",
};

const getFormattedAddress = (address: ShippingAddress) =>
  [address.street, address.detail, address.region]
    .map((item) => item.trim())
    .filter(Boolean)
    .join(", ");

export default function ProfileAddressSection() {
  const [addresses, setAddresses] = useState<ShippingAddress[]>(
    SHIPPING_ADDRESSES
  );
  const [primaryAddressId, setPrimaryAddressId] = useState<string>(
    SHIPPING_ADDRESSES[0]?.id ?? ""
  );
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [addressDialogMode, setAddressDialogMode] = useState<"add" | "edit">(
    "add"
  );
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressToDeleteId, setAddressToDeleteId] = useState<string | null>(
    null
  );
  const [addressForm, setAddressForm] =
    useState<AddressFormState>(EMPTY_ADDRESS_FORM);

  const updateAddressForm = (field: keyof AddressFormState, value: string) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));
  };

  const openAddAddressDialog = () => {
    setAddressDialogMode("add");
    setEditingAddressId(null);
    setAddressForm(EMPTY_ADDRESS_FORM);
    setIsAddressDialogOpen(true);
  };

  const openEditAddressDialog = (address: ShippingAddress) => {
    setAddressDialogMode("edit");
    setEditingAddressId(address.id);
    setAddressForm({
      fullName: address.name,
      phone: address.phone,
      region: address.region,
      street: address.street,
      detail: address.detail,
    });
    setIsAddressDialogOpen(true);
  };

  const handleAddressSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { fullName, phone, region, street, detail } = addressForm;
    if (!fullName.trim() || !phone.trim() || !region.trim() || !street.trim()) {
      return;
    }

    if (addressDialogMode === "edit" && editingAddressId) {
      setAddresses((prev) =>
        prev.map((address) =>
          address.id === editingAddressId
            ? {
                ...address,
                name: fullName.trim(),
                phone: phone.trim(),
                region: region.trim(),
                street: street.trim(),
                detail: detail.trim(),
              }
            : address
        )
      );
    } else {
      const newAddressId = `addr-${Date.now()}`;
      setAddresses((prev) => [
        ...prev,
        {
          id: newAddressId,
          name: fullName.trim(),
          phone: phone.trim(),
          region: region.trim(),
          street: street.trim(),
          detail: detail.trim(),
        },
      ]);
      setPrimaryAddressId(newAddressId);
    }

    setEditingAddressId(null);
    setAddressForm(EMPTY_ADDRESS_FORM);
    setIsAddressDialogOpen(false);
  };

  const handleDeleteAddress = () => {
    if (!addressToDeleteId) return;

    setAddresses((prev) => {
      const filteredAddresses = prev.filter(
        (address) => address.id !== addressToDeleteId
      );

      if (primaryAddressId === addressToDeleteId) {
        setPrimaryAddressId(filteredAddresses[0]?.id ?? "");
      }

      return filteredAddresses;
    });

    setAddressToDeleteId(null);
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

        <div className="space-y-4">
          {addresses.map((address) => {
            const isPrimary = address.id === primaryAddressId;

            return (
              <div
                key={address.id}
                className={`rounded-xl bg-white p-4 ${
                  isPrimary
                    ? "border border-primary-orange"
                    : "border border-transparent"
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
                      <p className="text-[11px] font-medium text-primary-orange">
                        Alamat utama
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPrimaryAddressId(address.id)}
                        className="text-[11px] font-medium text-primary-orange"
                      >
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
                    <button
                      type="button"
                      onClick={() => setAddressToDeleteId(address.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AccountSection>

      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
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
                onChange={(event) =>
                  updateAddressForm("fullName", event.target.value)
                }
                required
                className="h-10 border-gray-300 bg-transparent text-xs text-gray-700 placeholder:text-xs placeholder:text-gray-500"
              />
              <Input
                name="phone"
                placeholder="Nomor Telepon"
                value={addressForm.phone}
                onChange={(event) =>
                  updateAddressForm("phone", event.target.value)
                }
                required
                className="h-10 border-gray-300 bg-transparent text-xs text-gray-700 placeholder:text-xs placeholder:text-gray-500"
              />
            </div>

            <Select
              value={addressForm.region}
              onValueChange={(value) => updateAddressForm("region", value)}
            >
              <SelectTrigger className="h-10 w-full border-gray-300 bg-transparent text-xs text-gray-700">
                <SelectValue placeholder="Provinsi, Kota, Kecamatan, Kode Pos" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {REGION_OPTIONS.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

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
                className="h-9 rounded-md bg-primary-orange px-8 text-xs font-semibold text-white hover:bg-primary-orange/90"
              >
                {addressDialogMode === "edit" ? "Simpan" : "OK"}
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
              onClick={handleDeleteAddress}
              className="h-9 rounded-md bg-primary-orange px-6 text-xs font-semibold text-white hover:bg-primary-orange/90"
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
