"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";

import Container from "@/components/admin-layout/container";
import Header from "@/components/admin-layout/header";
import OrderDetailPanel from "@/components/admin-layout/order-detail-pannel";
import { AuthFeedbackDialog } from "@/components/ui/auth-feedback-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PaymentFilterValue =
  | "ALL"
  | "PENDING"
  | "SETTLED"
  | "FAILED"
  | "EXPIRED"
  | "CANCELLED";
type ShippingFilterValue =
  | "ALL"
  | "WAITING_FULFILLMENT"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "DELIVERED";
type SortFilterValue = "newest" | "oldest";

type AdminOrderListItem = {
  id: string;
  orderNumber: string;
  placedAt: string;
  paymentStatus: string;
  paymentStatusLabel: string;
  shippingStatus: string;
  shippingStatusLabel: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  totalAmount: number;
};

type AdminOrdersListResponse = {
  items?: AdminOrderListItem[];
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    pageCount: number;
  };
  error?: string;
};

const SEEN_ORDER_NUMBERS_STORAGE_KEY = "mds_admin_seen_order_numbers_v1";

type BadgeTone = "green" | "yellow" | "blue" | "neutral" | "red";

const BADGE_TONE_CLASS: Record<BadgeTone, string> = {
  green: "bg-[#E7F4EC] text-[#4FA57D]",
  yellow: "bg-[#E8E5F6] text-[#7B75C5]",
  blue: "bg-[#E8E5F6] text-[#7B75C5]",
  red: "bg-[#F7E1D6] text-[#D37E55]",
  neutral: "bg-gray-100 text-gray-700",
};

function getPaymentBadgeTone(status: string): BadgeTone {
  switch (status) {
    case "SETTLED":
    case "CAPTURED":
    case "AUTHORIZED":
      return "green";
    case "PENDING":
    case "CHALLENGE":
      return "yellow";
    case "FAILED":
    case "CANCELLED":
    case "DENIED":
    case "CHARGEBACK":
    case "REFUNDED":
    case "PARTIAL_REFUNDED":
      return "neutral";
    case "EXPIRED":
      return "red";
    default:
      return "neutral";
  }
}

function getShippingBadgeTone(status: string): BadgeTone {
  switch (status) {
    case "WAITING_FULFILLMENT":
      return "yellow";
    case "READY_TO_SHIP":
      return "blue";
    case "SHIPPED":
    case "DELIVERED":
      return "green";
    case "CANCELLED":
      return "neutral";
    default:
      return "neutral";
  }
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: BadgeTone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] leading-none font-semibold ${BADGE_TONE_CLASS[tone]}`}
    >
      {label}
    </span>
  );
}

function collectNewIds(storageKey: string, ids: string[]) {
  if (typeof window === "undefined") return new Set<string>();

  const normalizedIds = ids.filter((value) => value.trim().length > 0);
  if (normalizedIds.length === 0) return new Set<string>();

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      window.localStorage.setItem(storageKey, JSON.stringify(normalizedIds));
      return new Set<string>();
    }

    const knownIds = new Set<string>(
      (JSON.parse(raw) as string[]).filter((value) => value.trim().length > 0),
    );
    const nextNewIds = normalizedIds.filter((value) => !knownIds.has(value));
    const mergedIds = Array.from(new Set([...knownIds, ...normalizedIds])).slice(-1200);

    window.localStorage.setItem(storageKey, JSON.stringify(mergedIds));
    return new Set(nextNewIds);
  } catch {
    return new Set<string>();
  }
}

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

export default function OrdersPage() {
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilterValue>("ALL");
  const [shippingFilter, setShippingFilter] = useState<ShippingFilterValue>("ALL");
  const [sortFilter, setSortFilter] = useState<SortFilterValue>("newest");
  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [newOrderNumbers, setNewOrderNumbers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    variant: "success" | "error";
    title: string;
    description: string;
  } | null>(null);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);

    const params = new URLSearchParams();
    if (paymentFilter !== "ALL") {
      params.set("paymentStatus", paymentFilter);
    }
    if (shippingFilter !== "ALL") {
      params.set("shippingStatus", shippingFilter);
    }
    params.set("sort", sortFilter);
    params.set("page", String(page));
    params.set("pageSize", "25");

    const response = await fetch(`/api/admin/orders?${params.toString()}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    const data = (await response.json().catch(() => ({}))) as AdminOrdersListResponse;

    if (!response.ok) {
      setOrders([]);
      setTotalOrders(0);
      setPageCount(1);
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Memuat Pesanan",
        description: data.error ?? "Data pesanan belum bisa ditampilkan.",
      });
      setIsLoading(false);
      return;
    }

    const nextOrders = data.items ?? [];
    setOrders(nextOrders);
    setNewOrderNumbers(
      collectNewIds(
        SEEN_ORDER_NUMBERS_STORAGE_KEY,
        nextOrders.map((item) => item.orderNumber),
      ),
    );
    setTotalOrders(data.meta?.total ?? 0);
    setPageCount(data.meta?.pageCount ?? 1);
    setIsLoading(false);
  }, [page, paymentFilter, shippingFilter, sortFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOrders();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadOrders]);

  const orderCountLabel = useMemo(
    () => `${totalOrders} pesanan`,
    [totalOrders],
  );

  return (
    <div className="flex h-screen flex-col">
      <Header title="Pesanan" />
      <Container
        className={`grid w-full flex-1 overflow-hidden transition-[grid-template-columns] duration-300 ease-out grid-cols-1 ${
          isDetailOpen ? "md:grid-cols-[minmax(0,1fr)_430px]" : "md:grid-cols-[minmax(0,1fr)_0px]"
        }`}
      >
        <div
          className={`min-w-0 w-full bg-white rounded-lg p-4 flex flex-col gap-5 overflow-y-auto transition-transform duration-300 ease-out ${
            isDetailOpen ? "hidden md:flex -translate-x-1" : "flex translate-x-0"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 py-2">
            <p className="text-xs text-dark-grey">{orderCountLabel}</p>
            <div className="flex flex-wrap justify-end gap-2">
              <Select
                value={paymentFilter}
                onValueChange={(value) => {
                  setPage(1);
                  setPaymentFilter(value as PaymentFilterValue);
                }}
              >
                <SelectTrigger className="w-48 text-xs">
                  <SelectValue placeholder="Status Pembayaran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="ALL">Semua Pembayaran</SelectItem>
                    <SelectItem value="SETTLED">Lunas</SelectItem>
                    <SelectItem value="PENDING">Menunggu Pembayaran</SelectItem>
                    <SelectItem value="FAILED">Gagal</SelectItem>
                    <SelectItem value="EXPIRED">Kedaluwarsa</SelectItem>
                    <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select
                value={shippingFilter}
                onValueChange={(value) => {
                  setPage(1);
                  setShippingFilter(value as ShippingFilterValue);
                }}
              >
                <SelectTrigger className="w-48 text-xs">
                  <SelectValue placeholder="Status Pengiriman" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="ALL">Semua Pengiriman</SelectItem>
                    <SelectItem value="WAITING_FULFILLMENT">Belum Diproses</SelectItem>
                    <SelectItem value="READY_TO_SHIP">Diproses</SelectItem>
                    <SelectItem value="SHIPPED">Dikirim</SelectItem>
                    <SelectItem value="DELIVERED">Selesai</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select
                value={sortFilter}
                onValueChange={(value) => {
                  setPage(1);
                  setSortFilter(value as SortFilterValue);
                }}
              >
                <SelectTrigger className="w-48 text-xs">
                  <SelectValue placeholder="Urutkan dari Tanggal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="newest">Tanggal Terbaru</SelectItem>
                    <SelectItem value="oldest">Tanggal Terlama</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Pesanan</TableHead>
                <TableHead>Tgl. Pesanan</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Total Belanja</TableHead>
                <TableHead>Status Pembayaran</TableHead>
                <TableHead>Status Pengiriman</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-20 text-center text-dark-grey/70">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Memuat pesanan...
                    </span>
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-20 text-center text-dark-grey/70">
                    Belum ada pesanan pada filter ini.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow
                    key={order.id}
                    className={
                      newOrderNumbers.has(order.orderNumber) &&
                      order.shippingStatus === "WAITING_FULFILLMENT"
                        ? "bg-primary-orange/10 hover:bg-primary-orange/15"
                        : undefined
                    }
                  >
                    <TableCell className="font-semibold">{order.orderNumber}</TableCell>
                    <TableCell>{formatDate(order.placedAt)}</TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-secondary">{order.customerName}</p>
                        <p className="text-[11px] text-dark-grey">{order.customerEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                    <TableCell>
                      <StatusBadge
                        label={order.paymentStatusLabel}
                        tone={getPaymentBadgeTone(order.paymentStatus)}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        label={order.shippingStatusLabel}
                        tone={getShippingBadgeTone(order.shippingStatus)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          setSelectedOrderNumber(order.orderNumber);
                          setIsDetailOpen(true);
                        }}
                        className="border-0 shadow-none hover:bg-white hover:text-primary-orange"
                      >
                        Detail
                        <ArrowUpRight className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {!isLoading && totalOrders > 0 ? (
            <div className="flex items-center justify-end gap-2 pt-2">
              <p className="mr-3 text-xs text-dark-grey">
                Halaman {page} dari {pageCount}
              </p>
              <Button
                type="button"
                variant="outline"
                size="xs"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Sebelumnya
              </Button>
              <Button
                type="button"
                variant="outline"
                size="xs"
                disabled={page >= pageCount}
                onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
              >
                Berikutnya
              </Button>
            </div>
          ) : null}
        </div>

        <div
          className={`min-w-0 w-full overflow-hidden transition-all duration-300 ease-out ${
            isDetailOpen
              ? "translate-x-0 opacity-100"
              : "pointer-events-none hidden translate-x-6 opacity-0 md:block"
          }`}
        >
          <OrderDetailPanel
            orderNumber={selectedOrderNumber}
            onClose={() => {
              setIsDetailOpen(false);
            }}
            onUpdated={async () => {
              await loadOrders();
            }}
          />
        </div>
      </Container>

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
    </div>
  );
}
