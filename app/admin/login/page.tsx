import { redirect } from "next/navigation";

import { getCurrentSessionUser, isAdminRole } from "@/lib/auth/server-auth";

import AdminLoginForm from "./AdminLoginForm";

export default async function AdminLoginPage() {
  const sessionUser = await getCurrentSessionUser("admin");
  if (
    sessionUser &&
    sessionUser.status === "ACTIVE" &&
    isAdminRole(sessionUser.role)
  ) {
    redirect("/dashboard");
  }

  return <AdminLoginForm />;
}
