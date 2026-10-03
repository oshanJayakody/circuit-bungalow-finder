import BungalowDetails from "@/components/BungalowDetails";

export default async function BungalowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BungalowDetails key={id} bungalowId={id} />;
}
