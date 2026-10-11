import DestinationList from "@/components/DestinationList";

export default async function DestinationPage({ params }: { params: Promise<{ town: string }> }) {
  const { town } = await params;
  // The town slug arrives URL-encoded (e.g. "Nuwara%20Eliya"); decode it
  // before matching against town/district names.
  let name = town;
  try {
    name = decodeURIComponent(town);
  } catch {
    /* keep the raw slug if it isn't valid encoding */
  }
  return <DestinationList key={name} town={name} />;
}
