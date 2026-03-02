'use client';

import { useCart } from "@/components/cart-components/cart-context";

type OrderFooterProps = {
  subtotal: number;
  shippingCost: number;
  totalPayment: number;
};

export default function OrderFooter({
  subtotal,
  shippingCost,
  totalPayment,
}: OrderFooterProps) {
  const { openCart } = useCart();
  const canNegotiate = totalPayment >= 50000000;

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
          <button className="bg-white border border-primary-orange text-primary-orange py-3 text-sm rounded-md hover:bg-orange-50 cursor-pointer">
            Nego Harga
          </button>
        )}

        <button className="text-white bg-primary-orange rounded-md text-sm py-3 hover:bg-orange-500 cursor-pointer w-full">
          Lanjutkan Pembayaran
        </button>
      </div>

      <button 
        type="button"
        onClick={openCart}
        className="mt-4 text-sm text-gray-500 hover:text-gray-700 cursor-pointer justify-self-start flex"
      >
        ← Kembali ke Keranjang
      </button>
    </>
  );
}
