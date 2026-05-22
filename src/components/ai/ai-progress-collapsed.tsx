'use client';

interface CollapsedProps {
  text: string;
}

export function AIProgressCollapsed({ text }: CollapsedProps) {
  return (
    <div className="flex h-11 items-center justify-between gap-3 px-3 py-2">
      <div className="min-w-0 flex items-center gap-2">
        <div className="relative flex-shrink-0">
          <div className="h-1.5 w-1.5 rounded-full bg-teal-400" />
          <div className="absolute inset-0 h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
        </div>
        <span className="truncate text-[11px] font-medium tracking-tight text-white/82 transition-opacity duration-300 ease-out font-mono">
          {text}
        </span>
      </div>
      <div className="hidden flex-shrink-0 text-[10px] text-white/38 transition-colors duration-200 sm:block">expand</div>
    </div>
  );
}
