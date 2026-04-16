"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Camera, ChevronRight, Copy, Loader2, Star, X } from "lucide-react";

import { AuthFeedbackDialog } from "@/components/ui/auth-feedback-dialog";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { uploadReviewImageFile } from "@/lib/orders/upload-client";
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

type UserOrderItem = {
  orderNumber: string;
  placedAt: string;
  expiresAt: string | null;
  status: OrderStatus;
  statusLabel: string;
  statusTone: OrderStatusTone;
  paymentStatus: PaymentStatus;
  paymentStatusLabel: string;
  shippingStatusLabel: string;
  totalAmount: number;
  totalQuantity: number;
  itemCount: number;
  previewTitle: string;
  previewProductSlug: string | null;
  previewImageUrl: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  courierName: string | null;
  serviceName: string | null;
};

type OrdersApiResponse = {
  orders?: UserOrderItem[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  error?: string;
};

type PaymentLinkResponse = {
  paymentUrl?: string;
  error?: string;
};

type GenericApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};

type ReviewOrderItem = {
  orderItemId: string;
  productId: string | null;
  productSlug: string;
  productName: string;
  productImageUrl: string;
  quantity: number;
  existingReview: {
    id: string;
    rating: number;
    title: string | null;
    content: string | null;
    images: string[];
    createdAt: string;
    updatedAt: string;
  } | null;
};

type OrderReviewQueryResponse = {
  orderNumber?: string;
  status?: OrderStatus;
  statusLabel?: string;
  canReview?: boolean;
  items?: ReviewOrderItem[];
  error?: string;
};

type OrderReviewSubmitResponse = {
  success?: boolean;
  reviewedCount?: number;
  message?: string;
  error?: string;
};

type ReviewFormValue = {
  orderItemId: string;
  productName: string;
  productImageUrl: string;
  quantity: number;
  rating: number;
  content: string;
  imageUrls: string[];
};

const MAX_REVIEW_IMAGES = 6;

function formatDate(value: string) {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

function StarRatingInput({
  value,
  disabled,
  onChange,
}: {
  value: number;
  disabled: boolean;
  onChange: (nextValue: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: 5 }).map((_, index) => {
        const starValue = index + 1;
        const active = starValue <= value;
        return (
          <button
            key={`review-star-${starValue}`}
            type="button"
            disabled={disabled}
            onClick={() => onChange(starValue)}
            className="rounded-sm p-0.5 disabled:cursor-not-allowed"
            aria-label={`Pilih ${starValue} bintang`}
          >
            <Star
              className={cn(
                "h-5 w-5 transition-colors",
                active
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-transparent text-gray-300",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

function OrderReviewDialog({
  open,
  orderNumber,
  onOpenChange,
  onSubmitted,
  onFeedback,
}: {
  open: boolean;
  orderNumber: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmitted: () => Promise<void>;
  onFeedback: (variant: "success" | "error", title: string, description: string) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [reviewValues, setReviewValues] = useState<ReviewFormValue[]>([]);

  const loadReviewItems = useCallback(async () => {
    if (!orderNumber) return;
    setIsLoading(true);

    const response = await fetch(
      `/api/account/orders/${encodeURIComponent(orderNumber)}/reviews`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      },
    );
    const data = (await response.json().catch(() => ({}))) as OrderReviewQueryResponse;
    setIsLoading(false);

    if (!response.ok) {
      onFeedback(
        "error",
        "Gagal Memuat Form Ulasan",
        data.error ?? "Form ulasan tidak bisa dibuka saat ini.",
      );
      onOpenChange(false);
      return;
    }

    const items = data.items ?? [];
    setCanReview(Boolean(data.canReview));
    setReviewValues(
      items.map((item) => ({
        orderItemId: item.orderItemId,
        productName: item.productName,
        productImageUrl: item.productImageUrl,
        quantity: item.quantity,
        rating: item.existingReview?.rating ?? 0,
        content: item.existingReview?.content ?? "",
        imageUrls: item.existingReview?.images ?? [],
      })),
    );
  }, [onFeedback, onOpenChange, orderNumber]);

  useEffect(() => {
    if (!open || !orderNumber) return;
    const timer = window.setTimeout(() => {
      void loadReviewItems();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadReviewItems, open, orderNumber]);

  const handleSubmit = async () => {
    if (!orderNumber) return;
    if (!canReview) {
      onFeedback(
        "error",
        "Pesanan Belum Bisa Dinilai",
        "Ulasan hanya bisa diberikan untuk pesanan yang sudah selesai.",
      );
      return;
    }

    const payload = reviewValues
      .filter((item) => item.rating > 0)
      .map((item) => ({
        orderItemId: item.orderItemId,
        rating: item.rating,
        content: item.content.trim() || undefined,
        imageUrls: item.imageUrls,
      }));

    if (payload.length === 0) {
      onFeedback(
        "error",
        "Ulasan Belum Lengkap",
        "Berikan minimal satu rating bintang untuk produk yang ingin dinilai.",
      );
      return;
    }

    setIsSubmitting(true);
    const response = await fetch(
      `/api/account/orders/${encodeURIComponent(orderNumber)}/reviews`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          reviews: payload,
        }),
      },
    );
    const data = (await response.json().catch(() => ({}))) as OrderReviewSubmitResponse;
    setIsSubmitting(false);

    if (!response.ok) {
      onFeedback(
        "error",
        "Gagal Menyimpan Ulasan",
        data.error ?? "Ulasan belum bisa disimpan. Coba lagi.",
      );
      return;
    }

    onFeedback(
      "success",
      "Ulasan Berhasil Disimpan",
      data.message ?? "Terima kasih, ulasanmu sudah terkirim.",
    );
    onOpenChange(false);
    await onSubmitted();
  };

  const handleUploadImages = async (orderItemId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const currentItem = reviewValues.find((item) => item.orderItemId === orderItemId);
    if (!currentItem) return;

    const remainingQuota = Math.max(0, MAX_REVIEW_IMAGES - currentItem.imageUrls.length);
    if (remainingQuota <= 0) {
      onFeedback(
        "error",
        "Batas Foto Tercapai",
        `Maksimal ${MAX_REVIEW_IMAGES} foto untuk setiap produk.`,
      );
      return;
    }

    const selectedFiles = Array.from(files).slice(0, remainingQuota);
    setUploadingItemId(orderItemId);
    const uploadedUrls: string[] = [];

    for (const file of selectedFiles) {
      const uploaded = await uploadReviewImageFile(file);
      if (!uploaded.ok) {
        onFeedback(
          "error",
          "Upload Foto Gagal",
          uploaded.error,
        );
        continue;
      }
      uploadedUrls.push(uploaded.url);
    }

    setUploadingItemId(null);

    if (uploadedUrls.length > 0) {
      setReviewValues((current) =>
        current.map((item) =>
          item.orderItemId === orderItemId
            ? {
                ...item,
                imageUrls: [...item.imageUrls, ...uploadedUrls].slice(0, MAX_REVIEW_IMAGES),
              }
            : item,
        ),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden border-0 bg-white p-0 sm:max-w-5xl">
        <div className="flex max-h-[90vh] flex-col">
          <DialogHeader className="border-b border-gray-200 px-6 py-5 sm:px-8">
            <DialogTitle className="text-lg font-semibold text-secondary">
              Nilai Produk
            </DialogTitle>
            <DialogDescription className="text-xs text-dark-grey">
              Berikan rating dan ulasanmu untuk produk yang sudah diterima.
            </DialogDescription>
          </DialogHeader>

          <div className="custom-scrollbar flex-1 overflow-y-auto px-6 py-5 sm:px-8">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-dark-grey">
                <Loader2 className="h-4 w-4 animate-spin" />
                Memuat daftar produk...
              </div>
            ) : reviewValues.length === 0 ? (
              <p className="text-sm text-dark-grey">
                Tidak ada produk yang bisa dinilai pada pesanan ini.
              </p>
            ) : (
              <div className="space-y-5">
                {reviewValues.map((item) => (
                  <div
                    key={item.orderItemId}
                    className="rounded-xl border border-gray-200 bg-light-grey/40 p-4 sm:p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="h-[92px] w-[92px] rounded-md border border-gray-200 bg-white p-1">
                        <Image
                          src={item.productImageUrl}
                          alt={item.productName}
                          width={90}
                          height={90}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div>
                          <p className="text-sm font-semibold leading-snug text-secondary sm:text-base">
                            {item.productName}
                          </p>
                          <p className="mt-1 text-xs text-dark-grey">
                            Jumlah: {item.quantity}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-xs font-medium text-secondary">
                            Rating Produk:
                          </p>
                          <StarRatingInput
                            value={item.rating}
                            disabled={isSubmitting || !canReview}
                            onChange={(nextRating) => {
                              setReviewValues((current) =>
                                current.map((entry) =>
                                  entry.orderItemId === item.orderItemId
                                    ? { ...entry, rating: nextRating }
                                    : entry,
                                ),
                              );
                            }}
                          />
                        </div>

                        <Textarea
                          value={item.content}
                          disabled={isSubmitting || !canReview}
                          onChange={(event) => {
                            const nextValue = event.target.value;
                            setReviewValues((current) =>
                              current.map((entry) =>
                                entry.orderItemId === item.orderItemId
                                  ? { ...entry, content: nextValue }
                                  : entry,
                              ),
                            );
                          }}
                          rows={5}
                          maxLength={2000}
                          className="resize-none rounded-md border-gray-300 bg-white px-4 py-3 text-xs"
                          placeholder="Bagikan penilaianmu untuk membantu pembeli lain"
                        />

                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <label
                              htmlFor={`review-photo-input-${item.orderItemId}`}
                              className={cn(
                                "inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-primary-orange px-3 text-xs font-semibold text-primary-orange transition-colors",
                                (isSubmitting || !canReview || uploadingItemId === item.orderItemId) &&
                                  "cursor-not-allowed opacity-60",
                              )}
                            >
                              {uploadingItemId === item.orderItemId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Camera className="h-4 w-4" />
                              )}
                              Tambah Foto
                            </label>
                            <input
                              id={`review-photo-input-${item.orderItemId}`}
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              multiple
                              disabled={isSubmitting || !canReview || uploadingItemId === item.orderItemId}
                              className="hidden"
                              onChange={(event) => {
                                const files = event.target.files;
                                void handleUploadImages(item.orderItemId, files);
                                event.currentTarget.value = "";
                              }}
                            />

                            <p className="text-xs text-dark-grey">
                              Maks {MAX_REVIEW_IMAGES} foto
                            </p>
                          </div>

                          {item.imageUrls.length > 0 ? (
                            <div className="flex flex-wrap gap-3">
                              {item.imageUrls.map((imageUrl, index) => (
                                <div
                                  key={`${item.orderItemId}-review-photo-${imageUrl}-${index}`}
                                  className="relative h-20 w-20 overflow-hidden rounded-md border border-gray-200 bg-white p-1"
                                >
                                  <Image
                                    src={imageUrl}
                                    alt={`Foto ulasan ${item.productName} ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="80px"
                                  />
                                  <button
                                    type="button"
                                    disabled={isSubmitting || !canReview}
                                    onClick={() => {
                                      setReviewValues((current) =>
                                        current.map((entry) =>
                                          entry.orderItemId === item.orderItemId
                                            ? {
                                                ...entry,
                                                imageUrls: entry.imageUrls.filter((_, imageIndex) => imageIndex !== index),
                                              }
                                            : entry,
                                        ),
                                      );
                                    }}
                                    className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white disabled:cursor-not-allowed"
                                    aria-label="Hapus foto ulasan"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-gray-200 px-6 py-5 sm:px-8">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="h-10 min-w-32 rounded-md border-primary-orange text-sm font-medium text-primary-orange hover:bg-primary-orange/10 hover:text-primary-orange"
            >
              Nanti Saja
            </Button>
            <Button
              type="button"
              disabled={
                isSubmitting ||
                isLoading ||
                reviewValues.length === 0 ||
                !canReview ||
                uploadingItemId !== null
              }
              onClick={() => {
                void handleSubmit();
              }}
              className="h-10 min-w-32 rounded-md bg-primary-orange text-sm font-semibold text-white hover:bg-primary-orange/90"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Beri Ulasan"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OrderCard({
  order,
  onOrderChanged,
  onOpenReview,
  onFeedback,
}: {
  order: UserOrderItem;
  onOrderChanged: () => Promise<void>;
  onOpenReview: (orderNumber: string) => void;
  onFeedback: (variant: "success" | "error", title: string, description: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | "cancel" | "received">(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 30_000);

    return () => window.clearInterval(timer);
  }, []);

  const isPendingPayment =
    order.status === "PENDING_PAYMENT" && order.paymentStatus === "PENDING";
  const canConfirmReceived = order.status === "SHIPPED" || order.status === "DELIVERED";
  const canReview = order.status === "COMPLETED";
  const remainingPaymentLabel = useMemo(
    () => getRemainingPaymentLabel(order.expiresAt, nowMs),
    [order.expiresAt, nowMs],
  );
  const canShowPendingPaymentActions =
    isPendingPayment && !!remainingPaymentLabel;

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

  const handlePayNow = async () => {
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
      onFeedback(
        "error",
        "Gagal Membuka Pembayaran",
        data.error ?? "Link pembayaran tidak tersedia atau sudah kedaluwarsa.",
      );
      await onOrderChanged();
      return;
    }

    window.location.href = data.paymentUrl;
  };

  const handleCancelOrder = async () => {
    setIsCancelling(true);
    const response = await fetch(
      `/api/account/orders/${encodeURIComponent(order.orderNumber)}/cancel`,
      {
        method: "POST",
        credentials: "include",
      },
    );
    const data = (await response.json().catch(() => ({}))) as GenericApiResponse;
    setIsCancelling(false);

    if (!response.ok) {
      onFeedback(
        "error",
        "Gagal Membatalkan Pesanan",
        data.error ?? "Pesanan tidak bisa dibatalkan.",
      );
      await onOrderChanged();
      return;
    }

    onFeedback("success", "Pesanan Dibatalkan", "Pesanan berhasil dibatalkan.");
    await onOrderChanged();
  };

  const handleConfirmReceived = async () => {
    setIsConfirming(true);
    const response = await fetch(
      `/api/account/orders/${encodeURIComponent(order.orderNumber)}/received`,
      {
        method: "POST",
        credentials: "include",
      },
    );
    const data = (await response.json().catch(() => ({}))) as GenericApiResponse;
    setIsConfirming(false);

    if (!response.ok) {
      onFeedback(
        "error",
        "Gagal Konfirmasi Pesanan",
        data.error ?? "Pesanan belum bisa dikonfirmasi diterima.",
      );
      await onOrderChanged();
      return;
    }

    onFeedback(
      "success",
      "Pesanan Diterima",
      data.message ?? "Pesanan berhasil dikonfirmasi selesai.",
    );
    await onOrderChanged();
  };

  return (
    <article className="rounded-xl bg-white p-4 md:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="grid grid-cols-2 gap-6 md:gap-10">
          <div className="space-y-1">
            <p className="text-[10px] text-dark-grey">Tgl. Pemesanan</p>
            <p className="text-[11px] font-semibold text-secondary">{formatDate(order.placedAt)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-dark-grey">Status</p>
            <span
              className={cn(
                "inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                statusToneClass(order.statusTone),
              )}
            >
              {order.statusLabel}
            </span>
          </div>
        </div>

        <Link
          href={`/account/order/${encodeURIComponent(order.orderNumber)}`}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary-orange"
        >
          Lihat Detail
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div className="flex items-start gap-4">
          <div className="rounded-md border border-gray-200 p-1">
            <Image
              src={order.previewImageUrl}
              alt={order.previewTitle}
              width={84}
              height={84}
              className="h-[84px] w-[84px] object-contain"
            />
          </div>
          <div>
            <p className="max-w-xl text-xs font-semibold text-secondary">{order.previewTitle}</p>
            <p className="mt-1 text-[10px] text-dark-grey">
              Jumlah: {order.totalQuantity} | {order.itemCount} item
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <p className="text-lg font-semibold text-primary-orange">
            {formatCurrency(order.totalAmount)}
          </p>
          {canConfirmReceived ? (
            <Button
              type="button"
              disabled={isConfirming}
              onClick={() => {
                setConfirmAction("received");
              }}
              className="h-8 rounded-md bg-primary-orange px-4 text-[11px] text-white hover:bg-primary-orange/90"
            >
              {isConfirming ? <Loader2 className="size-4 animate-spin" /> : "Barang sudah diterima"}
            </Button>
          ) : null}
        </div>
      </div>

      {order.trackingNumber ? (
        <div className="mt-4 space-y-3">
          <div className="flex flex-col gap-2 rounded-md bg-light-grey p-3">
            <div className="flex items-center gap-4 text-[11px]">
              <span className="text-dark-grey">No. Resi :</span>
              <span className="font-semibold text-dark-grey">#{order.trackingNumber}</span>
              <button
                type="button"
                onClick={() => {
                  void copyTrackingNumber();
                }}
                className="inline-flex items-center gap-1 text-dark-grey"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Tersalin" : ""}
              </button>
            </div>
            {(order.courierName || order.serviceName) && (
              <p className="text-[11px] text-dark-grey">
                {order.courierName ?? "Ekspedisi"} {order.serviceName ? `| ${order.serviceName}` : ""}
              </p>
            )}
          </div>

          {order.trackingUrl && (
            <p className="text-xs text-dark-grey">
              Lacak barang anda dengan copy no resi diatas dan paste pada link berikut :
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-1 text-blue-600 underline"
              >
                {order.trackingUrl}
              </a>
            </p>
          )}
        </div>
      ) : null}

      {canShowPendingPaymentActions ? (
        <div className="mt-4 flex flex-col gap-2 md:items-end">
          <p className="text-[11px] text-secondary">
            Sisa waktu pembayaran: {remainingPaymentLabel}
          </p>
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isCancelling || isPaying}
              onClick={() => {
                setConfirmAction("cancel");
              }}
              className="h-8 min-w-28 rounded-md border-primary-orange text-[11px] text-primary-orange hover:bg-primary-orange/10 hover:text-primary-orange"
            >
              {isCancelling ? <Loader2 className="size-4 animate-spin" /> : "Batalkan"}
            </Button>
            <Button
              type="button"
              disabled={isPaying || isCancelling}
              onClick={() => {
                void handlePayNow();
              }}
              className="h-8 min-w-28 rounded-md bg-primary-orange px-4 text-[11px] text-white hover:bg-primary-orange/90"
            >
              {isPaying ? <Loader2 className="size-4 animate-spin" /> : "Bayar Sekarang"}
            </Button>
          </div>
        </div>
      ) : null}

      {canReview ? (
        <div className="mt-4 flex flex-wrap justify-end gap-3">
          <Button
            asChild
            type="button"
            variant="outline"
            className="h-8 min-w-28 rounded-md border-primary-orange text-[11px] text-primary-orange hover:bg-primary-orange/10 hover:text-primary-orange"
          >
            <Link href={order.previewProductSlug ? `/product/${order.previewProductSlug}` : "/products"}>
              Beli Lagi
            </Link>
          </Button>
          <Button
            type="button"
            onClick={() => onOpenReview(order.orderNumber)}
            className="h-8 min-w-28 rounded-md bg-primary-orange px-4 text-[11px] text-white hover:bg-primary-orange/90"
          >
            Nilai
          </Button>
        </div>
      ) : null}

      <ConfirmActionDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction(null);
          }
        }}
        variant={confirmAction === "cancel" ? "error" : "warning"}
        title={confirmAction === "cancel" ? "Batalkan Pesanan?" : "Konfirmasi Diterima?"}
        description={
          confirmAction === "cancel"
            ? "Pesanan yang dibatalkan tidak bisa dipulihkan."
            : "Setelah dikonfirmasi, pesanan akan dianggap selesai."
        }
        cancelLabel="Kembali"
        confirmLabel={confirmAction === "cancel" ? "Ya, Batalkan" : "Ya, Konfirmasi"}
        confirmTone={confirmAction === "cancel" ? "danger" : "primary"}
        loading={isCancelling || isConfirming}
        onConfirm={() => {
          if (confirmAction === "cancel") {
            void handleCancelOrder();
          } else if (confirmAction === "received") {
            void handleConfirmReceived();
          }
          setConfirmAction(null);
        }}
        onCancel={() => {
          setConfirmAction(null);
        }}
      />
    </article>
  );
}

export default function OrdersListSection() {
  const [orders, setOrders] = useState<UserOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reviewOrderNumber, setReviewOrderNumber] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    variant: "success" | "error";
    title: string;
    description: string;
  } | null>(null);

  const loadOrders = useCallback(async (targetPage: number, append = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    const response = await fetch(`/api/account/orders?page=${targetPage}&pageSize=8`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    const data = (await response.json().catch(() => ({}))) as OrdersApiResponse;

    if (!response.ok) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Memuat Pesanan",
        description: data.error ?? "Daftar pesanan belum bisa ditampilkan.",
      });
      if (!append) {
        setOrders([]);
      }
      setIsLoading(false);
      setIsLoadingMore(false);
      return;
    }

    const nextOrders = data.orders ?? [];
    setOrders((current) => (append ? [...current, ...nextOrders] : nextOrders));
    setPage(data.pagination?.page ?? targetPage);
    setTotalPages(data.pagination?.totalPages ?? 1);
    setIsLoading(false);
    setIsLoadingMore(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOrders(1, false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadOrders]);

  const canLoadMore = page < totalPages;

  return (
    <>
      <section className="rounded-2xl bg-light-grey p-4 md:p-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-dark-grey/70">
            <Loader2 className="size-4 animate-spin" />
            Memuat daftar pesanan...
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-dark-grey">
            Belum ada pesanan. Yuk checkout produk pertamamu.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((item) => (
              <OrderCard
                key={item.orderNumber}
                order={item}
                onOrderChanged={async () => {
                  await loadOrders(1, false);
                }}
                onOpenReview={(orderNumber) => {
                  setReviewOrderNumber(orderNumber);
                }}
                onFeedback={(variant, title, description) => {
                  setFeedback({
                    open: true,
                    variant,
                    title,
                    description,
                  });
                }}
              />
            ))}
          </div>
        )}

        {!isLoading && canLoadMore ? (
          <div className="mt-4 flex justify-center">
            <Button
              type="button"
              variant="outline"
              disabled={isLoadingMore}
              className="h-9 rounded-md border-primary-orange text-xs text-primary-orange hover:bg-primary-orange/10 hover:text-primary-orange"
              onClick={() => {
                void loadOrders(page + 1, true);
              }}
            >
              {isLoadingMore ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Muat Pesanan Lainnya"
              )}
            </Button>
          </div>
        ) : null}
      </section>

      <OrderReviewDialog
        open={!!reviewOrderNumber}
        orderNumber={reviewOrderNumber}
        onOpenChange={(open) => {
          if (!open) {
            setReviewOrderNumber(null);
          }
        }}
        onSubmitted={async () => {
          await loadOrders(1, false);
        }}
        onFeedback={(variant, title, description) => {
          setFeedback({
            open: true,
            variant,
            title,
            description,
          });
        }}
      />

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
