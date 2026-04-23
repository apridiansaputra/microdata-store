import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getCurrentSessionUser } from "@/lib/auth/server-auth";

export default async function AccountLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const sessionUser = await getCurrentSessionUser("user");
  if (!sessionUser || sessionUser.status !== "ACTIVE") {
    redirect("/login");
  }

  return <section className="w-full">{children}</section>;
}
