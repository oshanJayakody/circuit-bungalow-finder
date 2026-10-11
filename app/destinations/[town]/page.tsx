import DestinationList from "@/components/DestinationList";

export default async function DestinationPage({ params }: { params: Promise<{ town: string }> }) {
  const { town } = await params;
  return <DestinationList key={town} town={town} />;
}
