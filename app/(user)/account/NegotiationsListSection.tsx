"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import AccountSection from "./AccountSection";
import NegotiationStatusBadge, {
  type NegotiationStatus,
} from "./NegotiationStatusBadge";
import { AuthFeedbackDialog } from "@/components/ui/auth-feedback-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
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

type SortValue = "newest" | "oldest";
type StatusFilterValue = "ALL" | NegotiationStatus;

type UserNegotiationListItem = {
  negotiationNumber: string;
  submittedAt: string;
  status: NegotiationStatus;
  statusLabel: string;
  totalBaseAmount: number;
  resultTotalAmount: number;
  itemCount: number;
};

type UserNegotiationListResponse = {
  items?: UserNegotiationListItem[];
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    pageCount: number;
  };
  error?: string;
};

const STATUS_FILTER_ITEMS: Array<{ label: string; value: StatusFilterValue }> = [
  { label: "Semua Status", value: "ALL" },
  { label: "Menunggu Tanggapan", value: "OPEN" },
  { label: "Ditanggapi", value: "COUNTERED" },
  { label: "Disetujui", value: "ACCEPTED" },
  { label: "Ditolak", value: "REJECTED" },
];

function formatDate(value: string) {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

function formatCurrency(value: number) {
  return `Rp. ${new Intl.NumberFormat("id-ID").format(Math.max(0, value))},00`;
}

export default function NegotiationsListSection() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("ALL");
  const [sortFilter, setSortFilter] = useState<SortValue>("newest");
  const [items, setItems] = useState<UserNegotiationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    variant: "success" | "error";
    title: string;
    description: string;
  } | null>(null);

  const loadItems = useCallback(
    async (targetPage: number, append: boolean) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const params = new URLSearchParams({
        sort: sortFilter,
        page: String(targetPage),
        pageSize: "10",
      });
      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }

      const response = await fetch(`/api/account/negotiations?${params.toString()}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const data = (await response.json().catch(() => ({}))) as UserNegotiationListResponse;

      if (!response.ok) {
        if (!append) {
          setItems([]);
        }
        setIsLoading(false);
        setIsLoadingMore(false);
        setFeedback({
          open: true,
          variant: "error",
          title: "Gagal Memuat Negosiasi",
          description: data.error ?? "Data negosiasi belum dapat ditampilkan.",
        });
        return;
      }

      const nextItems = data.items ?? [];
      setItems((current) => (append ? [...current, ...nextItems] : nextItems));
      setPage(data.meta?.page ?? targetPage);
      setPageCount(data.meta?.pageCount ?? 1);
      setTotal(data.meta?.total ?? 0);
      setIsLoading(false);
      setIsLoadingMore(false);
    },
    [sortFilter, statusFilter],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadItems(1, false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadItems]);

  const canLoadMore = page < pageCount;
  const totalLabel = useMemo(() => `${total} pengajuan`, [total]);

  return (
    <>
      <AccountSection
        title="Negosiasi"
        description="Daftar Pengajuan Negosiasi"
        className="rounded-xl p-6 md:p-8"
        titleClassName="text-base font-semibold leading-tight text-secondary"
        descriptionClassName="font-medium leading-tight text-[#64748B]"
        action={
          <div className="flex flex-wrap justify-end gap-3">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilterValue)}
            >
              <SelectTrigger className="justify-between border-primary-orange bg-transparent text-xs font-semibold text-primary-orange data-[placeholder]:text-primary-orange">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent align="end" className="bg-white">
                {STATUS_FILTER_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortFilter} onValueChange={(value) => setSortFilter(value as SortValue)}>
              <SelectTrigger className="justify-between border-primary-orange bg-transparent text-xs font-semibold text-primary-orange data-[placeholder]:text-primary-orange">
                <SelectValue placeholder="Urutkan dari Tanggal" />
              </SelectTrigger>
              <SelectContent align="end" className="bg-white">
                <SelectItem value="newest">Tanggal Terbaru</SelectItem>
                <SelectItem value="oldest">Tanggal Terlama</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      >
        <p className="mt-10 text-xs text-dark-grey">{totalLabel}</p>
        <div className="mt-2 overflow-hidden rounded-md border border-dark-grey/20 bg-white">
          <Table className="min-w-[720px] border-collapse">
            <TableHeader className="[&_tr]:border-b [&_tr]:border-[#E2E8F0]">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-10 bg-transparent px-5 text-xs font-medium text-dark-grey">
                  No Pengajuan
                </TableHead>
                <TableHead className="h-10 bg-transparent px-5 text-xs font-medium text-dark-grey">
                  Tanggal
                </TableHead>
                <TableHead className="h-10 bg-transparent px-5 text-xs font-medium text-dark-grey">
                  Total Awal
                </TableHead>
                <TableHead className="h-10 bg-transparent px-5 text-xs font-medium text-dark-grey">
                  Hasil Nego
                </TableHead>
                <TableHead className="h-10 bg-transparent px-5 text-xs font-medium text-dark-grey">
                  Status Negosiasi
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow className="border-[#E2E8F0]">
                  <TableCell colSpan={5} className="h-20 px-5 text-center text-sm text-dark-grey">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Memuat daftar negosiasi...
                    </span>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow className="border-[#E2E8F0]">
                  <TableCell colSpan={5} className="h-20 px-5 text-center text-sm text-dark-grey">
                    Belum ada pengajuan negosiasi.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow
                    key={item.negotiationNumber}
                    role="link"
                    tabIndex={0}
                    onClick={() =>
                      router.push(
                        `/account/negotiation/${encodeURIComponent(item.negotiationNumber)}`,
                      )
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(
                          `/account/negotiation/${encodeURIComponent(item.negotiationNumber)}`,
                        );
                      }
                    }}
                    className="cursor-pointer border-[#E2E8F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-orange/30 hover:bg-[#F8FAFC]"
                  >
                    <TableCell className="px-5 py-3 text-sm font-semibold text-secondary">
                      #{item.negotiationNumber}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-sm text-dark-grey">
                      {formatDate(item.submittedAt)}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-sm text-dark-grey">
                      {formatCurrency(item.totalBaseAmount)}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-sm text-dark-grey">
                      {formatCurrency(item.resultTotalAmount)}
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <NegotiationStatusBadge status={item.status} label={item.statusLabel} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!isLoading && canLoadMore ? (
          <div className="mt-4 flex justify-center">
            <Button
              type="button"
              variant="outline"
              disabled={isLoadingMore}
              className="h-9 rounded-md border-primary-orange text-xs text-primary-orange hover:bg-primary-orange/10 hover:text-primary-orange"
              onClick={() => {
                void loadItems(page + 1, true);
              }}
            >
              {isLoadingMore ? <Loader2 className="size-4 animate-spin" /> : "Muat Lainnya"}
            </Button>
          </div>
        ) : null}
      </AccountSection>

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
