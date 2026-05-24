'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { MoveRight, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroProps {
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  primaryLabel?: string;
  secondaryLabel?: string;
  inverted?: boolean;
}

function Hero({
  onPrimaryClick,
  onSecondaryClick,
  primaryLabel = 'Sign up here',
  secondaryLabel = 'Jump on a call',
  inverted = false,
}: HeroProps) {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ['smarter', 'faster', 'clearer', 'sharper', 'better'],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col">
          <div>
            <Button variant="secondary" size="sm" className={`gap-4 ${inverted ? 'bg-white/10 text-white hover:bg-white/20' : ''}`}>
              Read our launch article <MoveRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-4 flex-col">
            <h1 className={`text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-regular ${inverted ? 'text-white' : 'text-primary'}`}>
              <span>AI-powered investing,</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className={`absolute font-semibold ${inverted ? 'text-white' : ''}`}
                    initial={{ opacity: 0, y: '-100' }}
                    transition={{ type: 'spring', stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className={`text-lg md:text-xl leading-relaxed tracking-tight max-w-2xl text-center ${inverted ? 'text-white/70' : 'text-muted'}`}>
              Make confident investment decisions with real-time AI analysis,
              personalized portfolio insights, and intelligent risk assessment.
            </p>
          </div>
          <div className="flex flex-row gap-3">
            <Button size="lg" variant="ghost" className={`gap-4 ${inverted ? 'text-white/80 hover:text-white hover:bg-white/10' : ''}`} onClick={onSecondaryClick}>
              {secondaryLabel} <PhoneCall className="w-4 h-4" />
            </Button>
            <Button size="lg" className="gap-4" onClick={onPrimaryClick}>
              {primaryLabel} <MoveRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Hero };
