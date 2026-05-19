'use client';

import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { AISearchSource, AITask } from '@/stores/ai-progress-store';

interface ExpandedProps {
  tasks: AITask[];
  activeTask: AITask | null;
  sources: AISearchSource[];
  lastSourceDomain: string | null;
}

export function AIProgressExpanded({ tasks, activeTask, sources, lastSourceDomain }: ExpandedProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!activeTask) return;
    const interval = setInterval(() => {
      setElapsedTime((Date.now() - activeTask.startTime) / 1000);
    }, 120);
    return () => clearInterval(interval);
  }, [activeTask]);

  const formatTime = (sec: number) => {
    if (sec < 1) return `${(sec * 1000).toFixed(0)}ms`;
    if (sec < 60) return `${sec.toFixed(1)}s`;
    const minutes = Math.floor(sec / 60);
    const secs = (sec % 60).toFixed(1);
    return `${minutes}m ${secs}s`;
  };

  const visibleSources = sources.slice(0, 8);
  const hiddenSourcesCount = Math.max(0, sources.length - visibleSources.length);

  return (
    <div className="flex h-full flex-col px-3 py-2.5 font-mono">
      {/* Tasks section — scrollable */}
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {tasks.map((task, idx) => (
          <div
            key={task.id}
            className="flex items-center justify-between gap-2 transition-opacity duration-200"
            style={{ opacity: 0.78 - Math.min(idx * 0.05, 0.2) }}
          >
            <div className="min-w-0 flex items-center gap-2">
              <span className="text-teal-400 text-[11px] font-semibold flex-shrink-0">✓</span>
              <span className="truncate text-[11px] font-medium text-white/72">{task.name}</span>
            </div>
            <span className="flex-shrink-0 tabular-nums text-[10px] text-white/40">
              {task.duration ? formatTime(task.duration) : '—'}
            </span>
          </div>
        ))}

        {activeTask && (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex items-center gap-2">
              <div className="relative flex-shrink-0">
                <div className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                <div className="absolute inset-0 h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
              </div>
              <span className="truncate text-[11px] font-medium text-white/86">{activeTask.name}</span>
            </div>
            <span className="flex-shrink-0 tabular-nums text-[10px] text-white/40">
              {formatTime(elapsedTime)}
            </span>
          </div>
        )}
      </div>

      {/* Sources section — fixed bottom area */}
      {visibleSources.length > 0 && (
        <>
          <div className="my-1.5 h-px bg-gradient-to-r from-white/5 via-white/12 to-transparent" />
          <div className="flex-shrink-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">
              Live Sources
            </div>
            <div className="space-y-1 max-h-24 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
              {visibleSources.map((source) => (
                <a
                  key={source.domain}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors hover:bg-white/5"
                  style={{ opacity: source.domain === lastSourceDomain ? 1 : 0.7 }}
                >
                  <span className="truncate text-[11px] font-medium text-teal-400/80 group-hover:text-teal-300">
                    {source.domain}
                  </span>
                  <ExternalLink className="h-2.5 w-2.5 flex-shrink-0 text-white/20 group-hover:text-white/50" />
                </a>
              ))}
              {hiddenSourcesCount > 0 && (
                <div className="text-[11px] text-white/40 px-1.5">+{hiddenSourcesCount} more</div>
              )}
            </div>
          </div>
        </>
      )}

      {!activeTask && tasks.length === 0 && visibleSources.length === 0 && (
        <div className="text-[11px] text-white/50">No search activity yet.</div>
      )}
    </div>
  );
}
