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

const greetings = [
  "Hi {name}, ready for market insights?",
  "Welcome {name}, let's analyze stocks",
  "Hey {name}, stock questions?",
  "Hello {name}, market analysis?",
  "Hi {name}, portfolio help?",
  "Welcome {name}, investment queries?",
  "Hey {name}, stock analysis?",
  "Hello {name}, market insights?",
  "Hi {name}, trading questions?",
  "Welcome {name}, stock research?",
];

export function WelcomeScreen({ onSendPrompt }: WelcomeScreenProps) {
  const storedName = typeof window !== 'undefined' ? localStorage.getItem('userName') : null;
  const initialGreeting = storedName ? `Hi ${storedName}, market insights?` : "Hi, stock questions?";
  const [greeting, setGreeting] = useState(initialGreeting);
  const [name, setName] = useState(storedName || "");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch('/api/user/memory');
        if (res.ok) {
          const data = await res.json();
          const userName = data.memory?.name || "";
          setName(userName);

          const lastGreeting = localStorage.getItem('lastGreeting');
          let availableGreetings = greetings.filter(g => g !== lastGreeting);
          if (availableGreetings.length === 0) availableGreetings = greetings;

          const randomGreeting = availableGreetings[Math.floor(Math.random() * availableGreetings.length)];
          const personalized = userName ? randomGreeting.replace('{name}', userName) : "Hello, how can I help you today?";
          setGreeting(personalized);

          if (userName) localStorage.setItem('userName', userName);
          localStorage.setItem('lastGreeting', randomGreeting);
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err);
      }
    };

    fetchUserData();
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center w-full px-4 pt-12 pb-24 min-h-[70vh]">
      
      {/* Container constrained for readability (ChatGPT style) */}
      <div className="w-full max-w-3xl flex flex-col items-center">
        
        {/* Simple, clean brand logo */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-dark-800"
        >
          <img src="/logo.svg" alt="AlphaSight" width="24" height="24" className="opacity-80" />
        </motion.div>

        {/* Minimal, high-contrast typography */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
          className="mb-12 text-center text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100"
          suppressHydrationWarning
        >
          {greeting}
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
    </div>
  );
}