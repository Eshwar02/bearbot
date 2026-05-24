import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata, routeSeo } from '@/lib/seo';

export const metadata: Metadata = buildMetadata(routeSeo.features);

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">AlphaSight AI Features</h1>
        <p className="mt-5 text-lg leading-8 text-slate-300">
          AlphaSight AI is an AI workspace designed for teams that need fast research, trusted analysis, and repeatable execution. The platform combines intelligent AI assistant interactions, workflow automation, and decision-ready outputs in one environment.
        </p>
        <section className="mt-10 space-y-4">
          <h2 className="text-3xl font-semibold">Core capabilities</h2>
          <h3 className="text-2xl font-medium">Intelligent AI assistant</h3>
          <p className="leading-8 text-slate-300">Context-aware assistant for research and execution with structured responses and memory-aware continuity.</p>
          <h3 className="text-2xl font-medium">AI research platform</h3>
          <p className="leading-8 text-slate-300">Semantic retrieval workflows with source-grounded summaries, risk flags, and concise recommendation formats.</p>
          <h3 className="text-2xl font-medium">AI automation workspace</h3>
          <p className="leading-8 text-slate-300">Schedule recurring tasks, trigger event-based workflows, and route outputs to teams with predictable quality.</p>
          <h3 className="text-2xl font-medium">AI analysis tool</h3>
          <p className="leading-8 text-slate-300">Use entity-rich analysis with assumptions and confidence markers to improve decision quality and auditability.</p>
        </section>
        <section className="mt-10 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-2xl font-semibold">Explore more</h2>
          <p className="mt-3 text-slate-300">Read <Link href="/docs" className="underline">Docs</Link>, compare <Link href="/pricing" className="underline">Pricing</Link>, or browse <Link href="/blog" className="underline">Blog</Link> for architecture guides.</p>
        </section>
      </div>
    </main>
  );
}
