"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OrderStatusTone = "green" | "neutral" | "yellow" | "blue";
type OrderActionTone = "solid" | "outline";

type OrderAction = {
  label: string;
  tone: OrderActionTone;
};

type OrderItem = {
  id: string;
  orderDate: string;
  status: string;
  statusTone: OrderStatusTone;
  productTitle: string;
  quantity: number;
  priceLabel: string;
  imageSrc: string;
  detailHref: string;
  trackingNumber?: string;
  trackingLink?: string;
  paymentDueText?: string;
  actions?: OrderAction[];
};

const ORDER_ITEMS: OrderItem[] = [
  {
    id: "ORD-001",
    orderDate: "12 Nov, 2025",
    status: "Sedang Dikirim",
    statusTone: "green",
    productTitle: "Apple MacBook Pro 14\" M3 Pro Chip - 16GB/512GB - Space Gray",
    quantity: 1,
    priceLabel: "Rp. 20.000,00",
    imageSrc: "/lenovo.png",
    detailHref: "/account/order/ORD-001",
    trackingNumber: "#0984563772",
    trackingLink: "https://ekspedisi.com/cek-resi",
    actions: [{ label: "Barang sudah diterima", tone: "solid" }],
  },
  {
    id: "ORD-002",
    orderDate: "12 Nov, 2025",
    status: "Selesai",
    statusTone: "neutral",
    productTitle: "Apple MacBook Pro 14\" M3 Pro Chip - 16GB/512GB - Space Gray",
    quantity: 1,
    priceLabel: "Rp. 20.000,00",
    imageSrc: "/lenovo.png",
    detailHref: "/account/order/ORD-002",
    actions: [
      { label: "Beli Lagi", tone: "outline" },
      { label: "Nilai", tone: "solid" },
    ],
  },
  {
    id: "ORD-003",
    orderDate: "12 Nov, 2025",
    status: "Belum Bayar",
    statusTone: "yellow",
    productTitle: "Apple MacBook Pro 14\" M3 Pro Chip - 16GB/512GB - Space Gray",
    quantity: 1,
    priceLabel: "Rp. 20.000,00",
    imageSrc: "/lenovo.png",
    detailHref: "/account/order/ORD-003",
    paymentDueText: "Sisa waktu pembayaran : 23 jam 40 menit",
    actions: [
      { label: "Batalkan", tone: "outline" },
      { label: "Bayar Sekarang", tone: "solid" },
    ],
  },
  {
    id: "ORD-004",
    orderDate: "12 Nov, 2025",
    status: "Sedang Diproses",
    statusTone: "blue",
    productTitle: "Apple MacBook Pro 14\" M3 Pro Chip - 16GB/512GB - Space Gray",
    quantity: 1,
    priceLabel: "Rp. 20.000,00",
    imageSrc: "/lenovo.png",
    detailHref: "/account/order/ORD-004",
  },
];

function statusToneClass(tone: OrderStatusTone) {
  switch (tone) {
    case "green":
      return "bg-green-100 text-green-600";
    case "yellow":
      return "bg-amber-100 text-amber-700";
    case "blue":
      return "bg-blue-100 text-blue-600";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function OrderCard({ order }: { order: OrderItem }) {
  const [copied, setCopied] = useState(false);

  const copyTrackingNumber = async () => {
    if (!order.trackingNumber) return;
    try {
      await navigator.clipboard.writeText(order.trackingNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article className="rounded-xl bg-white p-4 md:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="grid grid-cols-2 gap-6 md:gap-10">
          <div className="space-y-1">
            <p className="text-[10px] text-dark-grey">Tgl. Pemesanan</p>
            <p className="text-[11px] font-semibold text-secondary">{order.orderDate}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-dark-grey">Status</p>
            <span
              className={cn(
                "inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                statusToneClass(order.statusTone)
              )}
            >
              {order.status}
            </span>
          </div>
        </div>

        <Link
          href={order.detailHref}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary-orange"
        >
          Lihat Detail
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-md border border-gray-200 p-1">
            <Image
              src={order.imageSrc}
              alt={order.productTitle}
              width={84}
              height={84}
              className="h-[84px] w-[84px] object-contain"
            />
          </div>
          <div>
            <p className="max-w-xl text-xs font-semibold text-secondary">
              {order.productTitle}
            </p>
            <p className="mt-1 text-[10px] text-dark-grey">Jumlah: {order.quantity}</p>
          </div>
        </div>

        <p className="text-lg font-semibold text-primary-orange">{order.priceLabel}</p>
      </div>

      {order.trackingNumber && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-col gap-2 rounded-md bg-light-grey p-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4 text-[11px]">
              <span className="text-dark-grey">No. Resi :</span>
              <span className="font-semibold text-dark-grey">{order.trackingNumber}</span>
              <button
                type="button"
                onClick={copyTrackingNumber}
                className="inline-flex items-center gap-1 text-dark-grey"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Tersalin" : ""}
              </button>
            </div>

            {order.actions?.[0] && (
              <Button className="h-8 rounded-md bg-primary-orange px-4 text-[11px] text-white hover:bg-primary-orange/90">
                {order.actions[0].label}
              </Button>
            )}
          </div>

          {order.trackingLink && (
            <p className="text-xs text-dark-grey">
              Lacak barang anda dengan copy no resi diatas dan paste pada link
              berikut :
              <a
                href={order.trackingLink}
                target="_blank"
                rel="noreferrer"
                className="ml-1 text-blue-600 underline"
              >
                {order.trackingLink}
              </a>
            </p>
          )}
        </div>
      )}

      {!order.trackingNumber && order.actions && order.actions.length > 0 && (
        <div className="mt-4 flex flex-col items-start gap-2 md:items-end">
          {order.paymentDueText && (
            <p className="text-[11px] text-secondary">{order.paymentDueText}</p>
          )}

          <div className="flex w-full flex-wrap justify-end gap-3">
            {order.actions.map((action) => (
              <Button
                key={action.label}
                variant={action.tone === "outline" ? "outline" : "default"}
                className={cn(
                  "h-8 min-w-32 rounded-md px-4 text-[11px] font-semibold",
                  action.tone === "outline"
                    ? "border-primary-orange text-primary-orange hover:bg-primary-orange/10 hover:text-primary-orange"
                    : "bg-primary-orange text-white hover:bg-primary-orange/90"
                )}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

export default function OrdersListSection() {
  return (
    <section className="rounded-2xl bg-light-grey p-4 md:p-6">
      <div className="space-y-4">
        {ORDER_ITEMS.map((item) => (
          <OrderCard key={item.id} order={item} />
        ))}
      </div>
    </section>
  );
}
