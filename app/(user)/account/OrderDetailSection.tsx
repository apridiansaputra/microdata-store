"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Clock3, Copy, Loader2, Package, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AuthFeedbackDialog } from "@/components/ui/auth-feedback-dialog";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { cn } from "@/lib/utils";

type OrderStatusTone = "green" | "neutral" | "yellow" | "blue" | "red";
type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED"
  | "REFUNDED";
type PaymentStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "CHALLENGE"
  | "CAPTURED"
  | "SETTLED"
  | "DENIED"
  | "CANCELLED"
  | "EXPIRED"
  | "FAILED"
  | "REFUNDED"
  | "PARTIAL_REFUNDED"
  | "CHARGEBACK";

type OrderDetailPayload = {
  id: string;
  orderNumber: string;
  placedAt: string;
  paidAt: string | null;
  cancelledAt: string | null;
  expiresAt: string | null;
  status: OrderStatus;
  statusLabel: string;
  statusTone: OrderStatusTone;
  progressStep: number;
  paymentStatus: PaymentStatus;
  paymentStatusLabel: string;
  shippingStatusLabel: string;
  subtotalAmount: number;
  shippingAmount: number;
  discountAmount: number;
  taxAmount: number;
  grandTotalAmount: number;
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
  shipment: {
    courierName: string;
    serviceName: string;
    trackingNumber: string | null;
    trackingUrl: string | null;
    statusLabel: string;
    shippedAt: string | null;
    deliveredAt: string | null;
  } | null;
  items: Array<{
    id: string;
    productId: string | null;
    productSlug: string;
    productSku: string;
    productName: string;
    productImageUrl: string;
    quantity: number;
    unitPrice: number;
    lineSubtotal: number;
  }>;
};

type OrderDetailResponse = {
  order?: OrderDetailPayload;
  error?: string;
};

type PaymentLinkResponse = {
  paymentUrl?: string;
  error?: string;
};

type CancelOrderResponse = {
  success?: boolean;
  error?: string;
};

type OrderStep = {
  id: string;
  label: string;
  icon: typeof Clock3;
};

const ORDER_STEPS: OrderStep[] = [
  { id: "payment", label: "Menunggu Pembayaran", icon: Clock3 },
  { id: "packed", label: "Dikemas", icon: Package },
  { id: "shipped", label: "Dikirim", icon: Truck },
  { id: "done", label: "Selesai", icon: Check },
];

function formatDate(value: string | null) {
  if (!value) return "-";
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
}

function formatCurrency(value: number) {
  return `Rp. ${new Intl.NumberFormat("id-ID").format(Math.max(0, value))},00`;
}

function getRemainingPaymentLabel(expiresAt: string | null, nowMs: number) {
  if (!expiresAt) return null;
  const expiresMs = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresMs)) return null;

  const diffMs = expiresMs - nowMs;
  if (diffMs <= 0) return null;

  const totalMinutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours} jam ${minutes} menit`;
  }
  return `${Math.max(1, minutes)} menit`;
}

function statusToneClass(tone: OrderStatusTone) {
  switch (tone) {
    case "green":
      return "bg-green-100 text-green-600";
    case "yellow":
      return "bg-amber-100 text-amber-700";
    case "blue":
      return "bg-blue-100 text-blue-600";
    case "red":
      return "bg-red-100 text-red-600";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function buildAddressLabel(order: OrderDetailPayload) {
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

export default function OrderDetailSection({
  orderNumber,
}: {
  orderNumber: string;
}) {
  const [order, setOrder] = useState<OrderDetailPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [feedback, setFeedback] = useState<{
    open: boolean;
    variant: "success" | "error";
    title: string;
    description: string;
  } | null>(null);
  const [isTrackingCopied, setIsTrackingCopied] = useState(false);

  const loadOrderDetail = useCallback(async () => {
    setIsLoading(true);
    const response = await fetch(`/api/account/orders/${encodeURIComponent(orderNumber)}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    const data = (await response.json().catch(() => ({}))) as OrderDetailResponse;

    if (!response.ok || !data.order) {
      setOrder(null);
      setFeedback({
        open: true,
        variant: "error",
        title: "Detail Pesanan Tidak Tersedia",
        description: data.error ?? "Pesanan ini tidak ditemukan atau tidak bisa diakses.",
      });
      setIsLoading(false);
      return;
    }

    setOrder(data.order);
    setIsLoading(false);
  }, [orderNumber]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOrderDetail();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadOrderDetail]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 30_000);

    return () => window.clearInterval(timer);
  }, []);

  const timeline = useMemo(() => {
    const activeUntil = Math.min(Math.max(order?.progressStep ?? 1, 1), ORDER_STEPS.length);
    return ORDER_STEPS.map((step, index) => ({
      ...step,
      active: index < activeUntil,
    }));
  }, [order?.progressStep]);

  const isPendingPayment =
    order?.status === "PENDING_PAYMENT" && order?.paymentStatus === "PENDING";
  const remainingPaymentLabel = useMemo(
    () => getRemainingPaymentLabel(order?.expiresAt ?? null, nowMs),
    [order?.expiresAt, nowMs],
  );
  const canShowPendingPaymentActions =
    !!isPendingPayment && !!remainingPaymentLabel;

  const handleCopyTracking = async () => {
    if (!order?.shipment?.trackingNumber) return;
    try {
      await navigator.clipboard.writeText(order.shipment.trackingNumber);
      setIsTrackingCopied(true);
      window.setTimeout(() => setIsTrackingCopied(false), 1200);
    } catch {
      setIsTrackingCopied(false);
    }
  };

  const handlePayNow = async () => {
    if (!order) return;
    setIsPaying(true);

    const response = await fetch(
      `/api/account/orders/${encodeURIComponent(order.orderNumber)}/payment-link`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      },
    );
    const data = (await response.json().catch(() => ({}))) as PaymentLinkResponse;
    setIsPaying(false);

    if (!response.ok || !data.paymentUrl) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Membuka Pembayaran",
        description: data.error ?? "Link pembayaran tidak tersedia atau sudah kedaluwarsa.",
      });
      await loadOrderDetail();
      return;
    }

    window.location.href = data.paymentUrl;
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    setIsCancelling(true);
    const response = await fetch(
      `/api/account/orders/${encodeURIComponent(order.orderNumber)}/cancel`,
      {
        method: "POST",
        credentials: "include",
      },
    );
    const data = (await response.json().catch(() => ({}))) as CancelOrderResponse;
    setIsCancelling(false);

    if (!response.ok) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Membatalkan Pesanan",
        description: data.error ?? "Pesanan tidak bisa dibatalkan.",
      });
      await loadOrderDetail();
      return;
    }

    setFeedback({
      open: true,
      variant: "success",
      title: "Pesanan Dibatalkan",
      description: "Pesanan berhasil dibatalkan.",
    });
    await loadOrderDetail();
  };

  if (isLoading) {
    return (
      <section className="rounded-lg bg-light-grey p-6 md:p-8">
        <div className="flex items-center gap-2 text-xs text-dark-grey/70">
          <Loader2 className="size-4 animate-spin" />
          Memuat detail pesanan...
        </div>
      </section>
    );
  }

  if (!order) {
    return (
      <>
        <section className="rounded-lg bg-light-grey p-6 md:p-8">
          <h2 className="text-base font-semibold text-secondary">Data pesanan tidak ditemukan</h2>
          <p className="mt-2 text-xs text-dark-grey">
            Nomor pesanan <span className="font-semibold">{orderNumber}</span> tidak tersedia.
          </p>
          <Link
            href="/account/order"
            className="mt-4 inline-flex rounded-md bg-primary-orange px-4 py-2 text-xs font-semibold text-white hover:bg-primary-orange/90"
          >
            Kembali ke Pesanan Saya
          </Link>
        </section>
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

  return (
    <>
      <section className="rounded-lg bg-light-grey p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-xs text-dark-grey">No. Pesanan: {order.orderNumber}</p>
            <p className="text-xs text-dark-grey">Tgl. Pemesanan: {formatDate(order.placedAt)}</p>
            <div className="flex flex-wrap gap-2">
              <span
                className={cn(
                  "inline-flex rounded-md px-2 py-1 text-[11px] font-semibold",
                  statusToneClass(order.statusTone),
                )}
              >
                {order.statusLabel}
              </span>
              <span className="inline-flex rounded-md bg-white px-2 py-1 text-[11px] text-dark-grey">
                {order.paymentStatusLabel}
              </span>
              <span className="inline-flex rounded-md bg-white px-2 py-1 text-[11px] text-dark-grey">
                {order.shippingStatusLabel}
              </span>
            </div>
          </div>

          {canShowPendingPaymentActions ? (
            <div className="flex flex-col items-start gap-2 md:items-end">
              <p className="text-[11px] text-secondary">
                Sisa waktu pembayaran: {remainingPaymentLabel}
              </p>
              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isCancelling || isPaying}
                  onClick={() => {
                    setIsCancelConfirmOpen(true);
                  }}
                  className="border-primary-orange text-xs text-primary-orange hover:bg-primary-orange/10 hover:text-primary-orange"
                >
                  {isCancelling ? <Loader2 className="size-4 animate-spin" /> : "Batalkan"}
                </Button>
                <Button
                  type="button"
                  disabled={isPaying || isCancelling}
                  onClick={() => {
                    void handlePayNow();
                  }}
                  className="bg-primary-orange text-xs text-white hover:bg-primary-orange/90"
                >
                  {isPaying ? <Loader2 className="size-4 animate-spin" /> : "Bayar Sekarang"}
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-8 md:mt-12">
          <div className="relative">
            <div className="absolute left-8 right-8 top-6 hidden h-0.5 bg-[#F2C59D] md:block" />
            <div className="grid grid-cols-2 gap-y-6 md:grid-cols-4 md:gap-4">
              {timeline.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.id}
                    className="flex flex-col items-center justify-center gap-2 text-center"
                  >
                    <div
                      className={cn(
                        "relative z-10 flex h-12 w-12 items-center justify-center rounded-full",
                        step.active ? "bg-primary-orange" : "bg-[#F7CCA6]",
                      )}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <p
                      className={cn(
                        "text-sm",
                        step.active ? "text-secondary" : "text-dark-grey",
                      )}
                    >
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {order.shipment?.trackingNumber ? (
          <div className="mt-8 rounded-md bg-white p-3 text-xs text-dark-grey">
            <div className="flex flex-wrap items-center gap-3">
              <span>
                Resi: <span className="font-semibold">#{order.shipment.trackingNumber}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  void handleCopyTracking();
                }}
                className="inline-flex items-center gap-1 text-dark-grey"
              >
                <Copy className="h-3.5 w-3.5" />
                {isTrackingCopied ? "Tersalin" : "Salin"}
              </button>
            </div>
            <p className="mt-1 text-[11px]">
              {order.shipment.courierName} | {order.shipment.serviceName}
            </p>
            {order.shipment.trackingUrl ? (
              <a
                href={order.shipment.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex text-blue-600 underline"
              >
                Lacak di website ekspedisi
              </a>
            ) : null}
          </div>
        ) : null}

        <div className="mt-10">
          <h3 className="text-sm font-semibold text-secondary">Rincian Belanja</h3>
          <div className="mt-6 space-y-4">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-1 gap-3 rounded-lg py-1 md:grid-cols-[88px_minmax(0,1fr)_auto_auto] md:items-center md:gap-4"
              >
                <div className="h-16 w-16 rounded-md border border-gray-200 bg-white p-1">
                  <Image
                    src={item.productImageUrl}
                    alt={item.productName}
                    width={80}
                    height={80}
                    className="h-full w-full object-contain"
                  />
                </div>
                <p className="max-w-xl text-sm font-semibold leading-7 text-secondary">
                  {item.productName}
                </p>
                <p className="text-base font-semibold text-secondary">
                  {formatCurrency(item.lineSubtotal)}
                </p>
                <p className="text-sm text-dark-grey">x {item.quantity}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-md bg-white p-4 text-xs text-dark-grey">
          <p className="font-semibold text-secondary">Alamat Pengiriman</p>
          <p className="mt-1">
            {order.shippingAddress.recipientName} ({order.shippingAddress.phone})
          </p>
          <p className="mt-1">{buildAddressLabel(order)}</p>
        </div>

        <div className="mt-10 border-t border-gray-300 pt-5">
          <div className="ml-auto max-w-md space-y-2">
            <div className="flex items-center justify-between text-sm text-dark-grey">
              <span>Total Pesanan</span>
              <span>{formatCurrency(order.subtotalAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-dark-grey">
              <span>Biaya Pengiriman</span>
              <span>{formatCurrency(order.shippingAmount)}</span>
            </div>
            {order.discountAmount > 0 ? (
              <div className="flex items-center justify-between text-sm text-dark-grey">
                <span>Diskon</span>
                <span>-{formatCurrency(order.discountAmount)}</span>
              </div>
            ) : null}
            {order.taxAmount > 0 ? (
              <div className="flex items-center justify-between text-sm text-dark-grey">
                <span>Pajak</span>
                <span>{formatCurrency(order.taxAmount)}</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between pt-2">
              <span className="text-base font-semibold text-secondary">Total Pembayaran</span>
              <span className="text-base font-semibold text-secondary">
                {formatCurrency(order.grandTotalAmount)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button
            asChild
            variant="outline"
            className="border-primary-orange text-xs text-primary-orange hover:bg-primary-orange/10 hover:text-primary-orange"
          >
            <Link href="/account/order">Kembali ke Pesanan Saya</Link>
          </Button>
        </div>
      </section>

      <AuthFeedbackDialog
        open={feedback?.open ?? false}
        onOpenChange={(open) => {
          if (!open) setFeedback(null);
        }}
        variant={feedback?.variant ?? "success"}
        title={feedback?.title ?? ""}
        description={feedback?.description ?? ""}
      />

      <ConfirmActionDialog
        open={isCancelConfirmOpen}
        onOpenChange={setIsCancelConfirmOpen}
        variant="error"
        title="Batalkan Pesanan?"
        description="Pesanan yang dibatalkan tidak bisa dipulihkan."
        cancelLabel="Kembali"
        confirmLabel="Ya, Batalkan"
        confirmTone="danger"
        loading={isCancelling}
        onCancel={() => setIsCancelConfirmOpen(false)}
        onConfirm={() => {
          setIsCancelConfirmOpen(false);
          void handleCancelOrder();
        }}
      />
    </>
  );
}

