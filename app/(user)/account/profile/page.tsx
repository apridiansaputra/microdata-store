import { Button } from "@/components/ui/button";
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

        <div>
          <Button className="rounded-md bg-primary-orange px-5 text-sm text-white hover:bg-primary-orange/90">
            Simpan Perubahan
          </Button>
        </div>
      </AccountPageLayout>
    </div>
  );
}
