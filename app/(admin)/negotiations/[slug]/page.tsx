import NegotiationDetailClient from "./NegotiationDetailClient";

type NegotiationDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function DetailNegotiationPage({
  params,
}: NegotiationDetailPageProps) {
  const { slug } = await params;
  return <NegotiationDetailClient negotiationNumber={slug} />;
}
