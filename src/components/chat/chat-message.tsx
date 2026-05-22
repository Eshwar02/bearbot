'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ThumbsUp, ThumbsDown, Share, Check, Paperclip, Image as ImageIcon } from 'lucide-react';
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

/**
 * Assistant "avatar" — a simple sparkle mark in the brand teal. Replaces the
 * Bot-in-a-circle so the layout reads as plain text (Claude-style) rather
 * than a chat bubble with an icon chip.
 */
function AssistantMark() {
  return (
    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md">
      <Image src="/logo.svg" alt="AlphaSight" width={18} height={18} />
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
      className="flex items-center gap-1 rounded px-2 py-1 text-xs text-secondary hover:bg-elevated hover:text-primary transition-colors"
    >
      {copied ? <Check className="h-3 w-3" /> : <Share className="h-3 w-3" />}
      {copied ? 'Copied' : 'Share'}
    </button>
  );
}

function StreamingDots() {
  return (
    <div className="flex items-center gap-1.5 py-2">
      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-300 [animation-delay:0ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-300 [animation-delay:150ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-300 [animation-delay:300ms]" />
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

  // Count text that would actually render visibly. During streaming, the LLM
  // often opens with `---` separators or pure whitespace that markdown renders
  // as an invisible <hr/> — which made the bubble look "stuck" with just a
  // cursor. Treat content as visible only once we have real characters.
  const visibleText = useMemo(
    () =>
      normalizedContent
        .replace(/^(?:\s|-{3,}|\*{3,}|_{3,})+/m, '')
        .trim(),
    [normalizedContent],
  );
  const hasContent = visibleText.length > 0;
  const hasStreamingText = normalizedContent.trim().length > 0;
  const attachments = useMemo(() => {
    const metadata = message.metadata as {
      attachments?: Array<{ name?: string; type?: string; size?: number; kind?: string; text?: string }>;
    } | null;
    return Array.isArray(metadata?.attachments) ? metadata.attachments : [];
  }, [message.metadata]);

  if (process.env.NODE_ENV !== 'production' && !isUser) {
    console.debug('[ChatMessage] render', {
      id: message.id,
      isStreaming,
      rawLen: message.content.length,
      visibleLen: visibleText.length,
      rawPreview: message.content.slice(0, 80),
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'px-4 sm:px-6',
        isUser ? 'py-2' : 'py-4',
      )}
    >
      {isUser ? (
        /* ── User: right-aligned rounded pill ───────────────────────── */
        <div className="mx-auto flex max-w-3xl justify-end">
          <div
            className={cn(
              'max-w-[85%] whitespace-pre-wrap break-words',
              'rounded-2xl rounded-tr-md bg-blue-500 dark:bg-elevated px-4 py-2.5',
              'text-[15px] leading-relaxed text-white dark:text-primary',
              'border border-borderSubtle dark:border-borderStrong/60',
              'shadow-sm',
            )}
          >
            {message.content}
            {attachments.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <span
                    key={`${file.name ?? 'attachment'}-${index}`}
                    className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[11px] text-white/90"
                  >
                    {file.kind === 'image' ? (
                      <ImageIcon className="h-3 w-3" />
                    ) : (
                      <Paperclip className="h-3 w-3" />
                    )}
                    {file.name ?? 'Attachment'}
                  </span>
                ))}
              </div>
            )}
            {attachments.some((file) => file.kind === 'image' && typeof file.text === 'string' && file.text.trim()) && (
              <div className="mt-2 rounded-lg border border-white/15 bg-white/5 p-3 text-[12px] text-white/80">
                <div className="mb-1 text-[10px] uppercase tracking-wide text-white/60">Image OCR</div>
                {attachments
                  .filter((file) => file.kind === 'image' && typeof file.text === 'string' && file.text.trim())
                  .slice(0, 2)
                  .map((file, index) => (
                    <div key={`${file.name ?? 'image'}-ocr-${index}`} className="line-clamp-3">
                      {file.text}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── Assistant: plain text, no bubble, sparkle mark on the left ── */
        <div className="mx-auto flex max-w-3xl gap-3">
          <AssistantMark />
          <div className="min-w-0 flex-1">
            {/* Stock card (top of message) */}
            {!isStreaming && prefs.show_charts && message.stockData && message.stockData[0] && (
              <>
                <StockCard stock={message.stockData[0]} />
                <ChartWidget
                  symbol={message.stockData[0].symbol}
                  exchange={message.stockData[0].exchange}
                  height={360}
                />
              </>
            )}

            {/* Body */}
            {hasStreamingText && (
              <MarkdownRenderer
                content={normalizedContent}
                streaming={isStreaming}
                sources={message.sources}
              />
            )}
            {!hasStreamingText && isStreaming && <StreamingDots />}
            {!hasContent && !isStreaming && (
              <div className="text-[15px] leading-7 text-secondary italic">
                {EMPTY_RESPONSE_FALLBACK}
              </div>
            )}

            {/* Web sources footer */}
            {!isStreaming && message.sources && message.sources.length > 0 && (
              <div className="mt-4 rounded-lg border border-borderSubtle dark:border-borderStrong bg-elevated p-3">
                <div className="mb-2 text-[11px] uppercase tracking-wide text-muted">
                  Sources
                </div>
                <ol className="space-y-1.5">
                  {message.sources.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="shrink-0 font-mono text-muted">[{i + 1}]</span>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="line-clamp-1 text-accent-green hover:underline"
                      >
                        {s.title}
                      </a>
                      <span className="shrink-0 text-xs text-muted">· {s.source}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* News cards */}
            {!isStreaming && prefs.show_news_cards && message.newsData && message.newsData.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-xs uppercase tracking-wide text-muted">Recent News</div>
                {message.newsData.slice(0, 4).map((n, i) => (
                  <a
                    key={i}
                    href={n.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border border-borderSubtle dark:border-borderStrong bg-elevated px-3 py-2 transition-colors hover:border-borderStrong hover:bg-elevated-hover"
                  >
                    <div className="line-clamp-2 text-sm text-primary dark:text-gray-200">{n.title}</div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-muted">
                      <span>{n.source}</span>
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

            {/* Feedback buttons for assistant messages */}
            {!isUser && !isStreaming && hasContent && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setFeedback('good')}
                  aria-label="Mark response as helpful"
                  aria-pressed={feedback === 'good'}
                    className={cn(
                      'flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors',
                      feedback === 'good'
                        ? 'bg-accent-brand text-dark-950'
                        : 'text-secondary hover:bg-elevated hover:text-primary'
                    )}
                >
                  <ThumbsUp className="h-3 w-3" />
                  Good
                </button>
                <button
                  onClick={() => setFeedback('poor')}
                  aria-label="Mark response as unhelpful"
                  aria-pressed={feedback === 'poor'}
                    className={cn(
                      'flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors',
                      feedback === 'poor'
                        ? 'bg-red-600 text-white'
                        : 'text-secondary hover:bg-elevated hover:text-primary'
                    )}
                >
                  <ThumbsDown className="h-3 w-3" />
                  Poor
                </button>
                <ShareButton content={normalizedContent} />
              </div>
            )}

          </div>
        </div>
      )}
    </motion.div>
  );
}
