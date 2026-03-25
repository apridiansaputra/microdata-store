import Link from "next/link";
import Image from "next/image";
import { Check, Clock3, Package, Truck } from "lucide-react";
import type { ComponentType } from "react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import AccountPageLayout from "../../AccountPageLayout";

type OrderDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type OrderStep = {
  id: string;
  label: string;
  active: boolean;
  icon: ComponentType<{ className?: string }>;
};

type OrderLineItem = {
  id: string;
  title: string;
  price: string;
  qty: number;
  imageSrc: string;
};

const ORDER_STEPS: OrderStep[] = [
  { id: "payment", label: "Menunggu Pembayaran", active: true, icon: Clock3 },
  { id: "packed", label: "Dikemas", active: false, icon: Package },
  { id: "shipped", label: "Dikirim", active: false, icon: Truck },
  { id: "done", label: "Selesai", active: false, icon: Check },
];

const ORDER_ITEMS: OrderLineItem[] = [
  {
    id: "item-1",
    title: 'Apple MacBook Pro 14" M3 Pro Chip - 16GB/512GB - Space Gray',
    price: "Rp. 20.000.000,00",
    qty: 1,
    imageSrc: "/lenovo.png",
  },
  {
    id: "item-2",
    title: 'Apple MacBook Pro 14" M3 Pro Chip - 16GB/512GB - Space Gray',
    price: "Rp. 20.000.000,00",
    qty: 1,
    imageSrc: "/lenovo.png",
  },
  {
    id: "item-3",
    title: 'Apple MacBook Pro 14" M3 Pro Chip - 16GB/512GB - Space Gray',
    price: "Rp. 20.000.000,00",
    qty: 1,
    imageSrc: "/lenovo.png",
  },
];

function OrderProgressTimeline() {
  return (
    <div className="mt-8 md:mt-16">
      <div className="relative">
        <div className="absolute left-8 right-8 top-6 hidden h-0.5 bg-[#F2C59D] md:block" />

        <div className="grid grid-cols-2 gap-y-6 md:grid-cols-4 md:gap-4">
          {ORDER_STEPS.map((step) => {
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className="flex flex-col items-center justify-center gap-2 text-center"
              >
                <div
                  className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full ${
                    step.active ? "bg-primary-orange" : "bg-[#F7CCA6]"
                  }`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <p className={`text-sm ${step.active ? "text-secondary" : "text-dark-grey"}`}>{step.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function OrderLineItems() {
  return (
    <div className="mt-20">
      <h3 className="text-sm font-semibold text-secondary">Rincian Belanja</h3>

      <div className="mt-8 space-y-4">
        {ORDER_ITEMS.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-1 gap-3 rounded-lg py-1 md:grid-cols-[88px_minmax(0,1fr)_auto_auto] md:items-center md:gap-4"
          >
            <div className="h-16 w-16 rounded-md border border-gray-200 bg-white p-1">
              <Image
                src={item.imageSrc}
                alt={item.title}
                width={80}
                height={80}
                className="h-full w-full object-contain"
              />
            </div>

            <p className="max-w-xl text-sm font-semibold leading-8 text-secondary">
              {item.title}
            </p>
            <p className="text-base font-semibold text-secondary">{item.price}</p>
            <p className="text-sm text-dark-grey">x {item.qty}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  await params;

  return (
    <div className="pb-16">
      <AccountPageLayout activeKey="orders">
        <div className="space-y-6">
          <Breadcrumb>
            <BreadcrumbList className="text-xs">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/account/order" className="text-dark-grey">
                    Pesanan Saya
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold text-secondary">
                  Detail Pesanan Saya
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <section className="rounded-lg bg-light-grey p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs text-dark-grey">Tgl. Pemesanan</p>
                <p className="text-xs font-semibold text-secondary">
                  12 Nov, 2025
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button className=" bg-primary-orange text-xs text-white hover:bg-primary-orange/90">
                  Bayar Sekarang
                </Button>
                <Button
                  variant="outline"
                  className=" border-primary-orange text-xs text-primary-orange hover:bg-primary-orange/10 hover:text-primary-orange"
                >
                  Batalkan
                </Button>
              </div>
            </div>

            <OrderProgressTimeline />
            <OrderLineItems />

            <div className="mt-10 border-t border-gray-300 pt-5">
              <div className="ml-auto max-w-md space-y-2">
                <div className="flex items-center justify-between text-sm text-dark-grey">
                  <span>Total Pesanan</span>
                  <span className="">Rp. 60.000.000,00</span>
                </div>
                <div className="flex items-center justify-between text-sm text-dark-grey">
                  <span>Biaya Pengiriman</span>
                  <span className="">Rp. 35.000,00</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-base font-semibold text-secondary">
                    Total Pembayaran
                  </span>
                  <span className="text-base font-semibold text-secondary">
                    Rp. 60.035.000,00
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </AccountPageLayout>
    </div>
  );
}
