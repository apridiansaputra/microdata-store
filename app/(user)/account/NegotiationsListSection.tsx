"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AccountSection from "./AccountSection";
import NegotiationStatusBadge from "./NegotiationStatusBadge";
import {
  NEGOTIATION_RECORDS,
  formatCurrencyIDR,
  type NegotiationStatus,
} from "./negotiation-data";
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

const STATUS_FILTER_ITEMS: Array<{ label: string; value: "all" | NegotiationStatus }> = [
  { label: "Semua Status", value: "all" },
  { label: "Ditanggapi", value: "Ditanggapi" },
  { label: "Disetujui", value: "Disetujui" },
  { label: "Ditolak", value: "Ditolak" },
];

function getDateValue(date: string) {
  const [day, month, year] = date.split("-").map(Number);
  return new Date(year, month - 1, day).getTime();
}

export default function NegotiationsListSection() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<"all" | NegotiationStatus>("all");
  const [sortFilter, setSortFilter] = useState<SortValue | undefined>(undefined);

  const displayedItems = useMemo(() => {
    let nextItems = [...NEGOTIATION_RECORDS];

    if (statusFilter !== "all") {
      nextItems = nextItems.filter((item) => item.status === statusFilter);
    }

    if (sortFilter === "newest") {
      nextItems.sort((a, b) => getDateValue(b.date) - getDateValue(a.date));
    }

    if (sortFilter === "oldest") {
      nextItems.sort((a, b) => getDateValue(a.date) - getDateValue(b.date));
    }

    return nextItems;
  }, [statusFilter, sortFilter]);

  return (
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
            onValueChange={(value) => setStatusFilter(value as "all" | NegotiationStatus)}
          >
            <SelectTrigger className=" justify-between border-primary-orange bg-transparent text-xs font-semibold text-primary-orange data-[placeholder]:text-primary-orange">
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

          <Select
            value={sortFilter}
            onValueChange={(value) => setSortFilter(value as SortValue)}
          >
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
      <div className="overflow-hidden rounded-md border border-dark-grey/20 bg-white mt-16">
        <Table className="min-w-[700px] border-collapse">
          <TableHeader className="[&_tr]:border-b [&_tr]:border-[#E2E8F0]">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-10 bg-transparent px-5 text-xs font-medium text-dark-grey">
                No Pengajuan
              </TableHead>
              <TableHead className="h-10 bg-transparent px-5 text-xs font-medium text-dark-grey">
                Tanggal
              </TableHead>
              <TableHead className="h-10 bg-transparent px-5 text-xs font-medium text-dark-grey">
                Total Belanja
              </TableHead>
              <TableHead className="h-10 bg-transparent px-5 text-xs font-medium text-dark-grey">
                Status Negosiasi
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {displayedItems.length === 0 ? (
              <TableRow className="border-[#E2E8F0]">
                <TableCell colSpan={4} className="px-5 py-4 text-sm text-dark-grey">
                  Belum ada pengajuan negosiasi.
                </TableCell>
              </TableRow>
            ) : (
              displayedItems.map((item) => (
                <TableRow
                  key={item.slug}
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(`/account/negotiation/${item.slug}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(`/account/negotiation/${item.slug}`);
                    }
                  }}
                  className="cursor-pointer border-[#E2E8F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-orange/30 hover:bg-[#F8FAFC]"
                >
                  <TableCell className="px-5 py-3 text-sm text-dark-grey">
                    {item.submissionNo}
                  </TableCell>
                  <TableCell className="px-5 py-3 text-sm text-dark-grey">
                    {item.date}
                  </TableCell>
                  <TableCell className="px-5 py-3 text-sm text-dark-grey">
                    {formatCurrencyIDR(item.totalAwal)}
                  </TableCell>
                  <TableCell className="px-5 py-3">
                    <NegotiationStatusBadge status={item.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AccountSection>
  );
}
