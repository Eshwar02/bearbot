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
    monthlyPrice: 799,
    annuallyPrice: Math.round(799 * 12 * 0.8),
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
    monthlyPrice: 1499,
    annuallyPrice: Math.round(1499 * 12 * 0.8),
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
    monthlyPrice: 2999,
    annuallyPrice: Math.round(2999 * 12 * 0.8),
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
    monthlyPrice: 5999,
    annuallyPrice: Math.round(5999 * 12 * 0.8),
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
        "flex flex-col relative rounded-2xl border-2 border-blue-500 ring-2 ring-blue-500/20 lg:rounded-3xl transition-all bg-background/50 border border-gray-200 dark:border-gray-700 overflow-hidden",
        plan.title === "Institutional" && "border-blue-500",
        plan.title === "Insight+" && "border-2 border-orange-500 ring-2 ring-orange-500/20 dark:border-orange-500 dark:ring-orange-500/20"
      )}
    >
      {plan.title === "Institutional" && (
        <div className="absolute top-1/2 inset-x-0 mx-auto h-12 -rotate-45 w-full bg-blue-600 rounded-2xl lg:rounded-3xl blur-[8rem] -z-10"></div>
      )}

      {plan.badge && (
        <span className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
          {plan.badge}
        </span>
      )}

      <div className="p-2 flex flex-col items-start w-full relative">
        <h2 className="font-normal text-sm text-foreground pt-2">{plan.title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{plan.tagline}</p>
        <h3 className="mt-3 text-xl md:text-3xl font-bold">
          ₹{price * users}
          <span className="text-sm font-normal text-muted-foreground">
            /{billing}
          </span>
        </h3>
        <p className="text-xs md:text-base text-muted-foreground mt-2">
          {plan.desc}
        </p>
      </div>

      <div className="flex flex-col items-start w-full px-2 py-2">
        <Button size="lg" className="w-full">
          {plan.buttonText}
        </Button>
        <div className="h-8 overflow-hidden w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.span
              key={billing}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="text-sm text-center text-muted-foreground mt-3 mx-auto block"
            >
              {billing === "monthly"
                ? "Billed monthly"
                : "Billed in one annual payment"}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-col items-start w-full p-2 gap-y-2">
        <span className="text-xs text-left mb-2">Includes:</span>
        {plan.features.map((feature, index) => (
          <div key={index} className="flex items-start gap-2">
            <CheckIcon className="w-3 h-3 flex-shrink-0 text-blue-500 mt-1" />
            <span className="text-left text-sm">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function PricingSection() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [users, setUsers] = useState(1);

  return (
    <section className="py-16 bg-white dark:bg-neutral-950">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
          <div className="flex bg-gray-100 dark:bg-neutral-800 rounded-full">
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                billing === "annual" ? "bg-black text-white" : "dark:text-gray-200 text-gray-700"
              }`}
              onClick={() => setBilling("annual")}
            >
              Annually (Save 20%)
            </button>
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                billing === "monthly" ? "bg-black text-white" : "text-gray-700"
              }`}
              onClick={() => setBilling("monthly")}
            >
              Monthly
            </button>
          </div>

          <div className="flex items-center gap-3 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 text-sm font-normal">
            <span>Users:</span>
            <button
              className="px-2 text-lg"
              onClick={() => setUsers(Math.max(1, users - 1))}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-6 text-center">{users}</span>
            <button className="px-2 text-lg" onClick={() => setUsers(users + 1)}>
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-5">
          {plans.map((plan) => (
            <PlanCard key={plan.title} plan={plan} billing={billing} users={users} />
          ))}
        </div>
      </div>
    </section>
  );
}
