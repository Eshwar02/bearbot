'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Hero } from '@/components/ui/animated-hero';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SocialIcons } from '@/components/ui/social-icons';
import { Calendar, Activity, MessageSquare, Shield, Brain } from 'lucide-react';

const ShaderAnimation = dynamic(
  () => import('@/components/ui/shader-lines').then((m) => ({ default: m.ShaderAnimation })),
  { ssr: false }
);
const PixelTrail = dynamic(
  () => import('@/components/ui/pixel-trail').then((m) => ({ default: m.PixelTrail })),
  { ssr: false }
);
const GooeyFilter = dynamic(
  () => import('@/components/ui/gooey-filter').then((m) => ({ default: m.GooeyFilter })),
  { ssr: false }
);
const RadialOrbitalTimeline = dynamic(
  () => import('@/components/ui/radial-orbital-timeline'),
  { ssr: false }
);
const PricingSection = dynamic(
  () => import('@/components/ui/pricing').then((m) => ({ default: m.PricingSection })),
  { ssr: false }
);

const timelineData = [
  {
    id: 1,
    title: "Planning",
    date: "Jan 2024",
    content: "Defined the AlphaSight vision, AI research workflow, and live market intelligence architecture.",
    category: "Planning",
    icon: Calendar,
    relatedIds: [3],
    status: "completed" as const,
    energy: 100,
  },
  {
    id: 2,
    title: "Market Pulse",
    date: "Mar 2024",
    content: "Built real-time market streaming, live quotes, and portfolio/watchlist synchronization.",
    category: "Market Pulse",
    icon: Activity,
    relatedIds: [4],
    status: "completed" as const,
    energy: 92,
  },
  {
    id: 3,
    title: "Sentiment Engine",
    date: "Jun 2024",
    content: "Tracking financial news, social sentiment, analyst opinions, and market momentum shifts.",
    category: "Sentiment Engine",
    icon: MessageSquare,
    relatedIds: [1],
    status: "in-progress" as const,
    energy: 74,
  },
  {
    id: 4,
    title: "Risk Radar",
    date: "Aug 2024",
    content: "AI-powered downside analysis, volatility monitoring, and portfolio exposure detection.",
    category: "Risk Radar",
    icon: Shield,
    relatedIds: [5],
    status: "active" as const,
    energy: 81,
  },
  {
    id: 5,
    title: "Portfolio Brain",
    date: "Oct 2024",
    content: "Intelligent portfolio monitoring with drift detection and AI-assisted rebalancing systems.",
    category: "Portfolio Brain",
    icon: Brain,
    relatedIds: [2],
    status: "developing" as const,
    energy: 68,
  },
];

const pricingPlans = [
  {
    name: 'Free',
    info: 'Start exploring markets',
    price: {
      monthly: 0,
      yearly: 0,
    },
    features: [
      { text: 'Limited AI Chats' },
      { text: 'Basic Watchlists' },
      { text: 'Market Tracking' },
      { text: 'Public Research' },
    ],
    btn: {
      text: 'Get Started',
      href: '/login',
    },
  },
  {
    name: 'Core',
    info: 'For active investors',
    price: {
      monthly: 300,
      yearly: Math.round(300 * 12 * 0.8),
    },
    features: [
      { text: 'AI Research Chat' },
      { text: 'Live Quotes' },
      { text: 'Technical Indicators' },
      { text: 'Sentiment Tracking' },
    ],
    btn: {
      text: 'Start Analyzing',
      href: '/login',
    },
    highlighted: true,
  },
  {
    name: 'Insight+',
    info: 'Professional-grade intelligence',
    price: {
      monthly: 700,
      yearly: Math.round(700 * 12 * 0.8),
    },
    features: [
      { text: 'Deep Research Engine' },
      { text: 'AI Progress Tracking' },
      { text: 'Multi-Source Analysis' },
      { text: 'Portfolio Monitoring' },
    ],
    btn: {
      text: 'Unlock Insights',
      href: '/login',
    },
  },
  {
    name: 'Pro',
    info: 'Built for serious traders',
    price: {
      monthly: 1200,
      yearly: Math.round(1200 * 12 * 0.8),
    },
    features: [
      { text: 'Risk Radar' },
      { text: 'Portfolio Brain' },
      { text: 'Advanced Signals' },
      { text: 'Real-Time Market Streams' },
    ],
    btn: {
      text: 'Go Pro',
      href: '/login',
    },
  },
  {
    name: 'Institutional',
    info: 'Full AlphaSight infrastructure',
    price: {
      monthly: 2100,
      yearly: Math.round(2100 * 12 * 0.8),
    },
    features: [
      { text: 'Institutional AI Models' },
      { text: 'Priority Processing' },
      { text: 'Advanced Risk Systems' },
      { text: 'Dedicated Intelligence Layer' },
    ],
    btn: {
      text: 'Access Platform',
      href: '/login',
    },
  },
];

export default function InfoPage() {
  const router = useRouter();

  const goToLogin = () => {
    router.push('/login');
  };

  return (
    <main className="relative w-full bg-black">
      <section className="relative min-h-screen w-full overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute inset-0 bg-black/60 z-10" />
          <ShaderAnimation />
        </div>

        <GooeyFilter id="pixel-trail-goo" strength={6} />
        <div
          className="absolute inset-0 z-[15] pointer-events-none"
          style={{ filter: "url(#pixel-trail-goo)" }}
        >
          <PixelTrail
            pixelSize={20}
            fadeDuration={500}
            delay={80}
            pixelClassName="bg-white/8"
            className="pointer-events-none"
          />
        </div>

        <header className="relative z-20 flex items-center justify-between px-6 py-4 md:px-10 md:py-6">
          <span className="font-serif text-lg md:text-xl tracking-tightish text-white">
            AlphaSight AI
          </span>
          <Button variant="primary" size="sm" onClick={goToLogin} aria-label="Log in to AlphaSight AI">
            Log in
          </Button>
        </header>

        <div className="relative z-20 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
          <Hero
            inverted
            primaryLabel="Get Started"
            secondaryLabel="Learn More"
            onPrimaryClick={goToLogin}
            onSecondaryClick={goToLogin}
          />
        </div>
      </section>

      <div className="relative w-full">
        <div className="w-full" style={{ contentVisibility: 'auto' }}>
          <RadialOrbitalTimeline timelineData={timelineData} />
        </div>

        <div className="w-full" style={{ contentVisibility: 'auto' }}>
          <PricingSection
            plans={pricingPlans}
            heading="Plans that scale with you"
            description="Flexible pricing for every stage, with the same AI-driven market intelligence across the board."
          />
        </div>

        <div className="w-full max-w-3xl mx-auto px-6 pb-32">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tighter text-white text-center mb-12">
            Everything you need to invest smarter
          </h2>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="analysis" className="border-white/10">
              <AccordionTrigger className="text-white text-lg">
                Real-Time AI Stock Analysis
              </AccordionTrigger>
              <AccordionContent className="text-white/70 text-base leading-relaxed">
                Get deep-dive analysis on any stock — fundamentals, technicals, news sentiment, and peer comparison. Our AI connects the dots between price action, earnings, raw materials, and macro trends so you see the full picture.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="portfolio" className="border-white/10">
              <AccordionTrigger className="text-white text-lg">
                Portfolio Tracking & Insights
              </AccordionTrigger>
              <AccordionContent className="text-white/70 text-base leading-relaxed">
                Track your holdings in real time with live pricing, P&L, and allocation breakdowns. Get sector concentration alerts and personalized suggestions to keep your portfolio balanced.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="briefs" className="border-white/10">
              <AccordionTrigger className="text-white text-lg">
                Daily Briefs & Risk Assessment
              </AccordionTrigger>
              <AccordionContent className="text-white/70 text-base leading-relaxed">
                Wake up to a concise portfolio brief covering market pulse, your movers, key events, and actionable watchpoints. Run risk assessments to identify financial, geopolitical, and sector concentration risks before they hit.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="research" className="border-white/10">
              <AccordionTrigger className="text-white text-lg">
                Intelligent Market Research
              </AccordionTrigger>
              <AccordionContent className="text-white/70 text-base leading-relaxed">
                Our AI researches company supply chains, geopolitical exposures, commodity dependencies, and sector headwinds — delivering analyst-grade depth that connects each risk to your specific holdings.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="personalized" className="border-white/10">
              <AccordionTrigger className="text-white text-lg">
                Personalized Recommendations
              </AccordionTrigger>
              <AccordionContent className="text-white/70 text-base leading-relaxed">
                AlphaSight learns your risk tolerance, goals, and preferences over time. Every recommendation, brief, and insight is tuned to your unique profile — no generic advice.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-24 flex flex-col items-center gap-4">
            <p className="text-sm text-neutral-400">Connect with me</p>
            <SocialIcons />
          </div>

          <nav
            aria-label="Footer"
            className="mt-16 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-neutral-400"
          >
            <a href="/about" className="hover:text-white">About</a>
            <a href="/contact" className="hover:text-white">Contact</a>
            <a href="/privacy" className="hover:text-white">Privacy</a>
            <a href="/terms" className="hover:text-white">Terms</a>
            <a href="/disclaimer" className="hover:text-white">Disclaimer</a>
            <a href="https://chat.alphasightai.online" className="hover:text-white">Open App</a>
          </nav>
          <p className="mt-6 text-center text-xs text-neutral-500">
            © {new Date().getFullYear()} AlphaSight AI. All rights reserved. AlphaSight AI is not a registered investment adviser. Information provided is for educational purposes only and is not financial advice.
          </p>
        </div>
      </div>
    </main>
  );
}
