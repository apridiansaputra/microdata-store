"use client";

import OrderItem from "./OrderItem";
import OrderFooter from "./OrderFooter";
import { useCart } from "@/components/cart-components/cart-context";
import type { CheckoutShippingQuote } from "./types";

type OrderSummaryProps = {
  shippingCostOverride?: number;
  selectedAddressId: string | null;
  shippingQuote: CheckoutShippingQuote | null;
  checkoutCartItemIds: string[];
};

export default function OrderSummary({
  shippingCostOverride = 0,
  selectedAddressId,
  shippingQuote,
  checkoutCartItemIds,
}: OrderSummaryProps) {
  const { items } = useCart();
  const checkoutItems = items.filter((item) => checkoutCartItemIds.includes(String(item.id)));

  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const shippingCost = checkoutItems.length > 0 ? shippingCostOverride : 0;
  const totalPayment = subtotal + shippingCost;

  return (
    <div className="border border-dark-grey/10 rounded-xl p-6 flex flex-col ">
      <h2 className="text-sm font-semibold mb-6">Rincian Belanja</h2>

      {checkoutItems.length === 0 ? (
        <p className="text-sm text-muted-foreground flex-1">
          Keranjang kamu masih kosong.
        </p>
      ) : (
        <div className="flex-1">
          <div className="cart-scroll space-y-4 max-h-50 overflow-y-auto">
            {checkoutItems.map((item) => (
              <OrderItem
                key={item.id}
                name={item.name}
                price={item.price}
                quantity={item.quantity}
                image={item.image}
              />
            ))}
          </div>
        </div>
      )}

      <OrderFooter
        subtotal={subtotal}
        shippingCost={shippingCost}
        totalPayment={totalPayment}
        selectedAddressId={selectedAddressId}
        shippingQuote={shippingQuote}
        checkoutCartItemIds={checkoutCartItemIds}
        hasCheckoutItems={checkoutItems.length > 0}
      />
    </div>
  );
}
