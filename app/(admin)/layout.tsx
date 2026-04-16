import { redirect } from "next/navigation";

import { AdminAuthProvider } from "@/components/auth/admin-auth-context";
import AdminSidebar from "@/components/admin-layout/sidebar";
import { getCurrentSessionUser, isAdminRole } from "@/lib/auth/server-auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await getCurrentSessionUser("admin");

  if (
    !sessionUser ||
    sessionUser.status !== "ACTIVE" ||
    !isAdminRole(sessionUser.role)
  ) {
    redirect("/admin/login");
  }

  return (
    <AdminAuthProvider initialUser={sessionUser}>
      <div className="h-screen overflow-hidden bg-light-grey">
        <AdminSidebar />
        <main className="h-screen overflow-y-auto md:ml-60">{children}</main>
      </div>
    </AdminAuthProvider>
  );
}
