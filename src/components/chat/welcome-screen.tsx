'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, Globe, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WelcomeScreenProps {
  onSendPrompt: (prompt: string) => void;
}

const suggestions = [
  {
    icon: TrendingUp,
    label: 'Analyze Apple (AAPL)',
    prompt: 'Analyze Apple stock',
    description: 'Price action, fundamentals & outlook',
  },
  {
    icon: BarChart3,
    label: 'Reliance deep dive',
    prompt: 'Reliance Industries deep dive',
    description: 'Comprehensive analysis of RIL',
  },
  {
    icon: Globe,
    label: 'US market outlook',
    prompt: "What's happening in US markets today?",
    description: 'Indices, sectors & macro trends',
  },
  {
    icon: ArrowLeftRight,
    label: 'Compare TCS vs Infosys',
    prompt: 'Compare TCS vs Infosys',
    description: 'Head-to-head IT sector comparison',
  },
];

const phrases = [
  "Ready when you are.",
  "Ask anything.",
  "Your thoughts, amplified.",
  "Intelligence at your command.",
  "Begin the conversation.",
  "Start where curiosity leads.",
  "Thinking alongside you.",
  "Answers that move with you.",
  "Built for deeper thinking.",
  "Clarity starts here.",
];

export function WelcomeScreen({ onSendPrompt }: WelcomeScreenProps) {
  const [phrase, setPhrase] = useState(phrases[0]);

  useEffect(() => {
    const lastPhrase = localStorage.getItem('lastPhrase');
    let available = phrases.filter(p => p !== lastPhrase);
    if (available.length === 0) available = phrases;
    const randomPhrase = available[Math.floor(Math.random() * available.length)];
    setPhrase(randomPhrase);
    localStorage.setItem('lastPhrase', randomPhrase);
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 pb-24 pt-16 sm:pb-16">
      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mb-8 text-center font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-primary"
        style={{ fontOpticalSizing: 'auto', fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 0' }}
        suppressHydrationWarning
      >
        {phrase}
      </motion.h1>


    </div>
  );
}
