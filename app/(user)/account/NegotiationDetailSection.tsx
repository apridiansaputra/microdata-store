"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import AccountSection from "./AccountSection";
import NegotiationStatusBadge, {
  type NegotiationStatus,
} from "./NegotiationStatusBadge";
import { AuthFeedbackDialog } from "@/components/ui/auth-feedback-dialog";
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

type NegotiationDetailItem = {
  id: string;
  productName: string;
  productImageUrl: string;
  quantity: number;
  baseUnitPrice: number;
  buyerOfferUnitPrice: number | null;
  adminCounterUnitPrice: number | null;
  finalUnitPrice: number | null;
};

type NegotiationDetail = {
  id: string;
  negotiationNumber: string;
  submissionNo: string;
  submittedAt: string;
  respondedAt: string | null;
  closedAt: string | null;
  status: NegotiationStatus;
  statusLabel: string;
  requestedTotalAmount: number;
  counterTotalAmount: number | null;
  finalTotalAmount: number | null;
  totalBaseAmount: number;
  resultTotalAmount: number;
  notes: string | null;
  canSubmitOffer: boolean;
  canCheckout: boolean;
  finalOrderId: string | null;
  items: NegotiationDetailItem[];
};

type NegotiationDetailResponse = {
  negotiation?: NegotiationDetail;
  error?: string;
};

type GenericActionResponse = {
  success?: boolean;
  message?: string;
  paymentUrl?: string | null;
  orderNumber?: string | null;
  error?: string;
};

function formatCurrency(value: number) {
  return `Rp. ${new Intl.NumberFormat("id-ID").format(Math.max(0, value))},00`;
}

function toInputValue(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  return new Intl.NumberFormat("id-ID").format(Math.max(0, Math.trunc(value)));
}

function parseInputValue(value: string): number | undefined {
  const onlyDigits = value.replace(/\D/g, "");
  if (!onlyDigits) return undefined;
  const parsed = Number(onlyDigits);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.max(0, Math.trunc(parsed));
}

function NegotiationActionPanel({
  status,
  statusLabel,
  hideStatus,
  offerButtonLabel,
  canSubmitOffer,
  canCheckout,
  isSubmittingOffer,
  isCheckingOut,
  onSubmitOffer,
  onCheckout,
}: {
  status: NegotiationStatus;
  statusLabel: string;
  hideStatus: boolean;
  offerButtonLabel: string;
  canSubmitOffer: boolean;
  canCheckout: boolean;
  isSubmittingOffer: boolean;
  isCheckingOut: boolean;
  onSubmitOffer: () => void;
  onCheckout: () => void;
}) {
  const canShowOfferButton = canSubmitOffer && status !== "ACCEPTED";

  return (
    <div className="flex flex-col items-start gap-3 md:items-end">
      {!hideStatus ? (
        <div className="flex items-center gap-2 text-xs text-secondary">
          <span>Status Negosiasi</span>
          <NegotiationStatusBadge status={status} label={statusLabel} />
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3">
        {canShowOfferButton ? (
          <Button
            type="button"
            disabled={isSubmittingOffer || isCheckingOut}
            onClick={onSubmitOffer}
            variant="outline"
            className="h-9 border-primary-orange/50 bg-transparent px-4 text-xs font-semibold text-primary-orange hover:bg-primary-orange/10 hover:text-primary-orange disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmittingOffer ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Mengirim...
              </span>
            ) : (
              offerButtonLabel
            )}
          </Button>
        ) : null}

        {canCheckout ? (
          <Button
            type="button"
            disabled={isCheckingOut || isSubmittingOffer}
            onClick={onCheckout}
            className="h-9 bg-primary-orange px-4 text-xs font-semibold text-white hover:bg-primary-orange/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCheckingOut ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Menyiapkan...
              </span>
            ) : (
              "Setujui & Checkout"
            )}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default function NegotiationDetailSection({
  negotiationNumber,
}: {
  negotiationNumber: string;
}) {
  const router = useRouter();
  const [record, setRecord] = useState<NegotiationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [offerInputs, setOfferInputs] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{
    open: boolean;
    variant: "success" | "error";
    title: string;
    description: string;
  } | null>(null);

  const loadDetail = useCallback(async () => {
    setIsLoading(true);
    const response = await fetch(
      `/api/account/negotiations/${encodeURIComponent(negotiationNumber)}`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      },
    );
    const data = (await response.json().catch(() => ({}))) as NegotiationDetailResponse;

    if (!response.ok || !data.negotiation) {
      setRecord(null);
      setIsLoading(false);
      setFeedback({
        open: true,
        variant: "error",
        title: "Negosiasi Tidak Ditemukan",
        description: data.error ?? "Data negosiasi tidak tersedia.",
      });
      return;
    }

    setRecord(data.negotiation);
    setOfferInputs(
      Object.fromEntries(
        data.negotiation.items.map((item) => [
          item.id,
          toInputValue(item.buyerOfferUnitPrice ?? undefined),
        ]),
      ),
    );
    setIsLoading(false);
  }, [negotiationNumber]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDetail();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDetail]);

  const hasStoreResponse = useMemo(
    () =>
      record?.items.some(
        (item) => typeof item.adminCounterUnitPrice === "number" || typeof item.finalUnitPrice === "number",
      ) ?? false,
    [record?.items],
  );
  const isInitialNegotiationInputState = useMemo(() => {
    if (!record || record.status !== "OPEN") return false;
    const hasBuyerOffer = record.items.some(
      (item) => typeof item.buyerOfferUnitPrice === "number",
    );
    const hasAdminResponse = record.items.some(
      (item) =>
        typeof item.adminCounterUnitPrice === "number" ||
        typeof item.finalUnitPrice === "number",
    );
    return !hasBuyerOffer && !hasAdminResponse;
  }, [record]);
  const totalBaseAmount = useMemo(() => {
    if (!record) return 0;
    return record.items.reduce(
      (sum, item) => sum + item.baseUnitPrice * Math.max(1, item.quantity),
      0,
    );
  }, [record]);
  const totalBuyerInputAmount = useMemo(() => {
    if (!record) return 0;
    return record.items.reduce((sum, item) => {
      const parsed = parseInputValue(offerInputs[item.id] ?? "");
      const unitPrice = typeof parsed === "number" ? parsed : item.baseUnitPrice;
      return sum + unitPrice * Math.max(1, item.quantity);
    }, 0);
  }, [offerInputs, record]);
  const totalStoreOfferAmount = useMemo(() => {
    if (!record) return null;
    if (!hasStoreResponse) return null;

    return record.items.reduce((sum, item) => {
      const storeUnitPrice = item.finalUnitPrice ?? item.adminCounterUnitPrice ?? item.baseUnitPrice;
      return sum + storeUnitPrice * Math.max(1, item.quantity);
    }, 0);
  }, [hasStoreResponse, record]);

  const handleOfferChange = (lineId: string, value: string) => {
    const nextValue = toInputValue(parseInputValue(value));
    setOfferInputs((prev) => ({
      ...prev,
      [lineId]: nextValue,
    }));
  };

  const submitOffer = async () => {
    if (!record) return;
    if (!record.canSubmitOffer || record.status === "ACCEPTED") return;

    setIsSubmittingOffer(true);
    const response = await fetch(
      `/api/account/negotiations/${encodeURIComponent(record.negotiationNumber)}/offer`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          offers: record.items.map((item) => ({
            itemId: item.id,
            unitPrice: parseInputValue(offerInputs[item.id] ?? ""),
          })),
        }),
      },
    );
    const data = (await response.json().catch(() => ({}))) as GenericActionResponse;
    setIsSubmittingOffer(false);

    if (!response.ok) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Tawaran Gagal Dikirim",
        description: data.error ?? "Coba lagi beberapa saat.",
      });
      return;
    }

    setFeedback({
      open: true,
      variant: "success",
      title: "Tawaran Berhasil Dikirim",
      description: data.message ?? "Penawaran baru sudah dikirim ke admin.",
    });
    await loadDetail();
  };

  const checkoutNegotiation = async () => {
    if (!record || !record.canCheckout) return;

    setIsCheckingOut(true);
    const response = await fetch(
      `/api/account/negotiations/${encodeURIComponent(record.negotiationNumber)}/checkout`,
      {
        method: "POST",
        credentials: "include",
      },
    );
    const data = (await response.json().catch(() => ({}))) as GenericActionResponse;
    setIsCheckingOut(false);

    if (!response.ok) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Checkout Gagal",
        description: data.error ?? "Negosiasi belum dapat dilanjutkan ke pembayaran.",
      });
      await loadDetail();
      return;
    }

    if (data.paymentUrl) {
      window.location.href = data.paymentUrl;
      return;
    }

    if (data.orderNumber) {
      router.push(`/account/order/${encodeURIComponent(data.orderNumber)}`);
      return;
    }

    router.push("/account/order");
  };

  if (isLoading) {
    return (
      <section className="rounded-lg bg-light-grey p-6 md:p-8">
        <div className="flex items-center gap-2 text-xs text-dark-grey/70">
          <Loader2 className="size-4 animate-spin" />
          Memuat detail negosiasi...
        </div>
      </section>
    );
  }

  if (!record) {
    return (
      <>
        <section className="rounded-lg bg-light-grey p-6 md:p-8">
          <h2 className="text-base font-semibold text-secondary">Data negosiasi tidak ditemukan</h2>
          <p className="mt-2 text-xs text-dark-grey">
            ID negosiasi <span className="font-semibold">{negotiationNumber}</span> tidak tersedia.
          </p>
          <Button
            type="button"
            className="mt-4 h-9 bg-primary-orange px-4 text-xs font-semibold text-white hover:bg-primary-orange/90"
            onClick={() => {
              router.push("/account/negotiations");
            }}
          >
            Kembali ke Negosiasi
          </Button>
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
        action={
          <NegotiationActionPanel
            status={record.status}
            statusLabel={record.statusLabel}
            hideStatus={isInitialNegotiationInputState}
            offerButtonLabel={
              isInitialNegotiationInputState ? "Ajukan Penawaran" : "Ajukan Tawaran Baru"
            }
            canSubmitOffer={record.canSubmitOffer}
            canCheckout={record.canCheckout}
            isSubmittingOffer={isSubmittingOffer}
            isCheckingOut={isCheckingOut}
            onSubmitOffer={() => {
              void submitOffer();
            }}
            onCheckout={() => {
              void checkoutNegotiation();
            }}
          />
        }
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
              {record.items.map((item) => (
                <TableRow key={item.id} className="border-[#E2E8F0]">
                  <TableCell className="whitespace-normal px-4 py-2.5 align-top text-sm text-secondary">
                    <p className="max-w-full break-words leading-5 whitespace-normal">
                      {item.productName}
                    </p>
                    <p className="mt-1 text-xs text-dark-grey">x{item.quantity}</p>
                  </TableCell>

                  <TableCell className="px-4 py-2.5 align-middle text-sm font-semibold text-secondary">
                    {formatCurrency(item.baseUnitPrice)}
                  </TableCell>

                  <TableCell className="px-4 py-2.5 align-middle">
                    <Input
                      type="tel"
                      inputMode="numeric"
                      value={offerInputs[item.id] ?? ""}
                      onChange={(event) => handleOfferChange(item.id, event.target.value)}
                      disabled={!record.canSubmitOffer || record.status === "ACCEPTED"}
                      placeholder="Masukkan nominal negosiasi"
                      className="h-9 border-[#E4E7EC] bg-transparent text-sm text-dark-grey placeholder:text-xs placeholder:text-[#98A2B3] focus-visible:ring-primary-orange/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                    />
                  </TableCell>

                  <TableCell className="px-4 py-2.5 text-right text-sm font-semibold text-secondary">
                    {hasStoreResponse &&
                    (typeof item.finalUnitPrice === "number" ||
                      typeof item.adminCounterUnitPrice === "number")
                      ? formatCurrency(item.finalUnitPrice ?? item.adminCounterUnitPrice ?? 0)
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}

              <TableRow className="border-t-2 border-[#D0D5DD] bg-[#FAFAFA]">
                <TableCell className="px-4 py-3 text-xs font-semibold text-secondary">
                  Total
                </TableCell>
                <TableCell className="px-4 py-3 text-sm font-semibold text-secondary">
                  {formatCurrency(totalBaseAmount)}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm font-semibold text-secondary">
                  {formatCurrency(totalBuyerInputAmount)}
                </TableCell>
                <TableCell className="px-4 py-3 text-right text-sm font-semibold text-secondary">
                  {typeof totalStoreOfferAmount === "number"
                    ? formatCurrency(totalStoreOfferAmount)
                    : "-"}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </AccountSection>

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
