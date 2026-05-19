import { useRef, useCallback } from 'react';
import { type AIPhase, useAIProgressStore } from '@/stores/ai-progress-store';

const PHASE_PROGRESS: Record<AIPhase, number> = {
  planning: 10,
  searching: 35,
  analyzing: 65,
  synthesizing: 85,
  finalizing: 100,
};

export function useAIProgress() {
  const {
    beginPromptSession,
    hydrateFromChatSources,
    addTask,
    startTask,
    completeTask,
    completeActiveTask,
    setProgress,
    setPhase,
    addSearchSource,
    clearAll,
    scheduleHideAfterCompletion,
    cancelHideTimer,
  } = useAIProgressStore();
  const taskIdRef = useRef<string | null>(null);

  const beginTask = useCallback((name: string) => {
    cancelHideTimer();
    const taskId = `task-${Date.now()}-${Math.random()}`;
    taskIdRef.current = taskId;
    addTask({ id: taskId, name });
    startTask(taskId);
    return taskId;
  }, [addTask, cancelHideTimer, startTask]);

  const beginPrompt = useCallback(() => {
    beginPromptSession();
    taskIdRef.current = null;
  }, [beginPromptSession]);

  const updateProgress = useCallback((pct: number) => {
    setProgress(pct);
  }, [setProgress]);

  const endTask = useCallback(() => {
    if (taskIdRef.current) {
      completeTask(taskIdRef.current);
      taskIdRef.current = null;
    }
  }, [completeTask]);

  const startStep = useCallback((name: string, pct?: number) => {
    cancelHideTimer();
    if (taskIdRef.current) {
      completeTask(taskIdRef.current);
      taskIdRef.current = null;
    }
    const taskId = `task-${Date.now()}-${Math.random()}`;
    taskIdRef.current = taskId;
    addTask({ id: taskId, name });
    startTask(taskId);
    if (typeof pct === 'number') {
      setProgress(pct);
    }
    return taskId;
  }, [addTask, cancelHideTimer, completeTask, setProgress, startTask]);

  const updatePhase = useCallback((phase: AIPhase, label?: string) => {
    const phaseProgress = PHASE_PROGRESS[phase];
    setPhase(phase);
    setProgress(phaseProgress);
    if (label) {
      startStep(label, phaseProgress);
    }
  }, [setPhase, setProgress, startStep]);

  const trackSearchSource = useCallback((source: { domain: string; title: string; url: string; timestamp?: number }) => {
    addSearchSource({
      domain: source.domain,
      title: source.title,
      url: source.url,
      timestamp: source.timestamp ?? Date.now(),
    });
  }, [addSearchSource]);

  const hydrateSources = useCallback((sources: Array<{ domain: string; title: string; url: string; timestamp?: number }>) => {
    hydrateFromChatSources(
      sources.map((s) => ({
        domain: s.domain,
        title: s.title,
        url: s.url,
        timestamp: s.timestamp ?? Date.now(),
      }))
    );
    taskIdRef.current = null;
  }, [hydrateFromChatSources]);

  const completeCurrentTask = useCallback(() => {
    completeActiveTask();
    taskIdRef.current = null;
  }, [completeActiveTask]);

  const finishAll = useCallback(() => {
    setPhase('finalizing');
    setProgress(100);
    if (taskIdRef.current) {
      completeTask(taskIdRef.current);
      taskIdRef.current = null;
    }
    scheduleHideAfterCompletion();
  }, [completeTask, scheduleHideAfterCompletion, setPhase, setProgress]);

  const reset = useCallback(() => {
    taskIdRef.current = null;
    clearAll();
  }, [clearAll]);

  return {
    beginPrompt,
    beginTask,
    updateProgress,
    endTask,
    startStep,
    updatePhase,
    trackSearchSource,
    hydrateSources,
    completeCurrentTask,
    finishAll,
    reset,
  };
}
