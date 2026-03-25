"use client";

import { useState } from "react";
import AccountSection from "./AccountSection";
import NegotiationStatusBadge from "./NegotiationStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrencyIDR, type NegotiationRecord } from "./negotiation-data";

type NegotiationDetailSectionProps = {
  record: NegotiationRecord;
};

function NegotiationActionPanel({ status }: { status: NegotiationRecord["status"] }) {
  const showNewOfferButton = status !== "Disetujui";
  const showCheckoutButton =
    status === "Disetujui" || status === "Ditanggapi";

  return (
    <div className="flex flex-col items-start gap-3 md:items-end">
      <div className="flex items-center gap-2 text-xs text-secondary">
        <span>Status Negosiasi</span>
        <NegotiationStatusBadge status={status} />
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        {showNewOfferButton ? (
          <Button
            variant="outline"
            className="h-9 border-primary-orange/50 bg-transparent px-4 text-xs font-semibold text-primary-orange hover:bg-primary-orange/10 hover:text-primary-orange"
          >
            Ajukan Tawaran Baru
          </Button>
        ) : null}

        {showCheckoutButton ? (
          <Button className="h-9 bg-primary-orange px-4 text-xs font-semibold text-white hover:bg-primary-orange/90">
            Setujui & Checkout
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default function NegotiationDetailSection({
  record,
}: NegotiationDetailSectionProps) {
  const [offerInputs, setOfferInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(record.lines.map((line) => [line.id, ""]))
  );

  const hasStoreResponse = record.status === "Ditanggapi" || record.status === "Disetujui";

  const handleOfferChange = (lineId: string, value: string) => {
    const numericOnly = value.replace(/\D/g, "");
    setOfferInputs((prev) => ({
      ...prev,
      [lineId]: numericOnly
        ? new Intl.NumberFormat("id-ID").format(Number(numericOnly))
        : "",
    }));
  };

  return (
    <AccountSection
      title="Negosiasi"
      description={
        <>
          ID Pengajuan:{" "}
          <span className="font-semibold text-secondary">{record.submissionNo}</span>
        </>
      }
      className="rounded-lg"
      titleClassName="text-base font-semibold leading-tight text-secondary"
      descriptionClassName="font-medium leading-tight text-[#64748B]"
      action={<NegotiationActionPanel status={record.status} />}
    >
      <p className="text-xs text-dark-grey">
        *Silakan masukkan harga penawaran pada produk yang diinginkan. Biarkan
        kosong jika ingin menggunakan harga normal.
      </p>

      <div className="mt-8 overflow-hidden rounded-md border border-[#E2E8F0] bg-white">
        <Table className="min-w-[860px] table-fixed border-collapse">
          <TableHeader className="[&_tr]:border-b [&_tr]:border-[#E2E8F0]">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-9 w-[40%] bg-transparent px-4 text-xs font-medium text-[#64748B]">
                Produk
              </TableHead>
              <TableHead className="h-9 w-[18%] bg-transparent px-4 text-xs font-medium text-[#64748B]">
                Harga Awal
              </TableHead>
              <TableHead className="h-9 w-[22%] bg-transparent px-4 text-xs font-medium text-[#64748B]">
                Pengajuan Harga Anda
              </TableHead>
              <TableHead className="h-9 w-[20%] bg-transparent px-4 text-xs font-medium text-[#64748B]">
                Penawaran Dari Toko
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {record.lines.map((line) => (
              <TableRow key={line.id} className="border-[#E2E8F0]">
                <TableCell className="whitespace-normal px-4 py-2.5 align-top text-sm text-secondary">
                  <p className="max-w-full break-words leading-5 whitespace-normal">
                    {line.productName}
                  </p>
                  <p className="mt-1 text-xs text-dark-grey">x{line.quantity}</p>
                </TableCell>

                <TableCell className="px-4 py-2.5 align-middle text-sm font-semibold text-secondary">
                  {formatCurrencyIDR(line.basePrice)}
                </TableCell>

                <TableCell className="px-4 py-2.5 align-middle">
                  <Input
                    value={offerInputs[line.id] ?? ""}
                    onChange={(event) => handleOfferChange(line.id, event.target.value)}
                    placeholder="Masukkan nominal negosiasi"
                    className="h-9 border-[#E4E7EC] bg-transparent text-sm text-dark-grey placeholder:text-xs placeholder:text-[#98A2B3] focus-visible:ring-primary-orange/10"
                  />
                </TableCell>

                <TableCell className="px-4 py-2.5 text-right text-sm font-semibold text-secondary">
                  {hasStoreResponse && line.storeOffer
                    ? formatCurrencyIDR(line.storeOffer)
                    : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-5 border-t border-[#D0D5DD] pt-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm font-semibold text-secondary">
            <span>Total Awal</span>
            <span>{formatCurrencyIDR(record.totalAwal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm font-semibold text-secondary">
            <span>Hasil Nego</span>
            <span>{formatCurrencyIDR(record.hasilNego)}</span>
          </div>
        </div>
      </div>
    </AccountSection>
  );
}
