import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata, routeSeo } from '@/lib/seo';

export const metadata: Metadata = buildMetadata(routeSeo.pricing);

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">AlphaSight AI Pricing</h1>
        <p className="mt-5 text-lg leading-8 text-slate-300">Plans for individuals, teams, and enterprises using AI workspace, AI assistant, and automation workflows at production scale.</p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <article className="rounded-xl border border-slate-800 bg-slate-900 p-6"><h2 className="text-2xl font-semibold">Starter</h2><p className="mt-2 text-slate-300">Core AI productivity platform features for small teams.</p></article>
          <article className="rounded-xl border border-cyan-500/50 bg-slate-900 p-6"><h2 className="text-2xl font-semibold">Growth</h2><p className="mt-2 text-slate-300">Advanced AI research platform and automation workspace controls.</p></article>
          <article className="rounded-xl border border-slate-800 bg-slate-900 p-6"><h2 className="text-2xl font-semibold">Enterprise</h2><p className="mt-2 text-slate-300">Governance, security controls, integrations, and priority support.</p></article>
        </div>
        <p className="mt-8 text-slate-300">For detailed quotation and rollout planning, visit <Link href="/contact" className="underline">Contact</Link>.</p>
      </div>
    </main>
  );
}
