"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";

import Container from "@/components/admin-layout/container";
import Header from "@/components/admin-layout/header";
import { AuthFeedbackDialog } from "@/components/ui/auth-feedback-dialog";
import { Button } from "@/components/ui/button";
import NegotiationStatusBadge from "@/components/ui/negotiation-status-badge";
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

type NegotiationStatus =
  | "OPEN"
  | "COUNTERED"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";
type SortFilterValue = "newest" | "oldest";
type StatusFilterValue = "ALL" | NegotiationStatus;

type AdminNegotiationItem = {
  negotiationNumber: string;
  submittedAt: string;
  status: NegotiationStatus;
  statusLabel: string;
  totalBaseAmount: number;
  resultTotalAmount: number;
  customerName: string;
  customerEmail: string;
  itemCount: number;
};

type AdminNegotiationsResponse = {
  items?: AdminNegotiationItem[];
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    pageCount: number;
  };
  error?: string;
};

const SEEN_NEGOTIATION_NUMBERS_STORAGE_KEY = "mds_admin_seen_negotiation_numbers_v1";

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

const STATUS_OPTIONS: Array<{ value: StatusFilterValue; label: string }> = [
  { value: "ALL", label: "Semua Status" },
  { value: "OPEN", label: "Menunggu Tanggapan" },
  { value: "COUNTERED", label: "Ditanggapi" },
  { value: "ACCEPTED", label: "Disetujui" },
  { value: "REJECTED", label: "Ditolak" },
  { value: "EXPIRED", label: "Kedaluwarsa" },
  { value: "CANCELLED", label: "Dibatalkan" },
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

export default function NegotiationsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("ALL");
  const [sortFilter, setSortFilter] = useState<SortFilterValue>("newest");
  const [items, setItems] = useState<AdminNegotiationItem[]>([]);
  const [newNegotiationNumbers, setNewNegotiationNumbers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    variant: "success" | "error";
    title: string;
    description: string;
  } | null>(null);

  const loadNegotiations = useCallback(async () => {
    setIsLoading(true);

    const params = new URLSearchParams({
      sort: sortFilter,
      page: String(page),
      pageSize: "25",
    });
    if (statusFilter !== "ALL") {
      params.set("status", statusFilter);
    }

    const response = await fetch(`/api/admin/negotiations?${params.toString()}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    const data = (await response.json().catch(() => ({}))) as AdminNegotiationsResponse;
    setIsLoading(false);

    if (!response.ok) {
      setItems([]);
      setTotal(0);
      setPageCount(1);
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Memuat Negosiasi",
        description: data.error ?? "Data negosiasi belum dapat ditampilkan.",
      });
      return;
    }

    const nextItems = data.items ?? [];
    setItems(nextItems);
    setNewNegotiationNumbers(
      collectNewIds(
        SEEN_NEGOTIATION_NUMBERS_STORAGE_KEY,
        nextItems.map((item) => item.negotiationNumber),
      ),
    );
    setTotal(data.meta?.total ?? 0);
    setPageCount(data.meta?.pageCount ?? 1);
  }, [page, sortFilter, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadNegotiations();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadNegotiations]);

  const totalLabel = useMemo(() => `${total} pengajuan`, [total]);

  return (
    <div className="flex h-screen flex-col">
      <Header title="Negosiasi" />
      <Container className="flex-1 overflow-hidden">
        <div className="min-w-0 h-full bg-white rounded-lg p-4 flex flex-col gap-5 overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 py-2">
            <p className="text-xs text-dark-grey">{totalLabel}</p>
            <div className="flex flex-wrap justify-end gap-2">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setPage(1);
                  setStatusFilter(value as StatusFilterValue);
                }}
              >
                <SelectTrigger className="w-52 text-xs">
                  <SelectValue placeholder="Status Negosiasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {STATUS_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
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
                <TableHead>ID Pengajuan</TableHead>
                <TableHead>Tgl. Pengajuan</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Total Awal</TableHead>
                <TableHead>Hasil Nego</TableHead>
                <TableHead>Status Negosiasi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-20 text-center text-dark-grey/70">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Memuat negosiasi...
                    </span>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-20 text-center text-dark-grey/70">
                    Belum ada negosiasi pada filter ini.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow
                    key={item.negotiationNumber}
                    className={
                      newNegotiationNumbers.has(item.negotiationNumber)
                        ? "bg-primary-orange/10 hover:bg-primary-orange/15"
                        : undefined
                    }
                  >
                    <TableCell className="font-semibold">#{item.negotiationNumber}</TableCell>
                    <TableCell>{formatDate(item.submittedAt)}</TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-secondary">{item.customerName}</p>
                        <p className="text-[11px] text-dark-grey">{item.customerEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(item.totalBaseAmount)}</TableCell>
                    <TableCell>{formatCurrency(item.resultTotalAmount)}</TableCell>
                    <TableCell>
                      <NegotiationStatusBadge status={item.status} label={item.statusLabel} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        asChild
                        variant="outline"
                        size="xs"
                        className="border-0 hover:bg-white hover:text-primary-orange cursor-pointer shadow-none"
                      >
                        <Link href={`/negotiations/${encodeURIComponent(item.negotiationNumber)}`}>
                          Proses
                          <ArrowUpRight className="size-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {!isLoading && total > 0 ? (
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
