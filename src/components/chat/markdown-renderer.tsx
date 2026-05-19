'use client';

import React, { useState, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WebSource } from '@/lib/ai/web-search';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  streaming?: boolean;
  sources?: WebSource[];
}

function injectCitations(content: string, count: number): string {
  if (count === 0) return content;
  const parts = content.split(/(```[\s\S]*?```|`[^`]+`)/g);
  return parts
    .map((part) => {
      if (part.startsWith('```') || (part.startsWith('`') && part.endsWith('`'))) {
        return part;
      }
      return part.replace(/\[(\d+)\]/g, (match, n: string) => {
        const idx = parseInt(n, 10);
        if (idx < 1 || idx > count) return match;
        return `<sup data-cite="${idx}">${idx}</sup>`;
      });
    })
    .join('');
}

function CodeBlock({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match?.[1] ?? '';
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [codeString]);

  if (!className && !codeString.includes('\n')) {
    return (
      <code
        className="rounded bg-code px-1.5 py-0.5 text-sm font-mono text-accent-green"
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <div className="group relative my-4 overflow-hidden rounded-lg border border-borderSubtle dark:border-borderStrong bg-code">
      <div className="flex items-center justify-between border-b border-borderSubtle dark:border-borderStrong bg-elevated px-4 py-2">
        <span className="text-xs font-medium text-muted uppercase">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-primary"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4">
        <code className={cn('text-sm font-mono', className)} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

export function MarkdownRenderer({
  content,
  className,
  streaming = false,
  sources,
}: MarkdownRendererProps) {
  const sourceCount = sources?.length ?? 0;
  const processedContent = useMemo(
    () => (sourceCount > 0 ? injectCitations(content, sourceCount) : content),
    [content, sourceCount],
  );

  const rehypePlugins = useMemo(() => {
    const plugins: unknown[] = [];
    if (sourceCount > 0) plugins.push(rehypeRaw);
    if (!streaming) plugins.push([rehypeHighlight, { ignoreMissing: true, detect: true }]);
    return plugins;
  }, [streaming, sourceCount]);

  const handleCiteClick = useCallback(
    (n: number) => {
      const src = sources?.[n - 1];
      if (src?.url) window.open(src.url, '_blank', 'noopener,noreferrer');
    },
    [sources],
  );

  return (
    <div
      className={cn(
        'prose max-w-none',
        'prose-p:leading-7 prose-p:my-2 prose-p:text-primary',
        'prose-headings:font-bold prose-headings:border-b prose-headings:border-borderSubtle prose-headings:pb-1 prose-headings:text-primary',
        'prose-h1:text-3xl prose-h1:mt-6 prose-h1:mb-4',
        'prose-h2:text-2xl prose-h2:mt-5 prose-h2:mb-3',
        'prose-h3:text-xl prose-h3:mt-4 prose-h3:mb-2',
        'prose-h4:text-lg prose-h4:mt-3 prose-h4:mb-2',
        'prose-strong:text-primary',
        'prose-a:text-accent-green prose-a:no-underline hover:prose-a:underline',
        'prose-ul:my-3 prose-ol:my-3',
        'prose-li:my-1',
        'prose-blockquote:border-borderStrong prose-blockquote:text-secondary',
        'prose-hr:border-borderSubtle',
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rehypePlugins={rehypePlugins as any}
        components={{
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          sup: ({ children, ...props }: any) => {
            const cite = props['data-cite'];
            const n = typeof cite === 'string' ? parseInt(cite, 10) : NaN;
            if (!Number.isFinite(n) || n < 1) {
              return <sup {...props}>{children}</sup>;
            }
            const src = sources?.[n - 1];
            return (
              <sup
                onClick={() => handleCiteClick(n)}
                title={src ? `${src.title} — ${src.source}` : `Source ${n}`}
                className="ml-0.5 inline-flex h-4 min-w-[16px] cursor-pointer items-center justify-center rounded-[4px] bg-accent-green/15 px-1 text-[10px] font-semibold text-accent-green hover:bg-accent-green/25"
              >
                {n}
              </sup>
            );
          },
          code: CodeBlock as any,
          table: ({ children, ...props }) => (
            <div className="my-4 overflow-x-auto rounded-lg border border-borderSubtle dark:border-borderStrong">
              <table
                className="min-w-full divide-y divide-borderSubtle dark:divide-borderStrong text-sm"
                {...props}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="bg-elevated" {...props}>
              {children}
            </thead>
          ),
          th: ({ children, ...props }) => (
            <th
              className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-secondary"
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td
              className="whitespace-nowrap px-4 py-2.5 text-primary"
              {...props}
            >
              {children}
            </td>
          ),
          tr: ({ children, ...props }) => (
            <tr
              className="border-b border-borderSubtle/50 transition-colors hover:bg-elevated/50"
              {...props}
            >
              {children}
            </tr>
          ),
          a: ({ children, href, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-green transition-colors hover:text-accent-green/80 hover:underline"
              {...props}
            >
              {children}
            </a>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
