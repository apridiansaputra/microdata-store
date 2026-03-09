import type { ReactNode } from "react";
import AccountSidebar from "./AccountSidebar";
import type { AccountNavKey } from "./account-nav";

type AccountPageLayoutProps = {
  activeKey: AccountNavKey;
  children: ReactNode;
};

export default function AccountPageLayout({
  activeKey,
  children,
}: AccountPageLayoutProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
      <AccountSidebar activeKey={activeKey} />
      <div className="space-y-6">{children}</div>
    </div>
  );
}
