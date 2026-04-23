"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Loader2, MapPin, Phone, Printer, X } from "lucide-react";

import { AuthFeedbackDialog } from "@/components/ui/auth-feedback-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadAdminOrderReceiptPdf } from "@/lib/orders/admin-receipt-pdf";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ShippingStatusOption =
  | "WAITING_FULFILLMENT"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "DELIVERED";

type OrderDetailPanelProps = {
  orderNumber: string | null;
  onClose: () => void;
  onUpdated?: () => void | Promise<void>;
};

type AdminOrderDetail = {
  id: string;
  orderNumber: string;
  placedAt: string;
  paidAt: string | null;
  statusLabel: string;
  paymentStatus: string;
  paymentStatusLabel: string;
  shippingStatus: ShippingStatusOption;
  shippingStatusLabel: string;
  canUpdateShipment: boolean;
  totals: {
    subtotalAmount: number;
    shippingAmount: number;
    discountAmount: number;
    taxAmount: number;
    grandTotalAmount: number;
  };
  customer: {
    fullName: string;
    email: string;
    phone: string | null;
  };
  shippingAddress: {
    recipientName: string;
    phone: string;
    provinceName: string;
    cityName: string;
    districtName: string;
    subdistrictName: string | null;
    postalCode: string;
    street: string;
    detail: string | null;
  };
  items: Array<{
    id: string;
    name: string;
    imageUrl: string;
    quantity: number;
    unitPrice: number;
    lineSubtotal: number;
  }>;
  shipment: {
    trackingNumber: string | null;
    trackingUrl: string | null;
    courierName: string;
    serviceName: string;
  } | null;
};

type OrderDetailResponse = {
  order?: AdminOrderDetail;
  error?: string;
};

type OrderUpdateResponse = {
  success?: boolean;
  order?: AdminOrderDetail;
  error?: string;
};

const SHIPPING_OPTIONS: Array<{ value: ShippingStatusOption; label: string }> = [
  { value: "WAITING_FULFILLMENT", label: "Belum Diproses" },
  { value: "READY_TO_SHIP", label: "Diproses" },
  { value: "SHIPPED", label: "Dikirim" },
  { value: "DELIVERED", label: "Selesai" },
];

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatCurrency(value: number) {
  return `Rp. ${new Intl.NumberFormat("id-ID").format(Math.max(0, value))},00`;
}

function buildAddressLabel(order: AdminOrderDetail) {
  const area = [
    order.shippingAddress.subdistrictName,
    order.shippingAddress.districtName,
    order.shippingAddress.cityName,
    order.shippingAddress.provinceName,
    order.shippingAddress.postalCode,
  ]
    .map((item) => item?.trim())
    .filter(Boolean)
    .join(", ");

  const street = [order.shippingAddress.street, order.shippingAddress.detail]
    .map((item) => item?.trim())
    .filter(Boolean)
    .join(", ");

  return [street, area].filter(Boolean).join(" | ");
}

function paymentStatusTone(paymentStatus: string) {
  if (paymentStatus === "SETTLED") {
    return "bg-[#EFF5F1] text-[#21B454]";
  }
  if (paymentStatus === "PENDING") {
    return "bg-amber-100 text-amber-700";
  }
  return "bg-gray-100 text-dark-grey";
}

export default function OrderDetailPanel({
  orderNumber,
  onClose,
  onUpdated,
}: OrderDetailPanelProps) {
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [shippingStatus, setShippingStatus] = useState<ShippingStatusOption>("WAITING_FULFILLMENT");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [feedback, setFeedback] = useState<{
    open: boolean;
    variant: "success" | "error";
    title: string;
    description: string;
  } | null>(null);

  const loadOrderDetail = useCallback(async () => {
    if (!orderNumber) {
      setOrder(null);
      return;
    }

    setOrder(null);
    setIsLoading(true);
    const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderNumber)}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    const data = (await response.json().catch(() => ({}))) as OrderDetailResponse;
    setIsLoading(false);

    if (!response.ok || !data.order) {
      setOrder(null);
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Memuat Detail",
        description: data.error ?? "Data pesanan tidak ditemukan.",
      });
      return;
    }

    setOrder(data.order);
    setShippingStatus(data.order.shippingStatus);
    setTrackingNumber(data.order.shipment?.trackingNumber ?? "");
  }, [orderNumber]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOrderDetail();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadOrderDetail]);

  const handlePrint = async () => {
    if (!order) return;

    setIsPrinting(true);
    try {
      await downloadAdminOrderReceiptPdf({
        orderNumber: order.orderNumber,
        items: order.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          lineSubtotal: item.lineSubtotal,
        })),
        shippingAddress: {
          recipientName: order.shippingAddress.recipientName,
          phone: order.shippingAddress.phone || order.customer.phone || null,
          street: order.shippingAddress.street,
          detail: order.shippingAddress.detail,
          subdistrictName: order.shippingAddress.subdistrictName,
          districtName: order.shippingAddress.districtName,
          cityName: order.shippingAddress.cityName,
          provinceName: order.shippingAddress.provinceName,
          postalCode: order.shippingAddress.postalCode,
        },
        totals: {
          subtotalAmount: order.totals.subtotalAmount,
          shippingAmount: order.totals.shippingAmount,
          grandTotalAmount: order.totals.grandTotalAmount,
        },
      });
    } catch {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Mengunduh PDF",
        description: "Struk PDF tidak berhasil dibuat. Coba lagi.",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleUpdate = async () => {
    if (!order) return;

    setIsSaving(true);
    const response = await fetch(`/api/admin/orders/${encodeURIComponent(order.orderNumber)}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shippingStatus,
        trackingNumber: trackingNumber.trim() || undefined,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as OrderUpdateResponse;
    setIsSaving(false);

    if (!response.ok || !data.order) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Memperbarui Pesanan",
        description: data.error ?? "Status pengiriman belum berhasil disimpan.",
      });
      return;
    }

    setOrder(data.order);
    setShippingStatus(data.order.shippingStatus);
    setTrackingNumber(data.order.shipment?.trackingNumber ?? "");

    if (onUpdated) {
      await onUpdated();
    }

    setFeedback({
      open: true,
      variant: "success",
      title: "Status Diperbarui",
      description: "Perubahan status pengiriman berhasil disimpan.",
    });
  };

  if (!orderNumber) {
    return (
      <aside className="flex h-full min-h-0 w-full items-center justify-center rounded-lg bg-white p-6 md:max-w-[430px]">
        <p className="text-xs text-dark-grey">Pilih salah satu pesanan untuk melihat detail.</p>
      </aside>
    );
  }

  return (
    <>
      <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg bg-white md:max-w-[430px]">
        <section className="shrink-0 flex items-start justify-between gap-4 p-5">
          <div>
            <p className="text-xs text-dark-grey">
              {order ? formatDate(order.placedAt) : "-"}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h2 className="text-xs leading-none">
                ID Pesan <span>#{order?.orderNumber ?? orderNumber}</span>
              </h2>
              {order ? (
                <span
                  className={`rounded-full px-2 py-1 text-xs leading-none font-medium ${paymentStatusTone(order.paymentStatus)}`}
                >
                  {order.paymentStatusLabel}
                </span>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            aria-label="Tutup detail"
            className="rounded-md p-1 cursor-pointer"
            onClick={onClose}
          >
            <X className="size-5" strokeWidth={1.8} />
          </button>
        </section>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-dark-grey/70">
              <Loader2 className="size-4 animate-spin" />
              Memuat detail pesanan...
            </div>
          ) : !order ? (
            <p className="text-xs text-dark-grey">Data pesanan tidak ditemukan.</p>
          ) : (
            <div className="flex flex-col gap-8">
              <section className="flex flex-col gap-3">
                <h3 className="text-sm leading-none font-semibold">{order.customer.fullName}</h3>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2 text-xs text-dark-grey">
                    <MapPin className="size-4 shrink-0" strokeWidth={1.8} />
                    <p>{buildAddressLabel(order)}</p>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-dark-grey">
                    <Phone className="size-4 shrink-0" strokeWidth={1.8} />
                    <p>{order.shippingAddress.phone || order.customer.phone || "-"}</p>
                  </div>
                </div>
              </section>

              <hr />

              <section className="flex flex-col gap-5">
                <h4 className="text-xs leading-none font-semibold">Rincian Belanja</h4>

                <div className="flex flex-col gap-5">
                  {order.items.map((item) => (
                    <article key={item.id} className="flex justify-between items-start gap-4">
                      <Image
                        src={item.imageUrl || "/image.png"}
                        alt="Product thumbnail"
                        width={40}
                        height={40}
                        className="size-8 rounded-sm object-contain"
                      />
                      <div className="flex-1">
                        <p className="text-xs leading-tight font-semibold">{item.name}</p>
                        <p className="mt-2 text-xs leading-none">{formatCurrency(item.lineSubtotal)}</p>
                      </div>
                      <p className="text-xs font-semibold text-dark-grey/80">x {item.quantity}</p>
                    </article>
                  ))}
                </div>

                <hr />

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-4 text-xs text-dark-grey">
                      <p>Total Pesanan</p>
                      <p>{formatCurrency(order.totals.subtotalAmount)}</p>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-xs text-dark-grey">
                      <p>Ongkos Kirim</p>
                      <p>{formatCurrency(order.totals.shippingAmount)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 pt-1 text-xs font-semibold leading-none">
                    <p>Total Pembayaran</p>
                    <p>{formatCurrency(order.totals.grandTotalAmount)}</p>
                  </div>
                </div>
              </section>

              <hr />

              <section className="flex flex-col gap-5">
                <div className="flex items-center justify-between gap-4">
                  <h5 className="text-xs leading-none font-semibold">Status Pengiriman</h5>
                  <Select
                    value={shippingStatus}
                    onValueChange={(value) => setShippingStatus(value as ShippingStatusOption)}
                    disabled={!order.canUpdateShipment}
                  >
                    <SelectTrigger className="h-auto border-0 p-0 text-xs leading-none font-semibold text-primary-orange shadow-none focus-visible:ring-0 [&_svg]:size-5 [&_svg]:text-primary-orange">
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent align="end">
                      {SHIPPING_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-3">
                  <h5 className="text-xs leading-none font-semibold">Pelacakan Barang</h5>
                  <div className="flex flex-col gap-2">
                    <Input
                      value={trackingNumber}
                      onChange={(event) => setTrackingNumber(event.target.value)}
                      placeholder="Masukkan Nomor Resi"
                      disabled={!order.canUpdateShipment}
                      className="placeholder:text-dark-grey placeholder:text-xs"
                    />
                  </div>
                  {!order.canUpdateShipment ? (
                    <p className="text-[11px] text-dark-grey">
                      Status pengiriman hanya bisa diperbarui saat pembayaran sudah lunas.
                    </p>
                  ) : null}
                </div>
              </section>
            </div>
          )}
        </div>

        <section className="shrink-0 mt-4 pt-4 border-t flex items-center justify-between gap-4 p-5">
          <Button
            size="icon"
            variant="ghost"
            disabled={!order || isPrinting}
            onClick={() => {
              void handlePrint();
            }}
            className="size-11 shrink-0 text-primary-orange cursor-pointer hover:bg-[#FFF2E8] hover:text-primary-orange"
          >
            {isPrinting ? <Loader2 className="size-5 animate-spin" /> : <Printer className="size-5" />}
          </Button>
          <Button
            disabled={!order || !order.canUpdateShipment || isSaving}
            onClick={() => {
              void handleUpdate();
            }}
            className="flex-1 rounded-sm bg-primary-orange text-xs font-semibold text-white hover:bg-primary-orange/90 cursor-pointer"
          >
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : "Update Status"}
          </Button>
        </section>
      </aside>

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
