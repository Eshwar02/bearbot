'use client';

/**
 * AI Prompt Box — adapted for AlphaSight from the shadcn community snippet.
 *
 * Differences from upstream:
 *   - Controlled `value`/`onChange` so chat-panel state stays single-source.
 *   - Theme-aware: uses CSS-var tokens (canvas, elevated, borderSubtle, …)
 *     so it repaints across light / dark / sandal / blue themes.
 *   - SSR-safe: no `document.head` mutation at module top level.
 *   - Adds `webSearchEnabled` + `attachments` props expected by chat-panel.
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  ArrowUp,
  Paperclip,
  Square,
  X,
  StopCircle,
  Mic,
  Globe,
  BrainCog,
  FolderCode,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ── Textarea ────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        'flex w-full rounded-md border-none bg-transparent px-3 py-2.5 text-base text-primary placeholder:text-muted focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] resize-none',
        className,
      )}
      ref={ref}
      rows={1}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

// ── Tooltip ─────────────────────────────────────────────────────────
const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'z-50 overflow-hidden rounded-md border border-borderSubtle bg-elevated px-3 py-1.5 text-xs text-primary shadow-md',
      className,
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// ── Dialog (used for image preview) ─────────────────────────────────
const Dialog = DialogPrimitive.Root;
const DialogPortal = DialogPrimitive.Portal;
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn('fixed inset-0 z-50 bg-black/60 backdrop-blur-sm', className)}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-[90vw] md:max-w-[800px] translate-x-[-50%] translate-y-[-50%] gap-4 border border-borderSubtle bg-canvas p-0 shadow-xl rounded-2xl',
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 z-10 rounded-full bg-elevated/80 p-2 hover:bg-elevated transition-all">
        <X className="h-5 w-5 text-secondary hover:text-primary" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight text-primary', className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

// ── Button ───────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variantClasses = {
      default: 'bg-primary hover:bg-primary/80 text-inverse',
      outline: 'border border-borderSubtle bg-transparent hover:bg-elevated',
      ghost: 'bg-transparent hover:bg-elevated',
    } as const;
    const sizeClasses = {
      default: 'h-10 px-4 py-2',
      sm: 'h-8 px-3 text-sm',
      lg: 'h-12 px-6',
      icon: 'h-8 w-8 rounded-full aspect-square',
    } as const;
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

// ── VoiceRecorder ───────────────────────────────────────────────────
interface VoiceRecorderProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: (duration: number) => void;
  visualizerBars?: number;
}
const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  visualizerBars = 32,
}) => {
  const [time, setTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRecording) {
      onStartRecording();
      timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      onStopRecording(time);
      setTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center w-full transition-all duration-300 py-3',
        isRecording ? 'opacity-100' : 'opacity-0 h-0',
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="h-2 w-2 rounded-full bg-accent-red animate-pulse" />
        <span className="font-mono text-sm text-primary/80">{formatTime(time)}</span>
      </div>
      <div className="w-full h-10 flex items-center justify-center gap-0.5 px-4">
        {[...Array(visualizerBars)].map((_, i) => (
          <div
            key={i}
            className="w-0.5 rounded-full bg-primary/40 animate-pulse"
            style={{
              height: `${Math.max(15, Math.random() * 100)}%`,
              animationDelay: `${i * 0.05}s`,
              animationDuration: `${0.5 + Math.random() * 0.5}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

// ── Image preview dialog ────────────────────────────────────────────
const ImageViewDialog: React.FC<{ imageUrl: string | null; onClose: () => void }> = ({
  imageUrl,
  onClose,
}) => {
  if (!imageUrl) return null;
  return (
    <Dialog open={!!imageUrl} onOpenChange={onClose}>
      <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-[90vw] md:max-w-[800px]">
        <DialogTitle className="sr-only">Image Preview</DialogTitle>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative bg-canvas rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Full preview"
            className="w-full max-h-[80vh] object-contain rounded-2xl"
          />
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

// ── Custom divider between mode pills ───────────────────────────────
const CustomDivider: React.FC = () => (
  <div className="relative h-6 w-[1.5px] mx-1">
    <div
      className="absolute inset-0 bg-gradient-to-t from-transparent via-accent-brand/60 to-transparent rounded-full"
      style={{
        clipPath:
          'polygon(0% 0%, 100% 0%, 100% 40%, 140% 50%, 100% 60%, 100% 100%, 0% 100%, 0% 60%, -40% 50%, 0% 40%)',
      }}
    />
  </div>
);

// ── Public component ────────────────────────────────────────────────
export interface PromptInputBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void | Promise<void>;
  onStop?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  webSearchEnabled?: boolean;
  onWebSearchToggle?: (next: boolean) => void;
  attachments?: File[];
  onAttachmentsChange?: (attachments: File[]) => void;
  onAttachmentRemove?: (index: number) => void;
  /** Optional secondary mode toggles. Default: enabled. */
  enableThinkMode?: boolean;
  enableCanvasMode?: boolean;
}

export const PromptInputBox = forwardRef<HTMLDivElement, PromptInputBoxProps>(
  function PromptInputBox(
    {
      value,
      onChange,
      onSend,
      onStop,
      isStreaming = false,
      disabled = false,
      placeholder = 'Type your message here...',
      className,
      webSearchEnabled = false,
      onWebSearchToggle,
      attachments = [],
      onAttachmentsChange,
      onAttachmentRemove,
      enableThinkMode = true,
      enableCanvasMode = true,
    },
    ref,
  ) {
    const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [showThink, setShowThink] = useState(false);
    const [showCanvas, setShowCanvas] = useState(false);

    const uploadInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const showSearch = !!webSearchEnabled;

    // Auto-resize textarea.
    useEffect(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 240)}px`;
    }, [value]);

    // Build previews for image attachments.
    useEffect(() => {
      const imageAttachments = attachments.filter((f) => f.type.startsWith('image/'));
      const next: Record<string, string> = {};
      let cancelled = false;
      Promise.all(
        imageAttachments.map(
          (file) =>
            new Promise<void>((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                next[`${file.name}:${file.size}`] = e.target?.result as string;
                resolve();
              };
              reader.onerror = () => resolve();
              reader.readAsDataURL(file);
            }),
        ),
      ).then(() => {
        if (!cancelled) setFilePreviews(next);
      });
      return () => {
        cancelled = true;
      };
    }, [attachments]);

    const isImageFile = (file: File) => file.type.startsWith('image/');

    const processFile = useCallback(
      (file: File) => {
        if (!isImageFile(file)) return;
        if (file.size > 10 * 1024 * 1024) return;
        toast.info('File attachments are in development right now.');
      },
      [],
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    }, []);

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const dropped = Array.from(e.dataTransfer.files).filter(isImageFile);
        dropped.forEach(processFile);
      },
      [processFile],
    );

    const handleRemoveFile = (index: number) => {
      if (onAttachmentRemove) {
        onAttachmentRemove(index);
      } else if (onAttachmentsChange) {
        onAttachmentsChange(attachments.filter((_, i) => i !== index));
      }
    };

    const openImageModal = (imageUrl: string) => setSelectedImage(imageUrl);

    // Paste image from clipboard.
    useEffect(() => {
      const onPaste = (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              e.preventDefault();
              processFile(file);
              break;
            }
          }
        }
      };
      document.addEventListener('paste', onPaste);
      return () => document.removeEventListener('paste', onPaste);
    }, [processFile]);

    const handleSubmit = () => {
      if (disabled || isStreaming) return;
      if (value.trim() || attachments.length > 0) {
        void onSend();
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    };

    const handleStartRecording = () => {
      // Stub — wire to actual recorder when ready.
    };
    const handleStopRecording = (_duration: number) => {
      setIsRecording(false);
    };

    const hasContent = value.trim() !== '' || attachments.length > 0;

    return (
      <TooltipProvider delayDuration={150}>
        <div
          ref={ref}
          className={cn(
            'rounded-3xl border border-borderSubtle bg-elevated p-2 shadow-md transition-all duration-300',
            isRecording && 'border-accent-red/70',
            isStreaming && 'border-accent-brand/60',
            className,
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Attachment previews */}
          {attachments.length > 0 && !isRecording && (
            <div className="flex flex-wrap gap-2 p-0 pb-1 transition-all duration-300">
              {attachments.map((file, index) => {
                const key = `${file.name}:${file.size}`;
                const preview = filePreviews[key];
                if (!file.type.startsWith('image/') || !preview) return null;
                return (
                  <div key={key + index} className="relative group">
                    <div
                      className="w-16 h-16 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border border-borderSubtle"
                      onClick={() => openImageModal(preview)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preview}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(index);
                        }}
                        className="absolute top-1 right-1 rounded-full bg-black/70 p-0.5 opacity-100 transition-opacity"
                        aria-label="Remove attachment"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Text area */}
          <div
            className={cn(
              'transition-all duration-300',
              isRecording ? 'h-0 overflow-hidden opacity-0' : 'opacity-100',
            )}
          >
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                showSearch
                  ? 'Search the web…'
                  : showThink
                    ? 'Think deeply…'
                    : showCanvas
                      ? 'Create on canvas…'
                      : placeholder
              }
              disabled={disabled || isStreaming}
              className="text-base"
            />
          </div>

          {/* Recorder */}
          {isRecording && (
            <VoiceRecorder
              isRecording={isRecording}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
            />
          )}

          {/* Action row */}
          <div className="flex items-center justify-between gap-2 p-0 pt-2">
            <div
              className={cn(
                'flex items-center gap-1 transition-opacity duration-300',
                isRecording ? 'opacity-0 invisible h-0' : 'opacity-100 visible',
              )}
            >
              {/* Attach */}
              <Tooltip>
                <TooltipTrigger asChild disabled={disabled}>
                  <button
                    type="button"
                    onClick={() => uploadInputRef.current?.click()}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-elevated-hover hover:text-primary"
                    disabled={isRecording || disabled}
                    aria-label="Attach image"
                  >
                    <Paperclip className="h-5 w-5 transition-colors" />
                    <input
                      ref={uploadInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          Array.from(e.target.files).forEach(processFile);
                        }
                        if (e.target) e.target.value = '';
                      }}
                      accept="image/*"
                      multiple
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Attachments in development</TooltipContent>
              </Tooltip>

              <div className="flex items-center">
                {/* Search (wired to webSearchEnabled) */}
                <button
                  type="button"
                  onClick={() => onWebSearchToggle?.(!showSearch)}
                  className={cn(
                    'rounded-full transition-all flex items-center gap-1 px-2 py-1 border h-8',
                    showSearch
                      ? 'bg-accent-blue/15 border-accent-blue text-accent-blue'
                      : 'bg-transparent border-transparent text-muted hover:text-primary',
                  )}
                  aria-pressed={showSearch}
                  aria-label="Toggle web search"
                >
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <motion.div
                      animate={{ rotate: showSearch ? 360 : 0, scale: showSearch ? 1.1 : 1 }}
                      whileHover={{
                        rotate: showSearch ? 360 : 15,
                        scale: 1.1,
                        transition: { type: 'spring', stiffness: 300, damping: 10 },
                      }}
                      transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                    >
                      <Globe
                        className={cn(
                          'w-4 h-4',
                          showSearch ? 'text-accent-blue' : 'text-inherit',
                        )}
                      />
                    </motion.div>
                  </div>
                  <AnimatePresence>
                    {showSearch && (
                      <motion.span
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 'auto', opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-xs overflow-hidden whitespace-nowrap flex-shrink-0"
                      >
                        Search
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>

                {enableThinkMode && (
                  <>
                    <CustomDivider />
                    <button
                      type="button"
                      onClick={() => {
                        setShowThink((p) => !p);
                        setShowCanvas(false);
                      }}
                      className={cn(
                        'rounded-full transition-all flex items-center gap-1 px-2 py-1 border h-8',
                        showThink
                          ? 'bg-accent-brand/15 border-accent-brand text-accent-brand'
                          : 'bg-transparent border-transparent text-muted hover:text-primary',
                      )}
                      aria-pressed={showThink}
                      aria-label="Toggle deep think mode"
                    >
                      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                        <motion.div
                          animate={{ rotate: showThink ? 360 : 0, scale: showThink ? 1.1 : 1 }}
                          whileHover={{
                            rotate: showThink ? 360 : 15,
                            scale: 1.1,
                            transition: { type: 'spring', stiffness: 300, damping: 10 },
                          }}
                          transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                        >
                          <BrainCog
                            className={cn(
                              'w-4 h-4',
                              showThink ? 'text-accent-brand' : 'text-inherit',
                            )}
                          />
                        </motion.div>
                      </div>
                      <AnimatePresence>
                        {showThink && (
                          <motion.span
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 'auto', opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-xs overflow-hidden whitespace-nowrap flex-shrink-0"
                          >
                            Think
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  </>
                )}

                {enableCanvasMode && (
                  <>
                    <CustomDivider />
                    <button
                      type="button"
                      onClick={() => {
                        toast.info('Canvas mode is in development right now.');
                      }}
                      className={cn(
                        'rounded-full transition-all flex items-center gap-1 px-2 py-1 border h-8',
                        showCanvas
                          ? 'bg-accent-amber/15 border-accent-amber text-accent-amber'
                          : 'bg-transparent border-transparent text-muted hover:text-primary',
                      )}
                      aria-pressed={showCanvas}
                      aria-label="Toggle canvas mode"
                    >
                      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                        <motion.div
                          animate={{ rotate: showCanvas ? 360 : 0, scale: showCanvas ? 1.1 : 1 }}
                          whileHover={{
                            rotate: showCanvas ? 360 : 15,
                            scale: 1.1,
                            transition: { type: 'spring', stiffness: 300, damping: 10 },
                          }}
                          transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                        >
                          <FolderCode
                            className={cn(
                              'w-4 h-4',
                              showCanvas ? 'text-accent-amber' : 'text-inherit',
                            )}
                          />
                        </motion.div>
                      </div>
                      <AnimatePresence>
                        {showCanvas && (
                          <motion.span
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 'auto', opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-xs overflow-hidden whitespace-nowrap flex-shrink-0"
                          >
                            Canvas
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Primary action */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="icon"
                  className={cn(
                    'h-8 w-8 rounded-full transition-all duration-200',
                    isStreaming
                      ? 'bg-elevated-hover text-primary hover:bg-elevated'
                      : isRecording
                        ? 'bg-transparent hover:bg-elevated-hover text-accent-red'
                        : hasContent
                          ? 'bg-primary text-inverse hover:bg-primary/85'
                          : 'bg-transparent hover:bg-elevated-hover text-muted hover:text-primary',
                  )}
                  onClick={() => {
                    if (isStreaming) {
                      onStop?.();
                      return;
                    }
                    if (isRecording) {
                      setIsRecording(false);
                      return;
                    }
                    if (hasContent) {
                      handleSubmit();
                      return;
                    }
                    setIsRecording(true);
                  }}
                  disabled={disabled && !isStreaming}
                  aria-label={
                    isStreaming
                      ? 'Stop generation'
                      : isRecording
                        ? 'Stop recording'
                        : hasContent
                          ? 'Send message'
                          : 'Voice message'
                  }
                >
                  {isStreaming ? (
                    <Square className="h-4 w-4 fill-current" />
                  ) : isRecording ? (
                    <StopCircle className="h-5 w-5" />
                  ) : hasContent ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {isStreaming
                  ? 'Stop generation'
                  : isRecording
                    ? 'Stop recording'
                    : hasContent
                      ? 'Send message'
                      : 'Voice message'}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <ImageViewDialog imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
      </TooltipProvider>
    );
  },
);
