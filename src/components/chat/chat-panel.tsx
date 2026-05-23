'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useChat } from '@/lib/hooks/use-chat';
import { ChatMessage } from './chat-message';
import { WelcomeScreen } from './welcome-screen';
import { GradientAIChatInput } from '@/components/ui/gradient-ai-chat-input';
import { cn } from '@/lib/utils';

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
  const [draft, setDraft] = useState('');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (bottomRef.current && scrollRef.current) {
      const scrollContainer = scrollRef.current;
      requestAnimationFrame(() => {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      });
    }
  }, [messages.length]);

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
            <WelcomeScreen onSendPrompt={sendMessage} />
          )}
        </div>
        {isStreaming && <GenerationMarker />}
      </div>

      {/* Composer */}
      <div className="bg-canvas px-4 pb-5 pt-2 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <GradientAIChatInput
            value={draft}
            onChange={setDraft}
            onSend={handleSend}
            onStop={stopStreaming}
            isStreaming={isStreaming}
            placeholder="Ask about any stock, market, or portfolio…"
            modelOptions={[]}
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
