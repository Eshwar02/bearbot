import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shared AlphaSight Response',
  description: 'Shared AlphaSight AI response',
  robots: { index: false, follow: false },
};

function decodeResponse(encoded: string): string {
  try {
    const raw = Buffer.from(decodeURIComponent(encoded), 'base64').toString('utf-8');
    return raw;
  } catch {
    return '';
  }
}

export default async function SharedResponsePage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string }>;
}) {
  const params = await searchParams;
  const content = params.r ? decodeResponse(params.r) : '';

  return (
    <main className="min-h-screen bg-canvas text-primary">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold">Shared Response</h1>
        <p className="mt-2 text-sm text-muted">This link shares one response only.</p>
        <article className="mt-6 whitespace-pre-wrap rounded-xl border border-borderSubtle bg-elevated p-5 leading-7">
          {content || 'This shared response is unavailable or invalid.'}
        </article>
      </div>
    </main>
  );
}
