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
      <div className="mx-auto max-w-3xl">
        <div
          className={cn(
            'relative flex items-end gap-3 rounded-2xl border px-4 py-3 shadow-sm',
            'transition-colors duration-200',
            // Clean, flat design respecting light/dark mode
            'bg-white border-gray-300 dark:bg-dark-900 dark:border-dark-700',
            // Crisp, professional focus state without glows
            'focus-within:border-gray-400 dark:focus-within:border-dark-500',
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
              'flex-1 resize-none bg-transparent text-[15px] text-gray-900 dark:text-gray-100 outline-none leading-relaxed py-1',
              'placeholder:text-gray-500 dark:placeholder:text-gray-400',
              'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-dark-600',
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
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mb-0.5',
                'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-dark-800 dark:text-gray-300 dark:hover:bg-dark-700 transition-colors',
              )}
              aria-label="Stop generating"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!hasText || disabled}
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mb-0.5 transition-colors duration-200',
                hasText && !disabled
                  // Solid, professional active state (no neon gradients)
                  ? 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 shadow-sm'
                  : 'bg-gray-100 text-gray-400 dark:bg-dark-800 dark:text-dark-500 cursor-not-allowed',
              )}
              aria-label="Send message"
            >
              <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}