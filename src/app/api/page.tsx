import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata, routeSeo } from '@/lib/seo';

export const metadata: Metadata = buildMetadata(routeSeo.apiLanding);

export default function ApiLandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">AlphaSight AI API</h1>
        <p className="mt-5 text-lg leading-8 text-slate-300">
          API layer for integrating AlphaSight AI workspace data, assistant actions, and automation outcomes into your product and operations stack.
        </p>
        <section className="mt-10 space-y-4">
          <h2 className="text-3xl font-semibold">What you can build</h2>
          <ul className="list-disc space-y-3 pl-6 text-slate-300">
            <li>Embed AI assistant responses in internal dashboards.</li>
            <li>Trigger workflow automations from system events.</li>
            <li>Ingest research outputs into external tools via webhooks.</li>
            <li>Synchronize workspace state with enterprise systems.</li>
          </ul>
        </section>
        <p className="mt-8 text-slate-300">For access details and roadmap, contact us via <Link href="/contact" className="underline">Contact</Link>.</p>
      </div>
    </main>
  );
}
