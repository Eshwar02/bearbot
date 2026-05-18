'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useChat } from '@/lib/hooks/use-chat';
import { ChatMessage } from './chat-message';
import { WelcomeScreen } from './welcome-screen';
import { GradientAIChatInput, type ModelOption } from '@/components/ui/gradient-ai-chat-input';
import { cn } from '@/lib/utils';

const MODEL_OPTIONS: ModelOption[] = [
  {
    id: 'mistral',
    label: 'Mistral',
    value: 'mistral',
    description: 'Primary — large free tier',
  },
];

// Clean, standard productivity skeleton loader
function LoadingSkeleton() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 w-full animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4">
          {/* Simple Circular Avatar Skeleton */}
          <div className="h-8 w-8 shrink-0 rounded-full bg-gray-200 dark:bg-dark-800" />
          <div className="flex-1 space-y-3 pt-1">
            {/* Simple text bars */}
            <div className="h-4 w-full max-w-[80%] rounded bg-gray-200 dark:bg-dark-800" />
            <div className="h-4 w-3/4 max-w-[60%] rounded bg-gray-200 dark:bg-dark-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatPanel() {
  const { messages, isLoadingConversation, isStreaming, preferredModel, setPreferredModel } = useAppStore();
  const { sendMessage, stopStreaming } = useChat();

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);

  const hasMessages = messages.length > 0;

  const selectedModel = useMemo(
    () => MODEL_OPTIONS.find((m) => m.value === preferredModel) ?? MODEL_OPTIONS[0],
    [preferredModel],
  );

  useEffect(() => {
    if (bottomRef.current && scrollRef.current) {
      const scrollContainer = scrollRef.current;
      requestAnimationFrame(() => {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      });
    }
  }, [messages.length]);

  const lastMessage = messages[messages.length - 1];
  const streamingContent = lastMessage?.isStreaming ? lastMessage.content.length : 0;
  useEffect(() => {
    if (streamingContent > 0 && scrollRef.current) {
      const scrollContainer = scrollRef.current;
      requestAnimationFrame(() => {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      });
    }
  }, [streamingContent]);

  const handleSend = useCallback(() => {
    const content = draft.trim();
    if (!content || isStreaming) return;
    sendMessage(content, { forceWebSearch: webSearchEnabled });
    setDraft('');
    setWebSearchEnabled(false);
  }, [draft, isStreaming, sendMessage, webSearchEnabled]);

  const handleStop = useCallback(() => {
    stopStreaming();
    setTimeout(() => {}, 100);
  }, [stopStreaming]);

  return (
    // Clean, flat background respecting light/dark mode
    <div className="relative flex h-full min-h-0 flex-col bg-white dark:bg-dark-900 overflow-hidden">
      
      {/* Main Scrollable Area */}
      <div
        ref={scrollRef}
        className={cn(
          'min-h-0 flex-1 overflow-y-auto relative z-10 scroll-smooth',
          'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200 dark:scrollbar-thumb-dark-700',
        )}
      >
        {isLoadingConversation ? (
          <LoadingSkeleton />
        ) : hasMessages ? (
          // Constrained to max-w-3xl for optimal reading width
          <div className="pb-36 pt-6 max-w-3xl mx-auto px-4 sm:px-6"> 
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        ) : (
          <WelcomeScreen onSendPrompt={sendMessage} />
        )}
      </div>

      {/* Composer Area - Anchored flat gradient fade (ChatGPT style) */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white to-transparent dark:from-dark-900 dark:via-dark-900 pt-12 pb-6 px-4 sm:px-6 z-20">
        <div className="mx-auto max-w-3xl relative">
          
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
          />

          <p className="mt-3 text-center text-xs text-gray-500 dark:text-dark-400">
            AlphaSight can make mistakes. Verify critical financial decisions.
          </p>
        </div>
      </div>
    </div>
  );
}