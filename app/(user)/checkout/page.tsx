"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useCart } from "@/components/cart-components/cart-context";
import AddressSection from "./checkout-components/AddressSection";
import OrderSummary from "./checkout-components/OrderSummary";
import ShippingSection from "./checkout-components/ShippingSection";
import type { CheckoutAddress, CheckoutShippingQuote } from "./checkout-components/types";

function CheckoutPageContent() {
  const { items, selectedItems, refreshCart } = useCart();
  const searchParams = useSearchParams();
  const [selectedAddress, setSelectedAddress] = useState<CheckoutAddress | null>(
    null,
  );
  const [shippingQuote, setShippingQuote] = useState<CheckoutShippingQuote | null>(
    null,
  );

  const idsFromQuery = useMemo(
    () =>
      (searchParams.get("items") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [searchParams],
  );

  const hasQueryItems = idsFromQuery.length > 0;
  const hasSelectedItems = Object.values(selectedItems ?? {}).some(Boolean);

  const checkoutCartItemIds = useMemo(() => {
    if (hasQueryItems) {
      return items
        .filter((item) => idsFromQuery.includes(String(item.id)))
        .map((item) => item.id);
    }

    if (hasSelectedItems) {
      return items.filter((item) => selectedItems[item.id]).map((item) => item.id);
    }

    return [];
  }, [hasQueryItems, hasSelectedItems, idsFromQuery, items, selectedItems]);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  return (
    <div className="grid grid-cols-1 gap-12 pt-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-1">
        <AddressSection onAddressChange={setSelectedAddress} />
        <ShippingSection
          selectedAddress={selectedAddress}
          checkoutCartItemIds={checkoutCartItemIds}
          onQuoteChange={setShippingQuote}
        />
      </div>

      <div className="lg:col-span-2">
        <OrderSummary
          shippingCostOverride={shippingQuote?.cost ?? 0}
          selectedAddressId={selectedAddress?.id ?? null}
          shippingQuote={shippingQuote}
          checkoutCartItemIds={checkoutCartItemIds}
        />
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutPageContent />
    </Suspense>
  );
}
