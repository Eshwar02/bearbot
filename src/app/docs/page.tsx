import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata, routeSeo } from '@/lib/seo';

export const metadata: Metadata = buildMetadata(routeSeo.docs);

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">AlphaSight AI Documentation</h1>
        <p className="mt-5 text-lg leading-8 text-slate-300">
          Implementation guides for AI workspace onboarding, assistant workflows, automation runbooks, and API integration patterns.
        </p>
        <section className="mt-10 space-y-4">
          <h2 className="text-3xl font-semibold">Quickstart</h2>
          <p className="leading-8 text-slate-300">1) Create workspace. 2) Configure roles. 3) Add knowledge sources. 4) Build assistant templates. 5) Enable recurring automation jobs.</p>
          <h2 className="text-3xl font-semibold">Architecture</h2>
          <p className="leading-8 text-slate-300">Platform combines semantic retrieval, workflow orchestration, and traceable response systems for production-grade AI operations.</p>
          <h2 className="text-3xl font-semibold">Integrations</h2>
          <p className="leading-8 text-slate-300">Connect APIs and webhooks to route insights into your existing stack with governance and observability.</p>
        </section>
        <p className="mt-8 text-slate-300">Need help? Reach support on <Link href="/contact" className="underline">Contact page</Link>.</p>
      </div>
    </main>
  );
}
