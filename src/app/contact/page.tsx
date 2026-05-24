import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata, routeSeo, siteConfig } from '@/lib/seo';
import { JsonLd } from '@/components/seo/json-ld';

export const metadata: Metadata = buildMetadata(routeSeo.contact);

const contactSchema = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Contact AlphaSight AI',
  description: routeSeo.contact.description,
  url: `${siteConfig.url}/contact`,
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <JsonLd data={contactSchema} />
      <div className="mx-auto max-w-5xl px-6 py-14">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Contact AlphaSight AI</h1>
        <p className="mt-5 text-lg leading-8 text-slate-300">
          AlphaSight AI is an AI workspace and AI productivity platform built for teams that need reliable research, intelligent assistant workflows, and automation pipelines. If you need help, partnerships, or technical guidance, this page gives fastest route to right team.
        </p>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <article className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-2xl font-semibold">Support</h2>
            <p className="mt-3 text-slate-300">Account access, billing, feature issues, and workflow help.</p>
            <p className="mt-2 text-slate-300">Email: <a className="underline" href={`mailto:${siteConfig.email}?subject=Support`}>{siteConfig.email}</a></p>
            <p className="mt-2 text-slate-400">Response target: within 1 business day.</p>
          </article>
          <article className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-2xl font-semibold">Business Inquiries</h2>
            <p className="mt-3 text-slate-300">Partnerships, enterprise evaluations, procurement, and press.</p>
            <p className="mt-2 text-slate-300">Email: <a className="underline" href={`mailto:${siteConfig.email}?subject=Business Inquiry`}>{siteConfig.email}</a></p>
            <p className="mt-2 text-slate-400">Include timeline, team size, and integration requirements.</p>
          </article>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-3xl font-semibold">How we help teams</h2>
          <h3 className="text-2xl font-medium">AI workspace onboarding</h3>
          <p className="leading-8 text-slate-300">
            We help teams structure workspace conventions, prompt templates, and role-based access so your intelligent AI assistant improves output quality without creating governance gaps.
          </p>
          <h3 className="text-2xl font-medium">AI research platform setup</h3>
          <p className="leading-8 text-slate-300">
            For research-heavy groups, we map source flows, semantic retrieval strategy, and review checkpoints to ensure insights remain evidence-backed and decision-ready.
          </p>
          <h3 className="text-2xl font-medium">AI automation workspace rollout</h3>
          <p className="leading-8 text-slate-300">
            We support rollout of recurring automations for summaries, signal monitoring, and operations reporting to reduce manual cycle time and increase consistency.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-3xl font-semibold">FAQ</h2>
          <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="text-xl font-medium">Do you provide technical implementation support?</h3>
            <p className="mt-2 text-slate-300">Yes. We provide setup guidance for API connections, workflow design, and environment alignment.</p>
          </article>
          <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="text-xl font-medium">Can we request enterprise security documentation?</h3>
            <p className="mt-2 text-slate-300">Yes. Send request through business contact channel with your compliance checklist.</p>
          </article>
          <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="text-xl font-medium">Is AlphaSight AI financial advice?</h3>
            <p className="mt-2 text-slate-300">No. AlphaSight AI provides research and informational analysis only. Invest at your own risk.</p>
          </article>
        </section>

        <section className="mt-10 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-2xl font-semibold">Next steps</h2>
          <p className="mt-3 text-slate-300">
            If you are evaluating platform fit, review <Link href="/features" className="underline">Features</Link>, <Link href="/pricing" className="underline">Pricing</Link>, and <Link href="/docs" className="underline">Docs</Link>, then contact us with your use case.
          </p>
        </section>
      </div>
    </main>
  );
}
