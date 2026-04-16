"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, MapPinned, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AuthFeedbackDialog } from "@/components/ui/auth-feedback-dialog";
import {
  formatAddressLine,
  formatAddressRegion,
  type CheckoutAddress,
} from "./types";

type AddressSectionProps = {
  onAddressChange: (address: CheckoutAddress | null) => void;
};

export default function AddressSection({ onAddressChange }: AddressSectionProps) {
  const [addresses, setAddresses] = useState<CheckoutAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    variant: "success" | "error";
    title: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      void (async () => {
        setIsLoading(true);

        const response = await fetch("/api/account/addresses", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        const data = (await response.json().catch(() => ({}))) as {
          addresses?: CheckoutAddress[];
          error?: string;
        };

        if (!response.ok) {
          setFeedback({
            open: true,
            variant: "error",
            title: "Gagal Memuat Alamat",
            description: data.error ?? "Alamat belum bisa dimuat untuk checkout.",
          });
          setAddresses([]);
          setSelectedAddressId(null);
          onAddressChange(null);
          setIsLoading(false);
          return;
        }

        const nextAddresses = data.addresses ?? [];
        setAddresses(nextAddresses);

        if (nextAddresses.length === 0) {
          setSelectedAddressId(null);
          onAddressChange(null);
          setIsLoading(false);
          return;
        }

        const primary = nextAddresses.find((address) => address.isPrimary);
        const selected = primary ?? nextAddresses[0];
        setSelectedAddressId(selected.id);
        onAddressChange(selected);
        setIsLoading(false);
      })();
    }, 0);

    return () => clearTimeout(timer);
  }, [onAddressChange]);

  const selectedAddress =
    addresses.find((address) => address.id === selectedAddressId) ?? null;

  const handleSelectAddress = (address: CheckoutAddress) => {
    setSelectedAddressId(address.id);
    onAddressChange(address);
    setIsPickerOpen(false);
  };

  return (
    <>
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-gray-700">Dikirim ke</h2>

        {isLoading ? (
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            <Loader2 className="size-4 animate-spin" />
            Memuat alamat utama...
          </div>
        ) : !selectedAddress ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
            <p className="text-sm text-gray-700">Belum ada alamat utama.</p>
            <p className="mt-1 text-xs text-gray-500">
              Tambahkan alamat di profil agar checkout bisa dilanjutkan.
            </p>
            <Button
              asChild
              className="mt-3 h-9 bg-primary-orange text-xs text-white hover:bg-primary-orange/90"
            >
              <Link href="/account/profile">Kelola Alamat</Link>
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {selectedAddress.name}
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    {selectedAddress.phone}
                  </span>
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  {formatAddressLine(selectedAddress)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {formatAddressRegion(selectedAddress)}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-8 border-primary-orange text-xs text-primary-orange hover:bg-primary-orange/10 hover:text-primary-orange"
                onClick={() => setIsPickerOpen(true)}
              >
                Ubah
              </Button>
            </div>
          </div>
        )}
      </section>

      <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-secondary">
              Pilih Alamat Pengiriman
            </DialogTitle>
            <DialogDescription className="text-xs text-dark-grey">
              Pilih alamat yang akan digunakan untuk checkout kali ini.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
            {addresses.length === 0 ? (
              <div className="rounded-md border border-dashed border-gray-300 p-4 text-xs text-gray-500">
                Tidak ada alamat yang tersedia.
              </div>
            ) : (
              addresses.map((address) => {
                const isActive = address.id === selectedAddressId;

                return (
                  <button
                    key={address.id}
                    type="button"
                    onClick={() => handleSelectAddress(address)}
                    className={`w-full rounded-lg border p-4 text-left transition ${
                      isActive
                        ? "border-primary-orange bg-orange-50"
                        : "border-gray-200 bg-white hover:border-primary-orange/60"
                    }`}
                  >
                    <p className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                      <MapPinned className="size-4 text-primary-orange" />
                      {address.name}
                      <span className="text-xs font-normal text-gray-500">
                        {address.phone}
                      </span>
                      {address.isPrimary ? (
                        <span className="rounded-full bg-primary-orange/10 px-2 py-0.5 text-[10px] font-medium text-primary-orange">
                          Utama
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">{formatAddressLine(address)}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatAddressRegion(address)}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AuthFeedbackDialog
        open={feedback?.open ?? false}
        onOpenChange={(open) => {
          if (!open) {
            setFeedback(null);
          }
        }}
        variant={feedback?.variant ?? "success"}
        title={feedback?.title ?? ""}
        description={feedback?.description ?? ""}
      />
    </>
  );
}
