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
import { getNegotiationBySlug } from "../../negotiation-data";

type NegotiationDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function NegotiationDetailPage({
  params,
}: NegotiationDetailPageProps) {
  const { slug } = await params;
  const negotiationRecord = getNegotiationBySlug(slug);

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

          {negotiationRecord ? (
            <NegotiationDetailSection record={negotiationRecord} />
          ) : (
            <section className="rounded-lg bg-light-grey p-6 md:p-8">
              <h2 className="text-base font-semibold text-secondary">
                Data negosiasi tidak ditemukan
              </h2>
              <p className="mt-2 text-xs text-dark-grey">
                Pengajuan dengan ID <span className="font-semibold">{slug}</span>{" "}
                tidak tersedia.
              </p>
            </section>
          )}
        </div>
      </AccountPageLayout>
    </div>
  );
}
