import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, Globe, ArrowLeftRight, Sparkles } from 'lucide-react';
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

export  function WelcomeScreen({ onSendPrompt }: WelcomeScreenProps) {
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
    <div className="relative flex flex-col items-center w-full min-h-[90vh] px-4 pt-20 pb-24 bg-[#03060D] overflow-hidden">
      
      {/* --- AMBIENT MESH BACKGROUND --- */}
      {/* Top Left Emerald Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/15 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
      {/* Bottom Right Teal Glow */}
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-800/20 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
      
      {/* Orbital Rings (Simulating 3D depth) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border-[1px] border-emerald-500/5 rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border-[1px] border-emerald-500/10 rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
        
        {/* --- BRANDING & HEADER --- */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center mb-16"
        >
          <div className="relative mb-8 group">
            {/* Pulsing Backlight */}
            <div className="absolute inset-0 bg-emerald-500/40 blur-xl rounded-full group-hover:bg-emerald-400/60 transition-all duration-500" />
            <div className="relative p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl flex items-center justify-center">
              <img src="/logo.svg" alt="AlphaSight" width="48" height="48" />
            </div>
          </div>

          <motion.h1
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50"
            suppressHydrationWarning
          >
            {greeting.split(',')[0]}<span className="text-white">,</span><br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">
              {greeting.split(',')[1] || " ready to trade?"}
            </span>
          </motion.h1>
        </motion.div>

        {/* --- ASYMMETRICAL BENTO GRID --- */}
        {/* This breaks the "box box" design completely. We use grid col spans to make them uneven and visually interesting */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 md:grid-cols-12 gap-4 w-full"
        >
          {suggestions.map((item, index) => {
            // Asymmetrical sizing logic
            const isFeatured = index === 0; // First item spans wide
            const isTall = index === 1;     // Second item is normal
            const isHalf = index > 1;       // Bottom two share a row
            
            return (
              <button
                key={index}
                onClick={() => onSendPrompt(item.prompt)}
                className={cn(
                  "group relative flex flex-col text-left rounded-3xl p-6 transition-all duration-500 hover:-translate-y-1 overflow-hidden",
                  "bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-xl border border-white/5",
                  "hover:border-emerald-500/30 hover:shadow-[0_0_40px_rgba(16,185,129,0.1)]",
                  // Grid span logic
                  isFeatured ? "md:col-span-8 md:p-8" : "",
                  isTall ? "md:col-span-4" : "",
                  isHalf ? "md:col-span-6" : ""
                )}
              >
                {/* Subtle inner hover gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-transparent to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-transparent transition-all duration-500" />
                
                {/* Top section of card */}
                <div className="flex items-start justify-between w-full mb-6 relative z-10">
                  <div className={cn(
                    "flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-emerald-400 shadow-lg transition-transform duration-500 group-hover:scale-110",
                    isFeatured ? "w-14 h-14" : "w-12 h-12"
                  )}>
                    <item.icon className={isFeatured ? "w-7 h-7" : "w-5 h-5"} />
                  </div>
                  
                  {/* Decorative element for the featured card */}
                  {isFeatured && (
                    <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span className="text-xs font-medium text-emerald-400">Popular</span>
                    </div>
                  )}
                </div>

                {/* Text Content */}
                <div className="mt-auto relative z-10">
                  <h3 className={cn(
                    "font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors duration-300",
                    isFeatured ? "text-2xl" : "text-lg"
                  )}>
                    {item.label}
                  </h3>
                  <p className="text-gray-400/80 leading-relaxed text-sm max-w-sm">
                    {item.description}
                  </p>
                </div>
                
                {/* Background decorative icon (faded) */}
                <item.icon className="absolute -right-6 -bottom-6 w-32 h-32 text-white/[0.02] transform -rotate-12 transition-transform duration-700 group-hover:rotate-0 group-hover:scale-110 pointer-events-none" />
              </button>
            );
          })}
        </motion.div>
        
      </div>
    </div>
  );
}