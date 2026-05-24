'use client';

import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CheckCircleIcon, StarIcon } from 'lucide-react';
import Link from 'next/link';
import { motion, Transition } from 'framer-motion';

type FREQUENCY = 'monthly' | 'yearly';
const frequencies: FREQUENCY[] = ['monthly', 'yearly'];

interface Plan {
  name: string;
  info: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: {
    text: string;
    tooltip?: string;
  }[];
  btn: {
    text: string;
    href: string;
  };
  highlighted?: boolean;
}

interface PricingSectionProps extends React.ComponentProps<'div'> {
  plans: Plan[];
  heading: string;
  description?: string;
}

export function PricingSection({
  plans,
  heading,
  description,
  className,
  ...props
}: PricingSectionProps) {
  const [frequency, setFrequency] = React.useState<FREQUENCY>('monthly');

  return (
    <div
      className={cn('flex w-full flex-col items-center justify-center space-y-5 p-4', className)}
      {...props}
    >
      <div className="mx-auto max-w-xl space-y-2">
        <h2 className="text-center text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
          {heading}
        </h2>
        {description && (
          <p className="text-muted-foreground text-center text-sm md:text-base">
            {description}
          </p>
        )}
      </div>
      <PricingFrequencyToggle
        frequency={frequency}
        setFrequency={setFrequency}
      />
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {plans.map((plan) => (
          <PricingCard plan={plan} key={plan.name} frequency={frequency} />
        ))}
      </div>
    </div>
  );
}

type PricingFrequencyToggleProps = React.ComponentProps<'div'> & {
  frequency: FREQUENCY;
  setFrequency: React.Dispatch<React.SetStateAction<FREQUENCY>>;
};

export function PricingFrequencyToggle({
  frequency,
  setFrequency,
  className,
  ...props
}: PricingFrequencyToggleProps) {
  return (
    <div
      className={cn('bg-muted/30 mx-auto flex w-fit rounded-full border p-1', className)}
      {...props}
    >
      {frequencies.map((freq) => (
        <button
          key={freq}
          type="button"
          onClick={() => setFrequency(freq)}
          className="relative px-4 py-1 text-sm capitalize"
        >
          <span className="relative z-10">{freq}</span>
          {frequency === freq && (
            <motion.span
              layoutId="frequency"
              transition={{ type: 'spring', duration: 0.4 }}
              className="bg-foreground absolute inset-0 z-10 rounded-full mix-blend-difference"
            />
          )}
        </button>
      ))}
    </div>
  );
}

type PricingCardProps = React.ComponentProps<'div'> & {
  plan: Plan;
  frequency?: FREQUENCY;
};

export function PricingCard({
  plan,
  className,
  frequency = frequencies[0],
  ...props
}: PricingCardProps) {
  const discount =
    plan.price.monthly > 0 && plan.price.yearly < plan.price.monthly * 12
      ? Math.round(
          ((plan.price.monthly * 12 - plan.price.yearly) /
            (plan.price.monthly * 12)) *
            100,
        )
      : null;

  return (
    <div
      key={plan.name}
      className={cn(
        'relative flex w-full flex-col rounded-lg border',
        className,
      )}
      {...props}
    >
      {plan.highlighted && (
        <BorderTrail
          style={{
            boxShadow:
              '0px 0px 60px 30px rgb(255 255 255 / 50%), 0 0 100px 60px rgb(0 0 0 / 50%), 0 0 140px 90px rgb(0 0 0 / 50%)',
          }}
          size={100}
        />
      )}
      <div
        className={cn(
          'bg-muted/20 rounded-t-lg border-b p-4',
          plan.highlighted && 'bg-muted/40',
        )}
      >
        <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
          {plan.highlighted && (
            <p className="bg-background flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs">
              <StarIcon className="h-3 w-3 fill-current" />
              Popular
            </p>
          )}
          {frequency === 'yearly' && discount !== null && discount > 0 && (
            <p className="bg-primary text-inverse flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs">
              {discount}% off
            </p>
          )}
        </div>

        <div className="text-lg font-medium">{plan.name}</div>
        <p className="text-muted-foreground text-sm font-normal">{plan.info}</p>
        <h3 className="mt-2 flex items-end gap-1">
          <span className="text-3xl font-bold">₹{plan.price[frequency]}</span>
          <span className="text-muted-foreground">
            {plan.name !== 'Free'
              ? '/' + (frequency === 'monthly' ? 'month' : 'year')
              : ''}
          </span>
        </h3>
      </div>
      <div
        className={cn(
          'text-muted-foreground space-y-4 px-4 py-6 text-sm',
          plan.highlighted && 'bg-muted/10',
        )}
      >
        {plan.features.map((feature, index) => (
          <div key={index} className="flex items-center gap-2">
            <CheckCircleIcon className="text-foreground h-4 w-4" />
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger
                  className={cn(
                    'inline-flex items-center',
                    feature.tooltip &&
                      'cursor-pointer border-b border-dashed',
                  )}
                >
                  <span>
                    {feature.text}
                  </span>
                </TooltipTrigger>
                {feature.tooltip && (
                  <TooltipContent>
                    <p>{feature.tooltip}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        ))}
      </div>
      <div
        className={cn(
          'mt-auto w-full border-t p-3',
          plan.highlighted && 'bg-muted/40',
        )}
      >
        <Link
          href={plan.btn.href}
          className={cn(
            'inline-flex w-full items-center justify-center whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
            plan.highlighted
              ? 'bg-accent-brand text-inverse hover:bg-accent-brand-hover focus-visible:ring-accent-brand'
              : 'border border-borderStrong bg-transparent text-primary hover:bg-elevated focus-visible:ring-borderFocus',
          )}
        >
          {plan.btn.text}
        </Link>
      </div>
    </div>
  );
}

type BorderTrailProps = {
  className?: string;
  size?: number;
  transition?: Transition;
  delay?: number;
  onAnimationComplete?: () => void;
  style?: React.CSSProperties;
};

export function BorderTrail({
  className,
  size = 60,
  transition,
  delay,
  onAnimationComplete,
  style,
}: BorderTrailProps) {
  const BASE_TRANSITION = {
    repeat: Infinity,
    duration: 5,
    ease: 'linear',
  };

  return (
    <div className='pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]'>
      <motion.div
        className={cn('absolute aspect-square bg-zinc-500', className)}
        style={{
          width: size,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          ...style,
        }}
        animate={{
          offsetDistance: ['0%', '100%'],
        }}
        transition={{
          ...(transition ?? BASE_TRANSITION),
          delay: delay,
        }}
        onAnimationComplete={onAnimationComplete}
      />
    </div>
  );
}
