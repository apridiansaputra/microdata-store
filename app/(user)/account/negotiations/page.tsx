import AccountPageLayout from "../AccountPageLayout";
import NegotiationsListSection from "../NegotiationsListSection";

export default function NegotiationsPage() {
  return (
    <div className="pb-16">
      <AccountPageLayout activeKey="negotiations">
        <NegotiationsListSection />
      </AccountPageLayout>
    </div>
  );
}
