'use client';

import { useRouter } from 'next/navigation';
import { Hero } from '@/components/ui/animated-hero';
import { Button } from '@/components/ui/button';
import { ShaderAnimation } from '@/components/ui/shader-lines';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SocialIcons } from '@/components/ui/social-icons';
import { useScreenSize } from '@/hooks/use-screen-size';
import { PixelTrail } from '@/components/ui/pixel-trail';
import { GooeyFilter } from '@/components/ui/gooey-filter';
import RadialOrbitalTimeline from '@/components/ui/radial-orbital-timeline';
import PricingSection from '@/components/ui/pricing-section';
import { Calendar, Activity, MessageSquare, Shield, Brain } from 'lucide-react';

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

export default function InfoPage() {
  const router = useRouter();
  const screenSize = useScreenSize();

  const goToLogin = () => {
    router.push('/login');
  };

  return (
    <main className="relative w-full bg-black">
      <div className="fixed inset-0 w-full h-full">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <ShaderAnimation />
      </div>

      <GooeyFilter id="pixel-trail-goo" strength={6} />
      <div
        className="fixed inset-0 z-[15] pointer-events-none"
        style={{ filter: "url(#pixel-trail-goo)" }}
      >
        <PixelTrail
          pixelSize={screenSize.lessThan("md") ? 20 : 28}
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

      <div className="relative z-20 flex flex-col items-center justify-center min-h-screen">
        <Hero
          inverted
          primaryLabel="Get Started"
          secondaryLabel="Learn More"
          onPrimaryClick={goToLogin}
          onSecondaryClick={goToLogin}
        />

        <div className="relative z-20 w-full">
          <RadialOrbitalTimeline timelineData={timelineData} />
        </div>

        <div className="relative z-20 w-full">
          <PricingSection />
        </div>

        <div className="w-full max-w-3xl px-6 pb-32">
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
        </div>
      </div>
    </main>
  );
}
