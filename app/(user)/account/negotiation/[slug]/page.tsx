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
import NegotiationDetailSection from "../../NegotiationDetailSection";

type NegotiationDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function NegotiationDetailPage({
  params,
}: NegotiationDetailPageProps) {
  const { slug } = await params;

  return (
    <div className="pb-16">
      <AccountPageLayout activeKey="negotiations">
        <div className="space-y-6">
          <Breadcrumb>
            <BreadcrumbList className="text-xs">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/account/negotiations" className="text-dark-grey">
                    Negosiasi
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold text-secondary">
                  Detail Negosiasi
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <NegotiationDetailSection negotiationNumber={slug} />
        </div>
      </AccountPageLayout>
    </div>
  );
}
