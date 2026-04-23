"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, MapPin, Phone } from "lucide-react";

import Container from "@/components/admin-layout/container";
import Header from "@/components/admin-layout/header";
import { AuthFeedbackDialog } from "@/components/ui/auth-feedback-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NegotiationStatusBadge from "@/components/ui/negotiation-status-badge";

type NegotiationStatus =
  | "OPEN"
  | "COUNTERED"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

type AdminNegotiationItem = {
  id: string;
  productName: string;
  productImageUrl: string;
  quantity: number;
  baseUnitPrice: number;
  buyerOfferUnitPrice: number | null;
  adminCounterUnitPrice: number | null;
  finalUnitPrice: number | null;
};

type AdminNegotiationDetail = {
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
  canRespond: boolean;
  customer: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    address: string | null;
  };
  items: AdminNegotiationItem[];
};

type DetailResponse = {
  negotiation?: AdminNegotiationDetail;
  error?: string;
};

type ActionResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};

function formatCurrency(value: number) {
  return `Rp. ${new Intl.NumberFormat("id-ID").format(Math.max(0, value))},00`;
}

function parseInputValue(value: string): number | undefined {
  const onlyDigits = value.replace(/\D/g, "");
  if (!onlyDigits) return undefined;
  const parsed = Number(onlyDigits);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.max(0, Math.trunc(parsed));
}

function toInputValue(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  return new Intl.NumberFormat("id-ID").format(Math.max(0, Math.trunc(value)));
}

export default function NegotiationDetailClient({
  negotiationNumber,
}: {
  negotiationNumber: string;
}) {
  const router = useRouter();
  const [detail, setDetail] = useState<AdminNegotiationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingCounter, setIsSavingCounter] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [counterInputs, setCounterInputs] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{
    open: boolean;
    variant: "success" | "error";
    title: string;
    description: string;
  } | null>(null);

  const loadDetail = useCallback(async () => {
    setIsLoading(true);
    const response = await fetch(`/api/admin/negotiations/${encodeURIComponent(negotiationNumber)}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    const data = (await response.json().catch(() => ({}))) as DetailResponse;
    setIsLoading(false);

    if (!response.ok || !data.negotiation) {
      setDetail(null);
      setFeedback({
        open: true,
        variant: "error",
        title: "Data Negosiasi Tidak Ditemukan",
        description: data.error ?? "Negosiasi tidak tersedia atau tidak bisa diakses.",
      });
      return;
    }

    setDetail(data.negotiation);
    setCounterInputs(
      Object.fromEntries(
        data.negotiation.items.map((item) => [
          item.id,
          toInputValue(item.adminCounterUnitPrice ?? undefined),
        ]),
      ),
    );
  }, [negotiationNumber]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDetail();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDetail]);

  const previewCounterTotal = useMemo(() => {
    if (!detail) return 0;
    return detail.items.reduce((sum, item) => {
      const parsed = parseInputValue(counterInputs[item.id] ?? "");
      const unitPrice = typeof parsed === "number" ? parsed : item.baseUnitPrice;
      return sum + unitPrice * Math.max(1, item.quantity);
    }, 0);
  }, [counterInputs, detail]);
  const totalBaseAmount = useMemo(() => {
    if (!detail) return 0;
    return detail.items.reduce(
      (sum, item) => sum + item.baseUnitPrice * Math.max(1, item.quantity),
      0,
    );
  }, [detail]);
  const totalBuyerOfferAmount = useMemo(() => {
    if (!detail) return 0;
    return detail.items.reduce((sum, item) => {
      const unitPrice = item.buyerOfferUnitPrice ?? item.baseUnitPrice;
      return sum + unitPrice * Math.max(1, item.quantity);
    }, 0);
  }, [detail]);

  const updateCounterInput = (itemId: string, value: string) => {
    const nextValue = toInputValue(parseInputValue(value));
    setCounterInputs((current) => ({
      ...current,
      [itemId]: nextValue,
    }));
  };

  const submitAction = async (action: "COUNTER" | "ACCEPT" | "REJECT") => {
    if (!detail) return;

    if (action === "COUNTER") {
      setIsSavingCounter(true);
    }
    if (action === "ACCEPT") {
      setIsApproving(true);
    }
    if (action === "REJECT") {
      setIsRejecting(true);
    }

    const response = await fetch(
      `/api/admin/negotiations/${encodeURIComponent(detail.negotiationNumber)}/respond`,
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          offers:
            action === "COUNTER"
              ? detail.items.map((item) => ({
                  itemId: item.id,
                  unitPrice: parseInputValue(counterInputs[item.id] ?? ""),
                }))
              : [],
        }),
      },
    );
    const data = (await response.json().catch(() => ({}))) as ActionResponse;

    setIsSavingCounter(false);
    setIsApproving(false);
    setIsRejecting(false);

    if (!response.ok) {
      setFeedback({
        open: true,
        variant: "error",
        title: "Gagal Memproses Negosiasi",
        description: data.error ?? "Perubahan negosiasi belum berhasil disimpan.",
      });
      await loadDetail();
      return;
    }

    setFeedback({
      open: true,
      variant: "success",
      title: "Negosiasi Diperbarui",
      description: data.message ?? "Perubahan negosiasi berhasil disimpan.",
    });
    await loadDetail();
  };

  if (isLoading) {
    return (
      <div>
        <Header
          breadcrumbItems={[
            { label: "Negosiasi", href: "/negotiations" },
            { label: "Detail Negosiasi" },
          ]}
        />
        <Container>
          <section className="rounded-2xl bg-white p-5">
            <div className="flex items-center gap-2 text-xs text-dark-grey/70">
              <Loader2 className="size-4 animate-spin" />
              Memuat detail negosiasi...
            </div>
          </section>
        </Container>
      </div>
    );
  }

  if (!detail) {
    return (
      <>
        <div>
          <Header
            breadcrumbItems={[
              { label: "Negosiasi", href: "/negotiations" },
              { label: "Detail Negosiasi" },
            ]}
          />
          <Container>
            <section className="rounded-2xl bg-white p-5">
              <h2 className="text-sm font-semibold text-secondary">
                Data negosiasi tidak ditemukan
              </h2>
              <p className="mt-2 text-xs text-dark-grey">
                ID negosiasi <span className="font-semibold">{negotiationNumber}</span> tidak tersedia.
              </p>
              <Button
                type="button"
                className="mt-4 h-9 bg-primary-orange px-4 text-xs text-white hover:bg-primary-orange/90"
                onClick={() => router.push("/negotiations")}
              >
                Kembali ke daftar negosiasi
              </Button>
            </section>
          </Container>
        </div>
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

  return (
    <>
      <div>
        <Header
          breadcrumbItems={[
            { label: "Negosiasi", href: "/negotiations" },
            { label: `#${detail.negotiationNumber}` },
          ]}
        />

        <Container>
          <section className="rounded-2xl bg-white p-5">
            <div className="flex flex-col gap-4 border-b border-border-grey pb-5 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-secondary">{detail.customer.fullName}</p>
                <div className="flex items-center gap-2 text-xs text-dark-grey">
                  <Mail className="h-3 w-3" />
                  <span>{detail.customer.email}</span>
                </div>
                {detail.customer.address ? (
                  <div className="flex items-start gap-2 text-xs text-dark-grey">
                    <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>{detail.customer.address}</span>
                  </div>
                ) : null}
                {detail.customer.phone ? (
                  <div className="flex items-center gap-2 text-xs text-dark-grey">
                    <Phone className="h-3 w-3" />
                    <span>{detail.customer.phone}</span>
                  </div>
                ) : null}
              </div>

              <div className="text-right">
                <p className="text-xs text-dark-grey">Status Negosiasi</p>
                <div className="mt-1 inline-flex">
                  <NegotiationStatusBadge
                    status={detail.status}
                    label={detail.statusLabel}
                  />
                </div>
                <p className="mt-2 text-xs text-dark-grey">
                  ID: <span className="font-semibold">#{detail.negotiationNumber}</span>
                </p>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-4xl border-separate border-spacing-0 text-sm text-secondary">
                <thead>
                  <tr>
                    <th className="border-b border-border-grey py-3 text-left text-xs font-medium text-dark-grey">
                      Produk
                    </th>
                    <th className="border-b border-border-grey px-3 py-3 text-left text-xs font-medium text-dark-grey">
                      Harga Awal
                    </th>
                    <th className="border-b border-border-grey px-3 py-3 text-left text-xs font-medium text-dark-grey">
                      Tawaran Pembeli
                    </th>
                    <th className="border-b border-border-grey py-3 text-right text-xs font-medium text-dark-grey">
                      Tawaran Anda
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {detail.items.map((item) => (
                    <tr key={item.id}>
                      <td className="border-b border-border-grey py-3">
                        <p className="max-w-[420px] text-sm leading-6 font-medium text-secondary">
                          {item.productName}
                        </p>
                        <p className="text-xs text-dark-grey">x{item.quantity}</p>
                      </td>
                      <td className="border-b border-border-grey px-3 py-3 text-sm font-semibold">
                        {formatCurrency(item.baseUnitPrice)}
                      </td>
                      <td className="border-b border-border-grey px-3 py-3 text-sm font-semibold">
                        {typeof item.buyerOfferUnitPrice === "number"
                          ? formatCurrency(item.buyerOfferUnitPrice)
                          : "-"}
                      </td>
                      <td className="border-b border-border-grey py-3">
                        <div className="ml-auto w-full max-w-3xs">
                          <Input
                            value={counterInputs[item.id] ?? ""}
                            disabled={!detail.canRespond}
                            onChange={(event) => updateCounterInput(item.id, event.target.value)}
                            placeholder="Masukkan harga nego anda"
                            className="rounded-lg border-border-grey bg-white text-sm placeholder:text-xs placeholder:text-dark-grey disabled:cursor-not-allowed disabled:bg-gray-50"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[#FAFAFA]">
                    <td className="border-t-2 border-border-grey py-3 text-xs font-semibold text-secondary">
                      Total
                    </td>
                    <td className="border-t-2 border-border-grey px-3 py-3 text-sm font-semibold text-secondary">
                      {formatCurrency(totalBaseAmount)}
                    </td>
                    <td className="border-t-2 border-border-grey px-3 py-3 text-sm font-semibold text-secondary">
                      {formatCurrency(totalBuyerOfferAmount)}
                    </td>
                    <td className="border-t-2 border-border-grey py-3 text-right text-sm font-semibold text-secondary">
                      {formatCurrency(previewCounterTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-end gap-3">
              <Button
                type="button"
                disabled={!detail.canRespond || isRejecting || isSavingCounter || isApproving}
                variant="outline"
                onClick={() => {
                  void submitAction("REJECT");
                }}
                className="min-w-24 rounded-sm border-border-grey bg-white text-xs text-primary-orange hover:text-primary-orange cursor-pointer disabled:cursor-not-allowed"
              >
                {isRejecting ? <Loader2 className="size-4 animate-spin" /> : "Tolak"}
              </Button>
              <Button
                type="button"
                disabled={!detail.canRespond || isSavingCounter || isRejecting || isApproving}
                variant="outline"
                onClick={() => {
                  void submitAction("COUNTER");
                }}
                className="min-w-32 rounded-sm border-primary-orange bg-white text-xs text-primary-orange hover:bg-primary-orange/10 hover:text-primary-orange cursor-pointer disabled:cursor-not-allowed"
              >
                {isSavingCounter ? <Loader2 className="size-4 animate-spin" /> : "Kirim Counter"}
              </Button>
              <Button
                type="button"
                disabled={!detail.canRespond || isApproving || isRejecting || isSavingCounter}
                onClick={() => {
                  void submitAction("ACCEPT");
                }}
                className="min-w-24 rounded-sm bg-primary-orange text-xs font-semibold text-white hover:bg-primary-orange/90 cursor-pointer disabled:cursor-not-allowed"
              >
                {isApproving ? <Loader2 className="size-4 animate-spin" /> : "Setuju"}
              </Button>
            </div>
          </section>
        </Container>
      </div>

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
