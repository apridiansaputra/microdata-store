"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { useCart } from "@/components/cart-components/cart-context";
import { AuthFeedbackDialog } from "@/components/ui/auth-feedback-dialog";
import type { CheckoutShippingQuote } from "./types";

type OrderFooterProps = {
  subtotal: number;
  shippingCost: number;
  totalPayment: number;
  selectedAddressId: string | null;
  shippingQuote: CheckoutShippingQuote | null;
  checkoutCartItemIds: string[];
  hasCheckoutItems: boolean;
};

export default function OrderFooter({
  subtotal,
  shippingCost,
  totalPayment,
  selectedAddressId,
  shippingQuote,
  checkoutCartItemIds,
  hasCheckoutItems,
}: OrderFooterProps) {
  const { openCart } = useCart();
  const [isPaying, setIsPaying] = useState(false);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    variant: "success" | "error";
    title: string;
    description: string;
  } | null>(null);

  const canNegotiate = totalPayment > 50000000;

  const handleCreatePayment = async () => {
    if (!hasCheckoutItems) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Belum Ada Produk",
        description: "Pilih produk terlebih dahulu sebelum lanjut pembayaran.",
      });
      return;
    }

    if (!selectedAddressId) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Alamat Belum Dipilih",
        description: "Pilih alamat pengiriman terlebih dahulu.",
      });
      return;
    }

    if (!shippingQuote) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Ongkir Belum Siap",
        description: "Tunggu perhitungan ongkir selesai lalu coba lagi.",
      });
      return;
    }

    setIsPaying(true);
    const response = await fetch("/api/checkout/pay", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        addressId: selectedAddressId,
        cartItemIds: checkoutCartItemIds,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      paymentUrl?: string;
      error?: string;
    };

    if (!response.ok || !data.paymentUrl) {
      setIsPaying(false);
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Membuat Pembayaran",
        description: data.error ?? "Coba lagi beberapa saat.",
      });
      return;
    }

    window.location.href = data.paymentUrl;
  };

  const handleCreateNegotiation = async () => {
    if (!hasCheckoutItems) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Belum Ada Produk",
        description: "Pilih produk terlebih dahulu sebelum mengajukan negosiasi.",
      });
      return;
    }

    if (!selectedAddressId) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Alamat Belum Dipilih",
        description: "Pilih alamat pengiriman terlebih dahulu.",
      });
      return;
    }

    if (!shippingQuote) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Ongkir Belum Siap",
        description: "Tunggu perhitungan ongkir selesai lalu coba lagi.",
      });
      return;
    }

    setIsNegotiating(true);
    const response = await fetch("/api/checkout/negotiate", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        addressId: selectedAddressId,
        cartItemIds: checkoutCartItemIds,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      redirectUrl?: string;
      error?: string;
    };

    if (!response.ok || !data.redirectUrl) {
      setIsNegotiating(false);
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Membuat Negosiasi",
        description: data.error ?? "Silakan coba lagi beberapa saat.",
      });
      return;
    }

    window.location.href = data.redirectUrl;
  };

  return (
    <>
      <hr className="my-6" />
      <div className="rounded-md flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span>Total Pesanan</span>
          <span>Rp. {subtotal.toLocaleString("id-ID")},00</span>
        </div>

        <div className="flex justify-between text-sm">
          <span>Biaya Pengiriman</span>
          <span>Rp. {shippingCost.toLocaleString("id-ID")},00</span>
        </div>

        <div className="flex justify-between font-semibold">
          <span>Total Pembayaran</span>
          <span>Rp. {totalPayment.toLocaleString("id-ID")},00</span>
        </div>
      </div>

      <div
        className={`grid gap-4 mt-6 ${canNegotiate ? "grid-cols-2" : "grid-cols-1"}`}
      >
        {canNegotiate && (
          <button
            type="button"
            disabled={isNegotiating || isPaying}
            onClick={() => {
              void handleCreateNegotiation();
            }}
            className="bg-white border border-primary-orange text-primary-orange py-3 text-sm rounded-md hover:bg-orange-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isNegotiating ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Menyiapkan Negosiasi...
              </span>
            ) : (
              "Nego Harga"
            )}
          </button>
        )}

        <button
          type="button"
          disabled={isPaying || isNegotiating}
          onClick={() => {
            void handleCreatePayment();
          }}
          className="text-white bg-primary-orange rounded-md text-sm py-3 hover:bg-orange-500 cursor-pointer w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPaying ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Menyiapkan Pembayaran...
            </span>
          ) : (
            "Lanjutkan Pembayaran"
          )}
        </button>
      </div>

      <button
        type="button"
        onClick={openCart}
        className="mt-4 text-sm text-gray-500 hover:text-gray-700 cursor-pointer justify-self-start flex"
      >
        {"<-"} Kembali ke Keranjang
      </button>

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
