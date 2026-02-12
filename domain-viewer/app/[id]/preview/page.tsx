import ClientPage from "../ClientPage";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PreviewPage({ params }: Props) {
  const resolvedParams = await params;
  return <ClientPage params={resolvedParams} hideUI={true} />;
}
