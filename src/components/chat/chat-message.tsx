'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Share, Check, Copy, Paperclip, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { normalizeChatContent } from '@/lib/chat-content';
import { MarkdownRenderer } from './markdown-renderer';
import { StockCard } from './stock-card';
import { ChartWidget } from './chart-widget';
import { ConfidenceBadge } from './confidence-badge';
import { usePrefs } from '@/lib/hooks/use-prefs';
import type { ChatMessage as ChatMessageType } from '@/stores/app-store';
import { toast } from 'sonner';

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

function ShareButton({
  content,
  messageId,
  conversationId,
}: {
  content: string;
  messageId: string;
  conversationId?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      const res = await fetch('/api/share/response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, conversationId, content }),
      });
      if (!res.ok) {
        throw new Error('Unable to create share URL');
      }
      const data = (await res.json()) as { shareUrl?: string };
      if (!data.shareUrl) {
        throw new Error('Missing share URL');
      }
      const shareUrl = data.shareUrl.startsWith('http')
        ? data.shareUrl
        : `${window.location.origin}${data.shareUrl}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Share link copied');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Unable to create share link');
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1 rounded px-2 py-1 text-xs text-secondary hover:bg-elevated hover:text-primary transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-500" /> : <Share className="h-3.5 w-3.5" />}
      {copied ? 'Link Copied' : 'Share'}
    </button>
  );
}

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Response copied');
    } catch {
      toast.error('Failed to copy response');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 rounded px-2 py-1 text-xs text-secondary hover:bg-elevated hover:text-primary transition-colors"
      aria-label="Copy full response"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy'}
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
  const [feedbackReply, setFeedbackReply] = useState<string | null>(null);
  const prefs = usePrefs();
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;
  
  const normalizedContent = useMemo(
    () => (typeof message.content === 'string' ? normalizeChatContent(message.content) : ''),
    [message.content],
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
  const attachments = useMemo(() => {
    const metadata = message.metadata as {
      attachments?: Array<{ name?: string; type?: string; size?: number; kind?: string; text?: string }>;
    } | null;
    return Array.isArray(metadata?.attachments) ? metadata.attachments : [];
  }, [message.metadata]);

  const confidence = useMemo(() => {
    const metadata = message.metadata as {
      confidence?: {
        score: number;
        label: 'Low' | 'Moderate' | 'High';
        reliabilityScore: number;
        reasoning: string[];
      };
    } | null;
    return metadata?.confidence ?? null;
  }, [message.metadata]);

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

            {/* Body */}
            <div className="prose prose-sm dark:prose-invert max-w-none text-primary">
              {hasStreamingText && (
                <MarkdownRenderer
                  content={normalizedContent}
                  streaming={isStreaming}
                  sources={message.sources}
                />
              )}
              {!hasStreamingText && isStreaming && <StreamingDots />}
              {!hasContent && !isStreaming && (
                <div className="text-[15px] leading-7 italic text-muted">
                  {EMPTY_RESPONSE_FALLBACK}
                </div>
              )}
            </div>

            {/* Web sources footer - Clean, flat borders */}
            {!isStreaming && Array.isArray(message.sources) && message.sources.length > 0 && (
              <div className="mt-4 rounded-lg border border-borderSubtle dark:border-borderStrong bg-elevated p-3">
                <div className="mb-2 text-[11px] uppercase tracking-wide text-muted">
                  Sources
                </div>
                <ol className="space-y-2.5">
                  {message.sources.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="shrink-0 font-mono text-muted">[{i + 1}]</span>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="line-clamp-1 font-medium text-blue-600 dark:text-blue-400 hover:underline pt-0.5"
                      >
                        {s.title}
                      </a>
                      <span className="shrink-0 text-xs text-muted">· {s.source}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* News cards - Structured and minimal */}
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

            {/* Feedback buttons - Subtle flat design */}
            {!isUser && !isStreaming && hasContent && (
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => {
                    setFeedback('good');
                    setFeedbackReply('Thanks for the feedback. I appreciate the effort.');
                    toast.success('Thanks for your feedback.');
                  }}
                  aria-label="Mark response as helpful"
                  aria-pressed={feedback === 'good'}
                    className={cn(
                      'flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors',
                      feedback === 'good'
                        ? 'bg-accent-brand text-dark-950'
                        : 'text-secondary hover:bg-elevated hover:text-primary'
                    )}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    setFeedback('poor');
                    setFeedbackReply('Thanks for the feedback. I will improve the next response.');
                  }}
                  aria-label="Mark response as unhelpful"
                  aria-pressed={feedback === 'poor'}
                    className={cn(
                      'flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors',
                      feedback === 'poor'
                        ? 'bg-red-600 text-white'
                        : 'text-secondary hover:bg-elevated hover:text-primary'
                    )}
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                </button>
                <div className="ml-2 border-l border-gray-200 dark:border-dark-800 pl-2">
                  <CopyButton content={normalizedContent} />
                </div>
                <div className="border-l border-gray-200 dark:border-dark-800 pl-2">
                  <ShareButton
                    content={normalizedContent}
                    messageId={message.id}
                    conversationId={message.conversation_id}
                  />
                </div>
              </div>
            )}
            {!isUser && !isStreaming && feedbackReply && (
              <p className="mt-2 text-xs text-muted">{feedbackReply}</p>
            )}

            {/* Confidence badge */}
            {!isUser && !isStreaming && confidence && (
              <ConfidenceBadge
                score={confidence.score}
                label={confidence.label}
                reliabilityScore={confidence.reliabilityScore}
                reasoning={confidence.reasoning}
              />
            )}

          </div>
        </div>
      )}
    </motion.div>
  );
}
