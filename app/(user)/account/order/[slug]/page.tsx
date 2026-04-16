import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import AccountPageLayout from "../../AccountPageLayout";
import OrderDetailSection from "../../OrderDetailSection";

type OrderDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { slug } = await params;

  return (
    <div className="pb-16">
      <AccountPageLayout activeKey="orders">
        <div className="space-y-6">
          <Breadcrumb>
            <BreadcrumbList className="text-xs">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/account/order" className="text-dark-grey">
                    Pesanan Saya
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold text-secondary">
                  Detail Pesanan Saya
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <OrderDetailSection orderNumber={slug} />
        </div>
      </AccountPageLayout>
    </div>
  );
}
