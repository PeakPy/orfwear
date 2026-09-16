type CollectionPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <p className="text-sm tracking-[0.3em] text-orf-accent uppercase">Collection</p>
      <h1 className="mt-3 text-4xl" style={{ fontFamily: "var(--font-display)" }}>
        {slug}
      </h1>
    </div>
  );
}
