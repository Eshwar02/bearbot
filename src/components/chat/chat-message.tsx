'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ThumbsUp, ThumbsDown, Share, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from './markdown-renderer';
import { StockCard } from './stock-card';
import { ChartWidget } from './chart-widget';
import { usePrefs } from '@/lib/hooks/use-prefs';
import type { ChatMessage as ChatMessageType } from '@/stores/app-store';

interface ChatMessageProps {
  message: ChatMessageType;
}

const EMPTY_RESPONSE_FALLBACK =
  'Unable to generate analysis right now. Showing available data below.';

function AssistantMark() {
  return (
    <div className="mt-1.5 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white dark:border-dark-700 dark:bg-dark-900">
      <img src="/logo.svg" alt="AlphaSight" width={16} height={16} className="opacity-90" />
    </div>
  );
}

function ShareButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-500" /> : <Share className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Share'}
    </button>
  );
}

function StreamingDots() {
  return (
    <div className="flex items-center gap-1.5 py-3">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400 dark:bg-gray-500 [animation-delay:0ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400 dark:bg-gray-500 [animation-delay:150ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400 dark:bg-gray-500 [animation-delay:300ms]" />
    </div>
  );
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [feedback, setFeedback] = useState<'good' | 'poor' | null>(null);
  const prefs = usePrefs();
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;
  
  const normalizedContent = useMemo(
    () => {
      if (typeof message.content !== 'string') return '';
      return message.content
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
    },
    [message.content],
  );

  const streamingContent = useMemo(
    () => normalizedContent.replace(/^#+\s*/gm, ''),
    [normalizedContent],
  );

  const visibleText = useMemo(
    () =>
      normalizedContent
        .replace(/^(?:\s|-{3,}|\*{3,}|_{3,})+/m, '')
        .trim(),
    [normalizedContent],
  );
  
  const hasContent = visibleText.length > 0;
  const hasStreamingText = normalizedContent.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'w-full mb-6',
        isUser ? 'py-4' : 'py-2',
      )}
    >
      {isUser ? (
        /* ── User: Subtle, muted gray pill (ChatGPT style) ───────────────────────── */
        <div className="flex w-full justify-end">
          <div
            className={cn(
              'max-w-[85%] whitespace-pre-wrap break-words',
              'rounded-3xl bg-gray-100 dark:bg-[#2F2F2F] px-5 py-3',
              'text-[15px] leading-relaxed text-gray-900 dark:text-gray-100',
            )}
          >
            {message.content}
          </div>
        </div>
      ) : (
        /* ── Assistant: Plain text, readable width, icon on left ── */
        <div className="flex w-full gap-4">
          <AssistantMark />
          <div className="min-w-0 flex-1 pt-1">
            
            {/* Stock card (top of message) */}
            {!isStreaming && prefs.show_charts && message.stockData && message.stockData[0] && (
              <div className="mb-5 max-w-2xl">
                <StockCard stock={message.stockData[0]} />
                <ChartWidget
                  symbol={message.stockData[0].symbol}
                  exchange={message.stockData[0].exchange}
                  height={320}
                />
              </div>
            )}

            {/* Body - highly readable typography */}
            <div className="prose prose-sm dark:prose-invert max-w-none text-gray-900 dark:text-gray-100">
              {hasStreamingText && (
                <MarkdownRenderer
                  content={normalizedContent}
                  streaming={isStreaming}
                  sources={message.sources}
                />
              )}
              {!hasStreamingText && isStreaming && <StreamingDots />}
              {!hasContent && !isStreaming && (
                <div className="text-[15px] leading-7 text-gray-500 italic">
                  {EMPTY_RESPONSE_FALLBACK}
                </div>
              )}
            </div>

            {/* Web sources footer - Clean, flat borders */}
            {!isStreaming && message.sources && message.sources.length > 0 && (
              <div className="mt-6 rounded-xl border border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-900 p-4 max-w-2xl">
                <div className="mb-3 text-xs font-semibold text-gray-900 dark:text-gray-100">
                  Sources
                </div>
                <ol className="space-y-2.5">
                  {message.sources.map((s, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 dark:bg-dark-800 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                        {i + 1}
                      </span>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="line-clamp-1 font-medium text-blue-600 dark:text-blue-400 hover:underline pt-0.5"
                      >
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* News cards - Structured and minimal */}
            {!isStreaming && prefs.show_news_cards && message.newsData && message.newsData.length > 0 && (
              <div className="mt-6 space-y-3 max-w-2xl">
                <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                  Recent News
                </div>
                {message.newsData.slice(0, 4).map((n, i) => (
                  <a
                    key={i}
                    href={n.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 p-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-dark-800"
                  >
                    <div className="line-clamp-2 text-[14px] font-medium leading-snug text-gray-900 dark:text-gray-100">{n.title}</div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium">{n.source}</span>
                      {n.publishedAt && (
                        <>
                          <span>·</span>
                          <span>{new Date(n.publishedAt).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            )}

            {/* Feedback buttons - Subtle flat design */}
            {!isUser && !isStreaming && hasContent && (
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setFeedback('good')}
                  className={cn(
                    'flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors',
                    feedback === 'good'
                      ? 'bg-gray-200 text-gray-900 dark:bg-dark-700 dark:text-gray-100'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-dark-800 dark:hover:text-gray-200'
                  )}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setFeedback('poor')}
                  className={cn(
                    'flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors',
                    feedback === 'poor'
                      ? 'bg-gray-200 text-gray-900 dark:bg-dark-700 dark:text-gray-100'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-dark-800 dark:hover:text-gray-200'
                  )}
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                </button>
                <div className="ml-2 border-l border-gray-200 dark:border-dark-800 pl-2">
                  <ShareButton content={normalizedContent} />
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </motion.div>
  );
}