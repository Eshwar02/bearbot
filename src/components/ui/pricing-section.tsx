"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckIcon, Minus, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const plans = [
  {
    title: "Free",
    monthlyPrice: 0,
    annuallyPrice: 0,
    tagline: "Start exploring markets",
    desc: "Essential tools for casual investors and beginners entering AI-powered finance.",
    features: [
      "Limited AI Chats",
      "Basic Watchlists",
      "Market Tracking",
      "Public Research",
    ],
    buttonText: "Get Started",
    badge: null,
  },
  {
    title: "Core",
    monthlyPrice: 300,
    annuallyPrice: Math.round(300 * 12 * 0.8),
    tagline: "For active investors",
    desc: "Expanded AI research and deeper market analysis for daily trading workflows.",
    features: [
      "AI Research Chat",
      "Live Quotes",
      "Technical Indicators",
      "Sentiment Tracking",
    ],
    buttonText: "Start Analyzing",
    badge: "Popular",
  },
  {
    title: "Insight+",
    monthlyPrice: 700,
    annuallyPrice: Math.round(700 * 12 * 0.8),
    tagline: "Professional-grade intelligence",
    desc: "Advanced market intelligence with AI research pipelines and real-time analysis systems.",
    features: [
      "Deep Research Engine",
      "AI Progress Tracking",
      "Multi-Source Analysis",
      "Portfolio Monitoring",
    ],
    buttonText: "Unlock Insights",
    badge: "Recommended",
  },
  {
    title: "Pro",
    monthlyPrice: 1200,
    annuallyPrice: Math.round(1200 * 12 * 0.8),
    tagline: "Built for serious traders",
    desc: "Institutional-style tools for portfolio management, volatility tracking, and market intelligence.",
    features: [
      "Risk Radar",
      "Portfolio Brain",
      "Advanced Signals",
      "Real-Time Market Streams",
    ],
    buttonText: "Go Pro",
    badge: "Advanced",
  },
  {
    title: "Institutional",
    monthlyPrice: 2000,
    annuallyPrice: Math.round(2000 * 12 * 0.8),
    tagline: "Full AlphaSight infrastructure",
    desc: "Enterprise-level financial intelligence with complete AI systems and advanced research capabilities.",
    features: [
      "Institutional AI Models",
      "Priority Processing",
      "Advanced Risk Systems",
      "Dedicated Intelligence Layer",
    ],
    buttonText: "Access Platform",
    badge: "Enterprise",
  },
];

const PlanCard = ({
  plan,
  billing,
  users,
}: {
  plan: typeof plans[0];
  billing: "monthly" | "annual";
  users: number;
}) => {
  const price = billing === "annual" ? plan.annuallyPrice : plan.monthlyPrice;

  return (
    <div
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-3xl border bg-background/55 p-5 shadow-sm transition-all duration-200",
        "border-borderSubtle dark:border-borderStrong",
        "hover:-translate-y-0.5 hover:border-accent-brand/50 hover:shadow-md",
        plan.title === "Institutional" && "border-blue-500/70 ring-1 ring-blue-500/15",
        plan.title === "Insight+" && "border-orange-500/70 ring-1 ring-orange-500/15"
      )}
    >
      {plan.title === "Institutional" && (
        <div className="absolute inset-x-8 top-0 h-24 rounded-full bg-blue-600/10 blur-3xl" />
      )}

      {plan.badge && (
        <span className="absolute right-4 top-4 rounded-full border border-blue-500/30 bg-blue-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-300">
          {plan.badge}
        </span>
      )}

      <div className="relative flex flex-1 flex-col">
        <div className="pr-20">
          <h2 className="text-sm font-medium tracking-tight text-foreground">{plan.title}</h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{plan.tagline}</p>
        </div>

        <div className="mt-5 flex items-end gap-1">
          <span className="text-2xl font-semibold tracking-tight md:text-4xl">
            ₹{price * users}
          </span>
          <span className="pb-1 text-sm text-muted-foreground">/{billing}</span>
        </div>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {plan.desc}
        </p>

      <div className="mt-5 flex flex-col gap-3">
        <Button size="lg" className="w-full rounded-2xl">
          {plan.buttonText}
        </Button>
        <div className="h-6 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.span
              key={billing}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="block text-center text-xs text-muted-foreground"
            >
              {billing === "monthly"
                ? "Billed monthly"
                : "Billed in one annual payment"}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-5 border-t border-borderSubtle pt-4">
        <span className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Includes
        </span>
        {plan.features.map((feature, index) => (
          <div key={index} className="flex items-start gap-2.5 py-1">
            <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
            <span className="text-sm leading-6 text-foreground/90">{feature}</span>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
};

export default function PricingSection() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [users, setUsers] = useState(1);

  return (
    <section className="bg-white py-20 dark:bg-neutral-950">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center">
          <div className="flex w-full max-w-md rounded-full border border-borderSubtle bg-elevated p-1 dark:border-borderStrong md:w-auto">
            <button
              className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition md:flex-none ${
                billing === "annual"
                  ? "bg-accent-brand text-white shadow-sm"
                  : "text-muted-foreground"
              }`}
              onClick={() => setBilling("annual")}
            >
              Annually (Save 20%)
            </button>
            <button
              className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition md:flex-none ${
                billing === "monthly"
                  ? "bg-accent-brand text-white shadow-sm"
                  : "text-muted-foreground"
              }`}
              onClick={() => setBilling("monthly")}
            >
              Monthly
            </button>
          </div>

          <div className="flex w-full items-center justify-between rounded-full border border-borderSubtle bg-elevated px-4 py-2 text-sm dark:border-borderStrong md:w-auto md:justify-start md:gap-3">
            <span className="text-muted-foreground">Users</span>
            <button
              className="rounded-full p-1 text-lg text-muted-foreground transition hover:bg-elevated-hover hover:text-foreground"
              onClick={() => setUsers(Math.max(1, users - 1))}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-6 text-center text-foreground">{users}</span>
            <button className="rounded-full p-1 text-lg text-muted-foreground transition hover:bg-elevated-hover hover:text-foreground" onClick={() => setUsers(users + 1)}>
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
          {plans.map((plan) => (
            <PlanCard key={plan.title} plan={plan} billing={billing} users={users} />
          ))}
        </div>
      </div>
    </section>
  );
}
