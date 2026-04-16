import AccountPageLayout from "../AccountPageLayout";
import ProfileAddressSection from "../ProfileAddressSection";
import ProfileGeneralSection from "../ProfileGeneralSection";
import ProfilePasswordSection from "../ProfilePasswordSection";

export default function AccountProfilePage() {
  return (
    <div className="pb-16">
      <AccountPageLayout activeKey="profile">
        <ProfileGeneralSection />
        <ProfilePasswordSection />
        <ProfileAddressSection />
      </AccountPageLayout>
    </div>
  );
}
