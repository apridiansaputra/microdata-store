'use client';

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
  return (
    <>
      <hr className="my-6" />

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Total Pesanan</span>
          <span>Rp. {subtotal.toLocaleString("id-ID")},00</span>
        </div>

        <div className="flex justify-between">
          <span>Biaya Pengiriman</span>
          <span>Rp. {shippingCost.toLocaleString("id-ID")},00</span>
        </div>

        <div className="flex justify-between font-semibold text-base">
          <span>Total Pembayaran</span>
          <span>Rp. {totalPayment.toLocaleString("id-ID")},00</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <button className="bg-gray-600 text-white py-3 rounded-md hover:bg-gray-700">
          Nego Harga
        </button>

        <button className="border py-3 rounded-md hover:bg-gray-50">
          Lanjutkan Pembayaran
        </button>
      </div>

      <button className="mt-4 text-sm text-gray-500 hover:text-black">
        ← Kembali ke Keranjang
      </button>
    </>
  );
}
