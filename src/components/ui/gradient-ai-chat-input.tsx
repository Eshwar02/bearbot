'use client';

/**
 * Gradient AI chat input — adapted from the shadcn snippet for AlphaSight.
 * Theme-aware: uses CSS variables for light/dark mode.
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { ArrowUp, Square, ChevronDown, Check, Globe, Paperclip, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModelOption {
  id: string;
  label: string;
  value: string;
  description?: string;
}

interface GradientAIChatInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void | Promise<void>;
  onStop?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
  modelOptions?: ModelOption[];
  selectedModel?: ModelOption | null;
  onModelSelect?: (option: ModelOption) => void;
  enableAnimations?: boolean;
  className?: string;
  webSearchEnabled?: boolean;
  onWebSearchToggle?: (next: boolean) => void;
  attachments?: File[];
  onAttachmentsChange?: (attachments: File[]) => void;
  onAttachmentRemove?: (index: number) => void;
}

const MAIN_GRADIENT = {
  topLeft: '#0e7490',
  topRight: '#0d9488',
  bottomRight: '#115e59',
  bottomLeft: '#1e3a8a',
};

const OUTER_GRADIENT = {
  topLeft: '#083344',
  topRight: '#042f2e',
  bottomRight: '#022c22',
  bottomLeft: '#172554',
};

const SHADOW_COLOR = 'rgb(20, 184, 166)';

function hexToRgba(color: string, alpha: number): string {
  if (color.startsWith('rgb(')) {
    const parts = color.slice(4, -1).split(',').map((v) => parseInt(v.trim(), 10));
    return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
  }
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}

export function GradientAIChatInput({
  placeholder = 'Send a message...',
  value,
  onChange,
  onSend,
  onStop,
  isStreaming = false,
  disabled = false,
  modelOptions = [],
  selectedModel,
  onModelSelect,
  enableAnimations = true,
  className,
  webSearchEnabled = false,
  onWebSearchToggle,
  attachments = [],
  onAttachmentsChange,
  onAttachmentRemove,
}: GradientAIChatInputProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = enableAnimations && !shouldReduceMotion;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasText = value.trim().length > 0;
  const showDropdown = modelOptions.length > 0;
  const hasAttachments = attachments.length > 0;
  const canSend = hasText || hasAttachments;
  const supportedTypes =
    'image/*,.txt,.md,.csv,.tsv,.json,.xml,.html,.htm,.yaml,.yml,.xlsx,.xls';

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isDropdownOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (canSend && !isStreaming && !disabled) {
          onSend();
        }
      }
    },
    [canSend, isStreaming, disabled, onSend],
  );

  const handleFileSelection = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(event.target.files ?? []);
      if (selected.length === 0) return;
      const merged = [...attachments, ...selected].filter(
        (file, index, list) =>
          list.findIndex(
            (candidate) =>
              candidate.name === file.name &&
              candidate.size === file.size &&
              candidate.lastModified === file.lastModified,
          ) === index,
      );
      onAttachmentsChange?.(merged.slice(0, 5));
      event.target.value = '';
    },
    [attachments, onAttachmentsChange],
  );

  const idleBorder = 'rgba(200, 200, 200, 0.5)';

  return (
    <motion.div
      className={cn('relative', className)}
      initial={shouldAnimate ? { opacity: 0, y: 12 } : {}}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
    >
      <div className="relative">
        <div
          className="absolute inset-0 rounded-[20px] p-[0.5px] transition-opacity duration-200"
          style={{
            background: isFocused
              ? `conic-gradient(from 0deg at 50% 50%,
                  ${OUTER_GRADIENT.topLeft} 0deg,
                  ${OUTER_GRADIENT.topRight} 90deg,
                  ${OUTER_GRADIENT.bottomRight} 180deg,
                  ${OUTER_GRADIENT.bottomLeft} 270deg,
                  ${OUTER_GRADIENT.topLeft} 360deg)`
              : idleBorder,
          }}
        >
          <div
            className="h-full w-full rounded-[19.5px] p-[1.5px] transition-opacity duration-200"
            style={{
              background: isFocused
                ? `conic-gradient(from 0deg at 50% 50%,
                    ${MAIN_GRADIENT.topLeft} 0deg,
                    ${MAIN_GRADIENT.topRight} 90deg,
                    ${MAIN_GRADIENT.bottomRight} 180deg,
                    ${MAIN_GRADIENT.bottomLeft} 270deg,
                    ${MAIN_GRADIENT.topLeft} 360deg)`
                : 'transparent',
            }}
          >
            <div className="relative h-full w-full rounded-[17.5px] bg-input">
              {isFocused && (
                <div
                  className="absolute inset-0 rounded-[17.5px] p-[0.5px]"
                  style={{
                    background: `conic-gradient(from 0deg at 50% 50%,
                      ${hexToRgba(OUTER_GRADIENT.topLeft, 0.1)} 0deg,
                      ${hexToRgba(OUTER_GRADIENT.topRight, 0.1)} 90deg,
                      ${hexToRgba(OUTER_GRADIENT.bottomRight, 0.1)} 180deg,
                      ${hexToRgba(OUTER_GRADIENT.bottomLeft, 0.1)} 270deg,
                      ${hexToRgba(OUTER_GRADIENT.topLeft, 0.1)} 360deg)`,
                  }}
                >
                  <div className="h-full w-full rounded-[17px] bg-input" />
                </div>
              )}
              {!isFocused && (
                <div className="h-full w-full rounded-[17px] bg-input" />
              )}

              {isFocused && (
                <>
                  <div
                    className="absolute left-4 right-4 top-0 h-[0.5px]"
                    style={{
                      background: `linear-gradient(to right, transparent, ${hexToRgba(MAIN_GRADIENT.topLeft, 0.4)}, transparent)`,
                    }}
                  />
                  <div
                    className="absolute bottom-0 left-4 right-4 h-[0.5px]"
                    style={{
                      background: `linear-gradient(to right, transparent, ${hexToRgba(MAIN_GRADIENT.bottomRight, 0.25)}, transparent)`,
                    }}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="relative px-4 pb-3 pt-3.5">
          <div className="mb-2 flex items-start gap-3">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className={cn(
                'flex-1 resize-none border-0 bg-transparent px-0 py-1.5',
                'text-[15px] leading-6 text-primary placeholder:text-muted',
                'outline-none focus:outline-none focus:ring-0',
                'scrollbar-thin scrollbar-thumb-borderStrong',
                disabled && 'cursor-not-allowed opacity-50',
              )}
              style={{ minHeight: 28, maxHeight: 160 }}
            />

            {isStreaming ? (
              <motion.button
                type="button"
                onClick={onStop}
                className={cn(
                  'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                  'bg-elevated text-secondary transition-colors hover:bg-elevated-hover',
                )}
                whileHover={shouldAnimate ? { scale: 1.05 } : {}}
                whileTap={shouldAnimate ? { scale: 0.95 } : {}}
                aria-label="Stop generating"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </motion.button>
            ) : (
              <div className="flex shrink-0 items-center gap-2">
                <motion.button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || isStreaming || attachments.length >= 5}
                  className={cn(
                    'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border',
                    'border-borderSubtle bg-elevated text-secondary transition-colors hover:bg-elevated-hover hover:text-primary',
                    (disabled || isStreaming || attachments.length >= 5) && 'cursor-not-allowed opacity-50',
                  )}
                  whileHover={shouldAnimate && !disabled && !isStreaming && attachments.length < 5 ? { scale: 1.05 } : {}}
                  whileTap={shouldAnimate && !disabled && !isStreaming && attachments.length < 5 ? { scale: 0.95 } : {}}
                  aria-label="Attach files"
                >
                  <Paperclip className="h-4 w-4" />
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => canSend && !disabled && onSend()}
                  disabled={!canSend || disabled}
                  className={cn(
                    'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                    'transition-all duration-200',
                    canSend && !disabled
                      ? 'bg-accent-brand text-dark-950 shadow-[0_0_0_1px_rgba(20,184,166,0.4)] hover:bg-accent-brand-hover'
                      : 'cursor-not-allowed bg-elevated text-muted',
                  )}
                  whileHover={shouldAnimate && canSend && !disabled ? { scale: 1.05 } : {}}
                  whileTap={shouldAnimate && canSend && !disabled ? { scale: 0.92 } : {}}
                  aria-label="Send message"
                >
                  <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
                </motion.button>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={supportedTypes}
            className="hidden"
            onChange={handleFileSelection}
          />

          {hasAttachments && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div
                  key={`${file.name}-${file.lastModified}-${file.size}`}
                  className="flex items-center gap-2 rounded-full border border-borderSubtle bg-elevated px-3 py-1 text-xs text-secondary"
                >
                  {file.type.startsWith('image/') ? (
                    <ImageIcon className="h-3 w-3 text-muted" />
                  ) : (
                    <Paperclip className="h-3 w-3 text-muted" />
                  )}
                  <span className="max-w-[180px] truncate">{file.name}</span>
                  <span className="text-muted">{Math.max(1, Math.round(file.size / 1024))} KB</span>
                  {onAttachmentRemove && (
                    <button
                      type="button"
                      onClick={() => onAttachmentRemove(index)}
                      className="rounded-full p-0.5 text-muted transition-colors hover:bg-elevated-hover hover:text-primary"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {(showDropdown || onWebSearchToggle) && (
            <div className="flex items-center gap-2">
              {onWebSearchToggle && (
                <motion.button
                  type="button"
                  onClick={() => onWebSearchToggle(!webSearchEnabled)}
                  disabled={disabled}
                  title={
                    webSearchEnabled
                      ? 'Web search ON for this turn'
                      : 'Click to search the web for this question'
                  }
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-3 py-1',
                    'text-xs font-medium transition-colors border',
                    webSearchEnabled
                      ? 'bg-accent-brand/15 text-accent-brand border-accent-brand/40 shadow-[0_0_0_1px_rgba(20,184,166,0.25)]'
                      : 'bg-elevated text-secondary border-borderSubtle hover:bg-elevated-hover hover:text-primary',
                    disabled && 'cursor-not-allowed opacity-50',
                  )}
                  whileHover={shouldAnimate && !disabled ? { scale: 1.02 } : {}}
                  whileTap={shouldAnimate && !disabled ? { scale: 0.98 } : {}}
                  aria-pressed={webSearchEnabled}
                  aria-label="Toggle web search"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>Search</span>
                  {webSearchEnabled && (
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-brand" />
                  )}
                </motion.button>
              )}
            </div>
          )}

          {showDropdown && (
            <div className="mt-2 flex items-center gap-2">
              <div className="relative" ref={dropdownRef}>
                <motion.button
                  type="button"
                  onClick={() => setIsDropdownOpen((p) => !p)}
                  disabled={disabled}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-3 py-1',
                    'text-xs font-medium text-secondary transition-colors',
                    'bg-elevated hover:bg-elevated-hover hover:text-primary',
                    'border border-borderSubtle',
                    disabled && 'cursor-not-allowed opacity-50',
                  )}
                  whileHover={shouldAnimate ? { scale: 1.02 } : {}}
                  whileTap={shouldAnimate ? { scale: 0.98 } : {}}
                  aria-haspopup="listbox"
                  aria-expanded={isDropdownOpen}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-brand" />
                  <span>{selectedModel?.label ?? 'Model'}</span>
                  <ChevronDown
                    className={cn(
                      'h-3 w-3 transition-transform',
                      isDropdownOpen && 'rotate-180',
                    )}
                  />
                </motion.button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.96 }}
                      transition={{ duration: 0.12 }}
                      className={cn(
                        'absolute bottom-full left-0 z-20 mb-2 min-w-[200px]',
                        'rounded-xl border border-borderSubtle bg-canvas',
                        'p-1 shadow-lg',
                      )}
                      role="listbox"
                    >
                      {modelOptions.map((option) => {
                        const isSelected = selectedModel?.id === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              onModelSelect?.(option);
                              setIsDropdownOpen(false);
                            }}
                            className={cn(
                              'flex w-full items-start gap-2 rounded-lg px-2.5 py-2',
                              'text-left text-xs transition-colors',
                              'hover:bg-elevated',
                              isSelected
                                ? 'text-primary'
                                : 'text-secondary',
                            )}
                          >
                            <span
                              className={cn(
                                'mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full',
                                isSelected
                                  ? 'bg-accent-brand'
                                  : 'bg-muted',
                              )}
                            />
                            <span className="flex-1">
                              <span className="block font-medium">
                                {option.label}
                              </span>
                              {option.description && (
                                <span className="mt-0.5 block text-[11px] text-muted">
                                  {option.description}
                                </span>
                              )}
                            </span>
                            {isSelected && (
                              <Check className="mt-0.5 h-3 w-3 shrink-0 text-accent-brand" />
                            )}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <span className="text-[11px] text-muted">
                Shift + Enter for newline
              </span>
            </div>
          )}

          <div className="mt-2 text-[11px] text-muted">
            Supported: images, TXT, MD, CSV, JSON, XML, HTML, YAML, XLSX
          </div>
        </div>

        <div
          className="pointer-events-none absolute -bottom-3 left-3 right-3 h-6 rounded-full blur-md transition-opacity duration-200"
          style={{
            background: `linear-gradient(to bottom, ${hexToRgba(SHADOW_COLOR, isFocused ? 0.12 : 0)} 0%, transparent 100%)`,
            opacity: isFocused ? 1 : 0,
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 rounded-[20px] transition-shadow duration-200"
          style={{
            boxShadow: isFocused
              ? `0 10px 30px ${hexToRgba(SHADOW_COLOR, 0.08)}`
              : 'none',
          }}
        />
      </div>
    </motion.div>
  );
}
