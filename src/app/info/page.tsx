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

export default function InfoPage() {
  const router = useRouter();

  const goToLogin = () => {
    router.push('/login');
  };

  return (
    <main className="relative w-full bg-black">
      <div className="fixed inset-0 w-full h-full">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <ShaderAnimation />
      </div>

      <header className="relative z-20 flex items-center justify-between px-6 py-4 md:px-10 md:py-6">
        <span className="font-serif text-lg md:text-xl tracking-tightish text-white">
          AlphaSight AI
        </span>
        <Button variant="primary" size="sm" onClick={goToLogin}>
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
        </div>
      </div>
    </main>
  );
}
