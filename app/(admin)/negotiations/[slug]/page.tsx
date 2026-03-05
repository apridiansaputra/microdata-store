import Container from "@/components/admin-layout/container";
import Header from "@/components/admin-layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Phone } from "lucide-react";

type NegotiationDetailPageProps = {
  params: Promise<{ slug: string }>;
};

type NegotiatedProduct = {
  id: string;
  title: string;
  qty: number;
  basePrice: number;
  buyerOffer?: number;
};

const items: NegotiatedProduct[] = [
  {
    id: "1",
    title: 'Apple MacBook Pro 14" M3 Pro Chip - 16GB/512GB - Space Gray',
    qty: 1,
    basePrice: 20000000,
    buyerOffer: 19700000,
  },
  {
    id: "2",
    title: 'Apple MacBook Pro 14" M3 Pro Chip - 16GB/512GB - Space Gray',
    qty: 1,
    basePrice: 20000000,
    buyerOffer: 19800000,
  },
  {
    id: "3",
    title: 'Apple MacBook Pro 14" M3 Pro Chip - 16GB/512GB - Space Gray',
    qty: 1,
    basePrice: 20000000,
  },
];

const formatCurrency = (value: number) =>
  `Rp. ${new Intl.NumberFormat("id-ID").format(value)},00`;

export default async function DetailNegotiationPage({
  params,
}: NegotiationDetailPageProps) {
  await params;

  const totalBase = items.reduce((sum, item) => sum + item.basePrice * item.qty, 0);
  const negotiatedTotal = items.reduce(
    (sum, item) => sum + (item.buyerOffer ?? item.basePrice) * item.qty,
    0
  );

  return (
    <div>
      <Header title="Negsiasi" />

      <Container>
        <section className="rounded-2xl bg-white p-5">
          <div className="flex flex-col gap-4 border-b border-border-grey pb-5 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-secondary">Ari Lukman Winawa</p>
              <div className="flex items-center gap-2 text-xs text-dark-grey">
                <MapPin className="h-3 w-3" />
                <span>Jl. Pahlawan No. 4, Magelang Timur, Jawa Tengah</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-dark-grey">
                <Phone className="h-3 w-3" />
                <span>+62 81260217971</span>
              </div>
            </div>

            <Button
              variant="ghost"
              className="h-auto justify-start text-xs font-semibold text-primary-orange hover:bg-transparent hover:text-primary-orange/85"
            >
              Kirim Negosiasi
            </Button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-4xl border-separate border-spacing-0 text-sm text-secondary">
              <thead>
                <tr>
                  <th className="border-b border-border-grey py-3 text-left text-xs font-medium text-dark-grey">
                    Produk
                  </th>
                  <th className="border-b border-border-grey px-3 py-3 text-left text-xs font-medium text-dark-grey">
                    Harga Awal
                  </th>
                  <th className="border-b border-border-grey px-3 py-3 text-left text-xs font-medium text-dark-grey">
                    Tawaran Pembeli
                  </th>
                  <th className="border-b border-border-grey py-3 text-right text-xs font-medium text-dark-grey">
                    Tawaran Anda
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="border-b border-border-grey py-3">
                      <p className="max-w-[420px] text-xs leading-6 font-medium text-secondary">
                        {item.title}
                      </p>
                      <p className="text-sm text-dark-grey">x{item.qty}</p>
                    </td>
                    <td className="border-b border-border-grey px-3 py-3 text-xs font-medium">
                      {formatCurrency(item.basePrice)}
                    </td>
                    <td className="border-b border-border-grey px-3 py-3 text-xs font-medium">
                      {item.buyerOffer ? formatCurrency(item.buyerOffer) : "-"}
                    </td>
                    <td className="border-b border-border-grey py-3">
                      <div className="ml-auto w-full max-w-3xs">
                        <Input
                          placeholder="Masukkan harga nego anda"
                          className="rounded-lg border-border-grey bg-white text-xs placeholder:text-dark-grey"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-col gap-2 border-t border-border-grey pt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-dark-grey">Total Awal</p>
              <p className="text-xs text-right font-semibold text-dark-grey">
                {formatCurrency(totalBase)}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-secondary">Hasil Nego</p>
              <p className="text-sm text-right font-semibold text-secondary">
                {formatCurrency(negotiatedTotal)}
              </p>
            </div>
          </div>

          <div className="mt-20 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              className="min-w-24 rounded-sm border-border-grey bg-white text-xs text-primary-orange hover:text-primary-orange cursor-pointer"
            >
              Tolak
            </Button>
            <Button className="min-w-24 rounded-sm bg-primary-orange text-xs font-semibold text-white hover:bg-primary-orange/90 cursor-pointer">
              Setuju
            </Button>
          </div>
        </section>
      </Container>
    </div>
  );
}
