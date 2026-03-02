"use client";

import OrderItem from "./OrderItem";
import OrderFooter from "./OrderFooter";
import { useCart } from "@/components/cart-components/cart-context";
import { useSearchParams } from "next/navigation";

export default function OrderSummary() {
  const { items, selectedItems } = useCart();
  const searchParams = useSearchParams();

  const idsFromQuery = (searchParams.get("items") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const hasQueryItems = idsFromQuery.length > 0;
  const hasSelectedItems = Object.values(selectedItems ?? {}).some(Boolean);

  const checkoutItems = hasQueryItems
    ? items.filter((item) => idsFromQuery.includes(String(item.id)))
    : hasSelectedItems
    ? items.filter((item) => selectedItems[item.id])
    : [];

  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const shippingCost = checkoutItems.length > 0 ? 35000 : 0;
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
      />
    </div>
  );
}
