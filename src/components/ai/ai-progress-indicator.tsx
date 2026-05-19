'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAIProgressStore } from '@/stores/ai-progress-store';
import { AIProgressLine } from './ai-progress-line';
import { AIProgressCollapsed } from './ai-progress-collapsed';
import { AIProgressExpanded } from './ai-progress-expanded';

const FIXED_HEIGHT = 280;
const COLLAPSED_HEIGHT = 44;
const FIXED_WIDTH = 270;

export function AIProgressIndicator() {
  const {
    activeTask,
    completedTasks,
    searchSources,
    lastSourceDomain,
    isExpanded,
    setExpanded,
    scheduleAutoCollapse,
    cancelAutoCollapse,
  } = useAIProgressStore();
  const [mounted, setMounted] = useState(false);
  const [rotationIndex, setRotationIndex] = useState(0);
  const [collapsedFade, setCollapsedFade] = useState(true);

  useEffect(() => { setMounted(true); }, []);

  const hasActivity = completedTasks.length > 0 || searchSources.length > 0 || Boolean(activeTask);

  const collapsedMessages = useMemo(() => {
    const items: string[] = [];
    if (activeTask) {
      items.push(activeTask.name.endsWith('...') ? activeTask.name : `${activeTask.name}...`);
    }
    if (searchSources.length > 0) {
      for (const source of searchSources.slice(-4)) {
        items.push(`Checking ${source.domain}...`);
      }
    } else if (lastSourceDomain) {
      items.push(`Checking ${lastSourceDomain}...`);
    }
    if (items.length === 0 && completedTasks.length > 0) {
      items.push('Finalizing response...');
    }
    if (items.length === 0) {
      items.push('AI context ready for this chat...');
    }
    return [...new Set(items)];
  }, [activeTask, completedTasks.length, lastSourceDomain, searchSources]);

  useEffect(() => {
    setRotationIndex(0);
  }, [collapsedMessages]);

  useEffect(() => {
    if (collapsedMessages.length < 2) return;
    const timer = setInterval(() => {
      setCollapsedFade(false);
      setTimeout(() => {
        setRotationIndex((idx) => (idx + 1) % collapsedMessages.length);
        setCollapsedFade(true);
      }, 180);
    }, 2400);
    return () => clearInterval(timer);
  }, [collapsedMessages]);

  if (!mounted) return null;
  if (!hasActivity && !activeTask) return null;

  const showExpanded = isExpanded;
  const collapsedText = collapsedMessages[rotationIndex % collapsedMessages.length];

  return (
    <div
      className="fixed bottom-20 right-4 z-40 md:bottom-24 md:right-6 print:hidden"
      onMouseEnter={() => { cancelAutoCollapse(); setExpanded(true); }}
      onMouseLeave={() => { setExpanded(false); if (activeTask) scheduleAutoCollapse(); }}
      onClick={() => setExpanded(!isExpanded)}
      role="region"
      aria-live="polite"
      aria-label="AI processing status"
    >
      <div
        className="relative cursor-pointer overflow-hidden rounded-xl backdrop-blur-xl transition-all duration-300 ease-out font-mono"
        style={{
          background: 'var(--progress-bg)',
          border: '1px solid var(--progress-border)',
          boxShadow: 'var(--progress-shadow)',
          height: showExpanded ? FIXED_HEIGHT : COLLAPSED_HEIGHT,
          width: FIXED_WIDTH,
          transform: showExpanded ? 'scale(1)' : 'scale(0.98)',
        }}
      >
        <AIProgressLine />
        <div className="relative h-full overflow-hidden">
          {showExpanded ? (
            <div className="animate-in fade-in duration-200">
              <AIProgressExpanded
                tasks={completedTasks}
                activeTask={activeTask}
                sources={searchSources}
                lastSourceDomain={lastSourceDomain}
              />
            </div>
          ) : (
            <div
              className="animate-in fade-in duration-200 transition-opacity duration-200 ease-out"
              style={{ opacity: collapsedFade ? 1 : 0.2 }}
            >
              <AIProgressCollapsed text={collapsedText} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
