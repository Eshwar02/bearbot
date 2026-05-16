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

// Futuristic Skeleton Loader
function LoadingSkeleton() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6 w-full">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4 opacity-70">
          {/* Glowing Avatar Skeleton */}
          <div className="h-8 w-8 shrink-0 rounded-xl bg-white/5 border border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full" />
          </div>
          <div className="flex-1 space-y-3 pt-1">
            {/* Animated text bars */}
            <div className="h-4 w-full max-w-[80%] rounded-lg bg-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full" />
            </div>
            <div className="h-4 w-3/4 max-w-[60%] rounded-lg bg-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full" />
            </div>
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
    // Replaced flat bg-dark-900 with the #03060D deep space theme
    <div className="relative flex h-full min-h-0 flex-col bg-[#03060D] overflow-hidden">
      
      {/* Global Ambient Glows for the whole chat session */}
      {hasMessages && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/5 blur-[150px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] bg-teal-500/5 blur-[150px] rounded-full mix-blend-screen" />
        </div>
      )}

      {/* Main Scrollable Area */}
      <div
        ref={scrollRef}
        className={cn(
          'min-h-0 flex-1 overflow-y-auto relative z-10 scroll-smooth',
          'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20',
        )}
      >
        {isLoadingConversation ? (
          <LoadingSkeleton />
        ) : hasMessages ? (
          <div className="pb-32 pt-6 max-w-5xl mx-auto"> {/* Added extra pb to clear floating input */}
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        ) : (
          <WelcomeScreen onSendPrompt={sendMessage} />
        )}
      </div>

      {/* Composer Area - Upgraded to a floating Frosted Glass Dock */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#03060D] via-[#03060D]/90 to-transparent pt-10 pb-6 px-4 sm:px-6 z-20">
        <div className="mx-auto max-w-4xl relative">
          
          {/* Your Gradient input component handles its own internal styling, but the wrapper makes it float beautifully */}
          <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] p-2">
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
          </div>

          <p className="mt-3 text-center text-xs text-gray-500 tracking-wide font-medium">
            AlphaSight can make mistakes. Verify critical financial decisions.
          </p>
        </div>
      </div>
    </div>
  );
}