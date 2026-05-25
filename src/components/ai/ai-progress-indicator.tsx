'use client';

import { useMemo } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Loader2 } from 'lucide-react';
import { useAIProgressStore } from '@/stores/ai-progress-store';

export function AIProgressIndicator() {
  const {
    activeTask,
    completedTasks,
    searchSources,
    isExpanded,
    setExpanded,
    progressPercentage,
  } = useAIProgressStore();

  const statusText = useMemo(() => {
    if (activeTask?.name) return activeTask.name;
    if (progressPercentage < 100) return 'Working on your response';
    if (searchSources.length > 0) return `Response ready • ${searchSources.length} source${searchSources.length === 1 ? '' : 's'}`;
    return 'Response ready';
  }, [activeTask?.name, progressPercentage, searchSources.length]);

  const hasActivity = completedTasks.length > 0 || searchSources.length > 0 || Boolean(activeTask);
  if (!hasActivity) return null;

  const showSourcesToggle = searchSources.length > 0 && !activeTask;

  return (
    <div
      className="mb-4 rounded-xl border border-borderSubtle bg-canvas px-4 py-3"
      role="region"
      aria-live="polite"
      aria-label="Search progress"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-2 text-sm text-primary">
          {activeTask ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent-brand" />
          ) : (
            <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
          )}
          <span className="truncate">{statusText}</span>
        </div>
        {showSourcesToggle && (
          <button
            type="button"
            onClick={() => setExpanded(!isExpanded)}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-secondary transition-colors hover:text-primary"
            aria-expanded={isExpanded}
          >
            View sources ({searchSources.length})
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
      {isExpanded && showSourcesToggle && (
        <div className="mt-3 space-y-1.5 border-t border-borderSubtle pt-3">
          {searchSources.map((source) => (
            <a
              key={`${source.domain}-${source.timestamp}`}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-elevated"
            >
              <span className="truncate text-primary">{source.title || source.domain}</span>
              <span className="shrink-0 text-xs text-muted">· {source.domain}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted group-hover:text-primary" />
            </a>
          ))}
        </div>
      )}
      {!activeTask && !showSourcesToggle && completedTasks.length > 0 && (
        <div className="mt-2 text-xs text-muted">No web sources were used for this response.</div>
      )}
    </div>
  );
}
