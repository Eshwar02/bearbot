'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfidenceBadgeProps {
  score: number;
  label: 'Low' | 'Moderate' | 'High';
  reliabilityScore: number;
  reasoning: string[];
  className?: string;
}

export function ConfidenceBadge({
  score,
  label,
  reliabilityScore,
  reasoning,
  className,
}: ConfidenceBadgeProps) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const getColorScheme = (label: string) => {
    switch (label) {
      case 'High':
        return {
          bg: 'bg-green-50 dark:bg-green-950/30',
          border: 'border-green-200 dark:border-green-800',
          text: 'text-green-700 dark:text-green-300',
          icon: 'text-green-600 dark:text-green-400',
          badge: 'bg-green-100 dark:bg-green-900',
        };
      case 'Moderate':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-950/30',
          border: 'border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-700 dark:text-yellow-300',
          icon: 'text-yellow-600 dark:text-yellow-400',
          badge: 'bg-yellow-100 dark:bg-yellow-900',
        };
      default:
        return {
          bg: 'bg-red-50 dark:bg-red-950/30',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-700 dark:text-red-300',
          icon: 'text-red-600 dark:text-red-400',
          badge: 'bg-red-100 dark:bg-red-900',
        };
    }
  };

  const getIcon = (label: string) => {
    switch (label) {
      case 'High':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'Moderate':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getTooltipText = (label: string, reasoning: string[]) => {
    switch (label) {
      case 'High':
        return 'AI confidence is high because multiple fresh trusted sources agreed.';
      case 'Moderate':
        return 'Confidence is moderate due to limited or partially conflicting sources.';
      default:
        return 'Confidence is low. Response may lack credible sources or contain uncertainty language.';
    }
  };

  const colors = getColorScheme(label);
  const tooltipText = getTooltipText(label, reasoning);

  return (
    <div className={cn('relative mt-3', className)}>
      <motion.button
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        onClick={() => setIsTooltipOpen(!isTooltipOpen)}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg border px-3 py-2',
          'text-sm font-medium transition-all duration-200',
          'hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0',
          colors.bg,
          colors.border,
          colors.text,
        )}
      >
        <div className={cn('flex items-center justify-center', colors.icon)}>
          {getIcon(label)}
        </div>
        <div className="flex items-center gap-1.5">
          <span>Confidence</span>
          <div
            className={cn(
              'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold',
              colors.badge,
              colors.text,
            )}
          >
            {score}%
          </div>
        </div>
      </motion.button>

      {isTooltipOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className={cn(
            'absolute top-full mt-2 z-50 w-80 rounded-lg border px-4 py-3 shadow-lg',
            'bg-white dark:bg-dark-800',
            'border-gray-200 dark:border-dark-700',
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Main explanation */}
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            {tooltipText}
          </p>

          {/* Score details */}
          <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center justify-between">
              <span>Overall Confidence Score:</span>
              <span className="font-bold text-gray-900 dark:text-gray-100">{score}/100</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Source Reliability:</span>
              <span className="font-bold text-gray-900 dark:text-gray-100">{reliabilityScore}%</span>
            </div>
          </div>

          {/* Reasoning */}
          {reasoning.length > 0 && (
            <div className="mt-3 border-t border-gray-200 dark:border-dark-700 pt-3">
              <p className="mb-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Analysis Factors
              </p>
              <ul className="space-y-1">
                {reasoning.map((reason, idx) => (
                  <li
                    key={idx}
                    className="text-xs leading-snug text-gray-600 dark:text-gray-400"
                  >
                    • {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Close hint */}
          <div className="mt-3 text-[11px] text-gray-400 dark:text-gray-500">
            Click to close
          </div>
        </motion.div>
      )}

      {isTooltipOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsTooltipOpen(false)}
        />
      )}
    </div>
  );
}
