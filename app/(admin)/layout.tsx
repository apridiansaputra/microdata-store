import AdminSidebar from "@/components/ui/admin/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr] bg-light-grey">
      <AdminSidebar />
      <main>{children}</main>
    </div>
  );
}