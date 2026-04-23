import Link from "next/link";
import { CircleCheckBig } from "lucide-react";

export default function CheckoutSuccessPage() {
  return (
    <section className="mx-auto max-w-2xl rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
      <CircleCheckBig className="mx-auto mb-3 size-10 text-emerald-600" />
      <h1 className="text-xl font-semibold text-emerald-700">Pembayaran Berhasil</h1>
      <p className="mt-2 text-sm text-emerald-800/80">
        Pesananmu sudah tercatat. Status akhir pembayaran akan dipastikan melalui webhook Xendit.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link
          href="/account/order"
          className="rounded-md bg-primary-orange px-4 py-2 text-sm font-medium text-white hover:bg-primary-orange/90"
        >
          Lihat Pesanan Saya
        </Link>
        <Link
          href="/products"
          className="rounded-md border border-primary-orange px-4 py-2 text-sm font-medium text-primary-orange hover:bg-primary-orange/10"
        >
          Belanja Lagi
        </Link>
      </div>
    </section>
  );
}
