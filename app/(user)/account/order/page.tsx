import AccountPageLayout from "../AccountPageLayout";
import OrdersListSection from "../OrdersListSection";

export default function OrdersPage() {
  return (
    <div className="pb-16">
      <AccountPageLayout activeKey="orders">
        <OrdersListSection />
      </AccountPageLayout>
    </div>
  );
}
