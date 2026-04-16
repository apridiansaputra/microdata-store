import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import type { CheckoutAddress, CheckoutShippingQuote } from "./types";

type ShippingSectionProps = {
  selectedAddress: CheckoutAddress | null;
  checkoutCartItemIds: string[];
  onQuoteChange: (quote: CheckoutShippingQuote | null) => void;
};

export default function ShippingSection({
  selectedAddress,
  checkoutCartItemIds,
  onQuoteChange,
}: ShippingSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<CheckoutShippingQuote | null>(null);

  useEffect(() => {
    const shouldSkip = !selectedAddress || checkoutCartItemIds.length === 0;
    if (shouldSkip) {
      const timer = setTimeout(() => {
        setQuote(null);
        setError(null);
        setIsLoading(false);
        onQuoteChange(null);
      }, 0);
      return () => clearTimeout(timer);
    }

    const controller = new AbortController();

    void (async () => {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/checkout/shipping-quote", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          addressId: selectedAddress.id,
          cartItemIds: checkoutCartItemIds,
        }),
        signal: controller.signal,
      });

      const data = (await response.json().catch(() => ({}))) as {
        shipping?: CheckoutShippingQuote;
        error?: string;
      };

      if (!response.ok || !data.shipping) {
        if (!controller.signal.aborted) {
          setQuote(null);
          onQuoteChange(null);
          setError(data.error ?? "Ongkir belum dapat dihitung.");
          setIsLoading(false);
        }
        return;
      }

      if (!controller.signal.aborted) {
        setQuote(data.shipping);
        onQuoteChange(data.shipping);
        setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [selectedAddress, checkoutCartItemIds, onQuoteChange]);

  return (
    <section className="space-y-3">
      <hr className="mb-4" />
      <h2 className="text-sm font-medium text-gray-700">Pengiriman</h2>

      {!selectedAddress ? (
        <p className="text-xs text-gray-500">
          Pilih alamat pengiriman terlebih dahulu untuk melihat opsi ekspedisi.
        </p>
      ) : checkoutCartItemIds.length === 0 ? (
        <p className="text-xs text-gray-500">
          Pilih produk di keranjang agar ongkir dapat dihitung.
        </p>
      ) : isLoading ? (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Loader2 className="size-4 animate-spin" />
          Menghitung ongkir ekspedisi...
        </div>
      ) : error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : !quote ? (
        <p className="text-xs text-gray-500">Data ongkir belum tersedia.</p>
      ) : (
        <>
          <p className="text-xs text-gray-500">
            Tujuan: {selectedAddress.cityName}, {selectedAddress.provinceName}
          </p>
          <div className="flex justify-between text-sm">
            <span>
              {quote.courierName} - {quote.serviceName} ({quote.etdLabel})
            </span>
            <span className="font-semibold">Rp. {quote.cost.toLocaleString("id-ID")},00</span>
          </div>
        </>
      )}
    </section>
  );
}
