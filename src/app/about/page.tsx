import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata, routeSeo, siteConfig } from '@/lib/seo';
import { JsonLd } from '@/components/seo/json-ld';

export const metadata: Metadata = buildMetadata(routeSeo.about);

const aboutSchema = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'About AlphaSight AI',
  description: routeSeo.about.description,
  url: `${siteConfig.url}/about`,
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <JsonLd data={aboutSchema} />
      <div className="mx-auto max-w-5xl px-6 py-14">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">About AlphaSight AI</h1>
        <p className="mt-5 text-lg leading-8 text-slate-300">
          AlphaSight AI exists to give every modern team an AI workspace that turns raw information into trusted decisions and repeatable action. Most teams still operate with fragmented tools: one app for notes, another for dashboards, another for scripts, and generic chat windows that forget context between sessions. We built AlphaSight AI as one AI productivity platform where research, automation, and intelligent execution happen together.
        </p>

        <section className="mt-10 space-y-5">
          <h2 className="text-3xl font-semibold">Mission</h2>
          <p className="leading-8 text-slate-300">
            Our mission is direct: help people spend less time assembling context and more time creating outcomes. An intelligent AI assistant should not only answer questions, it should understand business context, preserve organizational memory, and support action with defensible reasoning. We optimize for speed, clarity, and operational rigor.
          </p>
          <p className="leading-8 text-slate-300">
            AlphaSight AI supports analysts, operators, founders, and technical teams who need reliable synthesis across noisy sources. We focus on practical workflows, not demo prompts. Every release is evaluated by one question: does this reduce time-to-decision while improving confidence and accountability?
          </p>
        </section>

        <section className="mt-10 space-y-5">
          <h2 className="text-3xl font-semibold">Platform Capabilities</h2>
          <h3 className="text-2xl font-medium">AI research platform workflows</h3>
          <p className="leading-8 text-slate-300">
            Teams run deep research using structured prompts, semantic retrieval, and evidence-first summaries. Instead of copy-pasting between tabs, users can preserve reasoning trails inside the workspace. This keeps context durable and reusable across projects.
          </p>
          <h3 className="text-2xl font-medium">AI automation workspace execution</h3>
          <p className="leading-8 text-slate-300">
            Recurring tasks are converted into automations: monitor source changes, trigger reports, route alerts, and publish concise updates. This reduces repetitive analyst work and ensures important signals do not get buried by operational noise.
          </p>
          <h3 className="text-2xl font-medium">Intelligent analysis system</h3>
          <p className="leading-8 text-slate-300">
            Our AI analysis tool structures outputs with assumptions, evidence, confidence, and open risks. This format helps teams challenge and validate recommendations quickly. We value explainability because speed without traceability is fragile.
          </p>
        </section>

        <section className="mt-10 space-y-5">
          <h2 className="text-3xl font-semibold">Use Cases</h2>
          <p className="leading-8 text-slate-300">
            Product teams use AlphaSight AI to map customer themes, compare competitors, and prioritize roadmap decisions. Operations teams use it to automate recurring intelligence briefs and monitor execution risk. Research teams use it to accelerate signal discovery while maintaining citation quality. Leadership teams use it to keep decision logs coherent across functions and time.
          </p>
          <p className="leading-8 text-slate-300">
            Because the platform is modular, teams can start small with assistant workflows and expand into full automation pipelines as adoption grows. This makes AlphaSight AI suitable for startups, scaleups, and enterprise groups with strict governance needs.
          </p>
        </section>

        <section className="mt-10 space-y-5">
          <h2 className="text-3xl font-semibold">Platform Philosophy</h2>
          <p className="leading-8 text-slate-300">
            We believe AI should behave like a reliable teammate, not a novelty layer. That means outputs should remain concise, auditable, and operationally useful. We deliberately avoid ornamental complexity that makes systems look advanced but hard to trust.
          </p>
          <p className="leading-8 text-slate-300">
            We also believe discoverability matters. Our public architecture is designed for both human search and AI retrieval systems with clear semantic structure, schema markup, internal links, and machine-readable guidance. This ensures AlphaSight AI is understandable by ChatGPT, Gemini, Claude, Perplexity, and traditional search engines.
          </p>
        </section>

        <section className="mt-10 space-y-5">
          <h2 className="text-3xl font-semibold">Roadmap</h2>
          <ul className="list-disc space-y-3 pl-6 text-slate-300">
            <li>Expanded automation orchestration with richer event triggers and approval gates.</li>
            <li>Advanced workspace governance for enterprise compliance and audit workflows.</li>
            <li>Broader API and webhook surface for tighter integration with internal systems.</li>
            <li>Stronger decision analytics to measure model-assisted execution quality over time.</li>
          </ul>
          <p className="leading-8 text-slate-300">
            We ship iteratively and prioritize reliability. Each roadmap item is benchmarked against production use, not lab assumptions.
          </p>
        </section>

        <section className="mt-12 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-2xl font-semibold">Explore next</h2>
          <p className="mt-3 text-slate-300">
            Review product capabilities on <Link href="/features" className="underline">Features</Link>, compare plans on <Link href="/pricing" className="underline">Pricing</Link>, or open implementation guides in <Link href="/docs" className="underline">Docs</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
