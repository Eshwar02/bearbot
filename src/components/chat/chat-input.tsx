'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, onStop, isStreaming, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState('');

  const hasText = value.trim().length > 0;

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = useCallback(() => {
    if (!hasText || isStreaming || disabled) return;
    onSend(value.trim());
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, hasText, isStreaming, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="w-full">
      <div className="mx-auto max-w-4xl">
        <div
          className={cn(
            'relative flex items-end gap-3 rounded-3xl border bg-white/[0.03] backdrop-blur-xl px-5 py-4 shadow-2xl',
            'transition-all duration-300',
            // High-end focus state: subtle glow and brighter border
            'border-white/10 focus-within:border-emerald-500/40 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_30px_rgba(16,185,129,0.15)]',
          )}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about any stock, market, or portfolio..."
            disabled={disabled}
            rows={1}
            className={cn(
              'flex-1 resize-none bg-transparent text-base text-gray-100 outline-none leading-relaxed',
              'placeholder:text-gray-500',
              'scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
            style={{ maxHeight: 200 }}
            aria-label="Chat message input"
            role="textbox"
            aria-multiline="true"
          />

          {isStreaming ? (
            <button
              onClick={onStop}
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl',
                'bg-white/10 text-emerald-400 transition-all hover:bg-white/20 hover:scale-105',
              )}
              aria-label="Stop generating"
            >
              <Square className="h-4 w-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!hasText || disabled}
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all duration-300',
                hasText && !disabled
                  // Glowing neon orb effect for the send button
                  ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-dark-900 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:scale-105'
                  : 'bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed',
              )}
              aria-label="Send message"
            >
              <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}