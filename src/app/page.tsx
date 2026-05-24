import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata, routeSeo, siteConfig } from '@/lib/seo';
import { JsonLd } from '@/components/seo/json-ld';

export const metadata: Metadata = buildMetadata(routeSeo.home);

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url }],
};

export default function MarketingHomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <JsonLd data={breadcrumbSchema} />
      <header className="mx-auto max-w-6xl px-6 py-10">
        <nav aria-label="Main navigation" className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="text-xl font-semibold">AlphaSight AI</Link>
          <ul className="flex flex-wrap gap-5 text-sm text-slate-300">
            <li><Link href="/features">Features</Link></li>
            <li><Link href="/pricing">Pricing</Link></li>
            <li><Link href="/docs">Docs</Link></li>
            <li><Link href="/blog">Blog</Link></li>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 pb-14 pt-2 md:grid-cols-[1.3fr_1fr]">
        <div>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">AI workspace for research, automation, and intelligent execution</h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            AlphaSight AI is an AI productivity platform built for operators, analysts, founders, and growth teams who need an intelligent AI assistant that can read context, run workflows, and deliver trusted outcomes. Instead of juggling disconnected chat tools, docs, dashboards, and scripts, teams use one AI automation workspace to research, decide, and act faster.
          </p>
          <p className="mt-4 leading-8 text-slate-300">
            This AI research platform combines semantic retrieval, market and business data analysis, reusable automations, and audit-friendly output so teams can move from question to decision in minutes. Every workspace keeps knowledge structured, searchable, and reusable for future prompts, reports, and operations.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="https://chat.alphasightai.online/login" className="rounded-md bg-cyan-400 px-5 py-3 font-semibold text-slate-900">Open Dashboard</Link>
            <Link href="/features" className="rounded-md border border-slate-700 px-5 py-3 font-semibold">Explore Features</Link>
          </div>
        </div>
        <aside className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6" aria-label="Platform summary">
          <h2 className="text-2xl font-semibold">Why teams adopt AlphaSight AI</h2>
          <ul className="mt-5 space-y-3 text-slate-300">
            <li>AI assistant with memory-aware context and role-based governance.</li>
            <li>AI analysis tool for research, trend synthesis, and risk signals.</li>
            <li>AI automation workspace for repeatable pipelines and alerts.</li>
            <li>Enterprise-grade architecture with secure identity and data controls.</li>
          </ul>
        </aside>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold">Built for high-stakes workflows</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="text-xl font-medium">Research workflows</h3>
            <p className="mt-3 text-slate-300">Collect signals from multiple sources, compare viewpoints, and convert findings into concise briefs with clear citations and assumptions.</p>
          </article>
          <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="text-xl font-medium">Automation workflows</h3>
            <p className="mt-3 text-slate-300">Schedule recurring analysis, trigger alerts from threshold changes, and pipe results into team channels or internal systems.</p>
          </article>
          <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="text-xl font-medium">Intelligent analysis system</h3>
            <p className="mt-3 text-slate-300">Move from raw information to decision-ready output using semantic chunking, entity extraction, and explainable recommendation summaries.</p>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold">AI-native workflow design</h2>
        <p className="mt-4 leading-8 text-slate-300">
          AlphaSight AI uses a modular architecture where every workflow is split into semantic context, reasoning scope, and action boundaries. This prevents prompt drift and helps teams maintain consistency as usage scales. Instead of relying on one giant instruction set, each task can run with focused context blocks that reduce ambiguity and improve response precision.
        </p>
        <p className="mt-4 leading-8 text-slate-300">
          Teams can build reusable templates for product research, market analysis, operational planning, and reporting. These templates define how the intelligent AI assistant should gather evidence, evaluate options, and structure output. With this approach, teams preserve quality across users, not just across individual sessions.
        </p>
        <p className="mt-4 leading-8 text-slate-300">
          As an AI automation workspace, AlphaSight AI also supports scheduled and event-based tasks. Workflows can trigger on defined conditions, generate summaries, and route deliverables to internal recipients. This reduces repetitive analyst time and ensures critical updates are not missed in high-volume environments.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold">Enterprise readiness and trust</h2>
        <p className="mt-4 leading-8 text-slate-300">
          Production AI systems need controls beyond prompt quality. AlphaSight AI includes secure authentication, scoped data access patterns, and role-aware behavior to keep sensitive contexts protected. Workspace-level configuration allows teams to define who can run which workflows and how outputs are shared.
        </p>
        <p className="mt-4 leading-8 text-slate-300">
          Our AI analysis tool emphasizes explainability through structured output patterns that include assumptions, evidence signals, and unresolved risks. This helps operators validate model results before downstream decisions are made. Fast output is useful only when teams can trust and inspect reasoning.
        </p>
        <p className="mt-4 leading-8 text-slate-300">
          For organizations evaluating long-term AI adoption, this platform philosophy matters: reliable process, not isolated demo wins. AlphaSight AI is built for repeatability, measurable impact, and scalable governance.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold">FAQ</h2>
        <div className="mt-6 space-y-4">
          <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="text-xl font-medium">What makes AlphaSight AI different from generic chat tools?</h3>
            <p className="mt-3 text-slate-300">AlphaSight AI is not single prompt toy. It is full AI workspace with persistent context, automation layers, and output designed for real business operations.</p>
          </article>
          <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="text-xl font-medium">Can teams run this as AI productivity platform across departments?</h3>
            <p className="mt-3 text-slate-300">Yes. Product, finance, operations, and research teams use same foundation while controlling access by role and workspace scope.</p>
          </article>
          <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="text-xl font-medium">Does AlphaSight AI provide financial advice?</h3>
            <p className="mt-3 text-slate-300">No. Platform provides information and analysis only. This is not financial advice. Invest at your own risk.</p>
          </article>
        </div>
      </section>

      <footer className="border-t border-slate-800 py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-6 text-sm text-slate-300">
          <p>© {new Date().getFullYear()} AlphaSight AI</p>
          <ul className="flex flex-wrap gap-4">
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/terms">Terms</Link></li>
            <li><Link href="/disclaimer">Disclaimer</Link></li>
            <li><Link href="/llms.txt">LLMs</Link></li>
          </ul>
        </div>
      </footer>
    </main>
  );
}
