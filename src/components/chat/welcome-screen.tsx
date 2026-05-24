'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const phrases = [
  'Ready when you are.',
  'Ask anything.',
  'Your thoughts, amplified.',
  'Intelligence at your command.',
  'Begin the conversation.',
  'Start where curiosity leads.',
  'Thinking alongside you.',
  'Answers that move with you.',
  'Built for deeper thinking.',
  'Clarity starts here.',
];

export function WelcomeScreen() {
  const [phrase, setPhrase] = useState(phrases[0]);

  useEffect(() => {
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    setPhrase(randomPhrase);
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 pb-24 pt-16 sm:pb-16">
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="text-center font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-primary"
        style={{
          fontOpticalSizing: 'auto',
          fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 0',
        }}
        suppressHydrationWarning
      >
        {phrase}
      </motion.h1>
    </div>
  );
}
