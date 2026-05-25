'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '@/stores/app-store';
import { RESPONSE_GENERATED_EVENT, useChat } from '@/lib/hooks/use-chat';
import { ChatMessage } from './chat-message';
import { WelcomeScreen } from './welcome-screen';
import { PromptInputBox } from '@/components/ui/ai-prompt-box';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Clean, standard productivity skeleton loader
function LoadingSkeleton() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 w-full animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4">
          <div className="h-6 w-6 shrink-0 rounded bg-skeleton" />
          <div className="flex-1 space-y-2.5">
            <div className="h-3 w-full rounded bg-skeleton/70" />
            <div className="h-3 w-3/4 rounded bg-skeleton/50" />
          </div>
        </div>
      ))}
    </div>
  );
}

function GenerationMarker() {
  return (
    <div
      className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-borderStrong bg-elevated/95 px-3 py-2 shadow-lg backdrop-blur"
      role="status"
      aria-live="polite"
      aria-label="Response is generating"
    >
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary [animation-delay:160ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary [animation-delay:320ms]" />
      </div>
    </div>
  );
}

export function ChatPanel() {
  const { messages, isLoadingConversation, isStreaming } = useAppStore();
  const { sendMessage, stopStreaming } = useChat();

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const [draft, setDraft] = useState('');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isLastLineVisible, setIsLastLineVisible] = useState(true);

  const hasMessages = messages.length > 0;

  const updateBottomVisibility = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const distanceToBottom = container.scrollHeight - (container.scrollTop + container.clientHeight);
    const lastLineVisible = distanceToBottom <= 24;
    stickToBottomRef.current = lastLineVisible;
    setIsLastLineVisible(lastLineVisible);
  }, []);

  const scrollToBottom = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
      updateBottomVisibility();
    });
  }, [updateBottomVisibility]);

  useEffect(() => {
    if (bottomRef.current && scrollRef.current) scrollToBottom();
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    if (isStreaming && stickToBottomRef.current) {
      scrollToBottom();
    } else {
      updateBottomVisibility();
    }
  }, [isStreaming, messages, scrollToBottom, updateBottomVisibility]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const onScroll = () => updateBottomVisibility();
    const onResize = () => updateBottomVisibility();

    container.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    updateBottomVisibility();

    return () => {
      container.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [updateBottomVisibility]);

  useEffect(() => {
    const onResponseGenerated = () => {
      const container = scrollRef.current;
      if (!container) return;

      const distanceToBottom = container.scrollHeight - (container.scrollTop + container.clientHeight);
      const isNearTop = container.scrollTop <= Math.max(100, container.clientHeight * 0.2);
      const responseWayDown = distanceToBottom > container.clientHeight * 1.5;

      if (isNearTop && responseWayDown) {
        toast.success('Response generated successfully.', {
          description: 'A completed response is ready below.',
          action: {
            label: 'Go to latest',
            onClick: () => scrollToBottom(),
          },
        });
      }
    };

    window.addEventListener(RESPONSE_GENERATED_EVENT, onResponseGenerated);
    return () => window.removeEventListener(RESPONSE_GENERATED_EVENT, onResponseGenerated);
  }, [scrollToBottom]);

  const handleSend = useCallback(async () => {
    const content = draft.trim();
    if (isStreaming || (!content && attachments.length === 0)) return;
    const sent = await sendMessage(content, {
      forceWebSearch: webSearchEnabled,
      attachments,
    });
    if (sent) {
      setDraft('');
      setWebSearchEnabled(false);
      setAttachments([]);
    }
  }, [attachments, draft, isStreaming, sendMessage, webSearchEnabled]);

  const handleAttachmentRemove = useCallback((index: number) => {
    setAttachments((current) => current.filter((_, i) => i !== index));
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">


      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          className={cn(
            'h-full overflow-y-auto',
            'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-borderStrong',
          )}
        >
          {isLoadingConversation ? (
            <LoadingSkeleton />
          ) : hasMessages ? (
            <div className="mx-auto max-w-3xl px-4 pb-36 pt-6 sm:px-6">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              <div ref={bottomRef} />
            </div>
          ) : (
            <WelcomeScreen />
          )}
        </div>
        {isStreaming && !isLastLineVisible && <GenerationMarker />}
      </div>

      {/* Composer */}
      <div className="bg-canvas px-4 pb-5 pt-2 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <PromptInputBox
            value={draft}
            onChange={setDraft}
            onSend={handleSend}
            onStop={stopStreaming}
            isStreaming={isStreaming}
            placeholder="Ask about any stock, market, or portfolio…"
            webSearchEnabled={webSearchEnabled}
            onWebSearchToggle={setWebSearchEnabled}
            attachments={attachments}
            onAttachmentsChange={setAttachments}
            onAttachmentRemove={handleAttachmentRemove}
          />
          <p className="mt-2 text-center text-[11px] text-muted">
            AlphaSight can make mistakes. Verify critical financial decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
