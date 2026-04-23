import Link from "next/link";
import { CircleAlert } from "lucide-react";

export default function CheckoutFailedPage() {
  return (
    <section className="mx-auto max-w-2xl rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
      <CircleAlert className="mx-auto mb-3 size-10 text-rose-600" />
      <h1 className="text-xl font-semibold text-rose-700">Pembayaran Belum Berhasil</h1>
      <p className="mt-2 text-sm text-rose-800/80">
        Pembayaran dibatalkan, gagal, atau kadaluarsa. Kamu bisa ulangi checkout kapan saja.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link
          href="/checkout"
          className="rounded-md bg-primary-orange px-4 py-2 text-sm font-medium text-white hover:bg-primary-orange/90"
        >
          Coba Bayar Lagi
        </Link>
        <Link
          href="/account/order"
          className="rounded-md border border-primary-orange px-4 py-2 text-sm font-medium text-primary-orange hover:bg-primary-orange/10"
        >
          Cek Status Pesanan
        </Link>
      </div>
    </section>
  );
}
