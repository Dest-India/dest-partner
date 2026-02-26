import CourtDetails from "@/components/site/turfs/court";

export default async function CourtPage({ params }) {
  const { slug } = await params;
  return <CourtDetails courtId={slug} />;
}