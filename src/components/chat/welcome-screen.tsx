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
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    setPhrase(randomPhrase);
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

        {/* Symmetrical, flat suggestion grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full"
        >
          {suggestions.map((item, index) => (
            <button
              key={index}
              onClick={() => onSendPrompt(item.prompt)}
              className={cn(
                "group flex flex-col text-left p-4 rounded-xl border transition-colors duration-200",
                // Light mode: flat white, gray border, subtle gray hover
                "bg-white border-gray-200 hover:bg-gray-50",
                // Dark mode: flat dark, subtle border, lighter dark hover
                "dark:bg-dark-900 dark:border-dark-800 dark:hover:bg-dark-800"
              )}
            >
              <div className="flex items-center mb-2 text-gray-500 dark:text-dark-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                <item.icon className="w-5 h-5 mr-2" />
                <span className="font-medium text-sm text-gray-900 dark:text-gray-200">
                  {item.label}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-dark-400 leading-relaxed">
                {item.description}
              </p>
            </button>
          ))}
        </motion.div>
    </div>
  );
}