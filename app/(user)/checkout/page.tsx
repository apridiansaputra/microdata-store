import AddressSection from "./checkout-components/AddressSection";
import OrderSummary from "./checkout-components/OrderSummary";
import ShippingSection from "./checkout-components/ShippingSection";

export default function CheckoutPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-6">
        <div className="lg:col-span-1 space-y-6">
          <AddressSection />
          <ShippingSection />
        </div>

        <div className="lg:col-span-2">
          <OrderSummary />
        </div>
      </div>
  );
}