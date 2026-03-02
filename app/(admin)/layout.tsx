import AdminSidebar from "@/components/admin-layout/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen overflow-hidden bg-light-grey">
      <AdminSidebar />
      <main className="h-screen overflow-y-auto md:ml-60">{children}</main>
    </div>
  );
}
