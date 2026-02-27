import AdminSidebar from "@/components/admin-layout/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-light-grey flex-col md:flex-row min-h-screen">
      <AdminSidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}