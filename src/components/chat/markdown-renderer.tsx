'use client';

import React, { useState, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WebSource } from '@/lib/ai/web-search';
import { getInsightsCompanyUrl } from '@/lib/url/client-origin';

// Reused from src/lib/ai/index.ts:307. Kept in sync intentionally.
const TICKER_PATTERN = /\$?([A-Z]{2,10}(?:\.[A-Z]{1,2})?)\b/g;
const TICKER_STOPWORDS = new Set<string>([
  'A', 'I', 'AI', 'AM', 'AN', 'AS', 'AT', 'BE', 'BY', 'DO', 'GO', 'HI',
  'IF', 'IN', 'IS', 'IT', 'ME', 'MY', 'NO', 'OF', 'ON', 'OR', 'OK', 'SO',
  'TO', 'UP', 'US', 'WE', 'THE', 'AND', 'OUR', 'FOR', 'YOU', 'WHO', 'WHY',
  'HOW', 'NEW', 'NOT', 'NOW', 'GET', 'CAN', 'YES', 'ALL', 'ANY', 'ARE',
  'BUT', 'HAS', 'HAD', 'WAS', 'WERE', 'WILL', 'WITH', 'THAT', 'THIS',
  'FROM', 'YOUR', 'WHAT', 'WHEN', 'HAVE',
]);

function looksLikeTicker(token: string): boolean {
  const upper = token.toUpperCase();
  if (TICKER_STOPWORDS.has(upper)) return false;
  // Dot-suffixed (e.g. RELIANCE.NS, BRK.A) is always a confident match.
  if (/\./.test(upper)) return true;
  // Bare uppercase 2–10 letters — needs to be all-caps in source text.
  return upper === token && token.length >= 2 && token.length <= 10;
}

/**
 * Walks a string and yields text fragments + ticker chip elements. Used by
 * the `p` / `li` overrides so detected tickers become inline links to the
 * insights subdomain without disrupting surrounding markdown.
 */
function wrapTickersInText(text: string, keyPrefix: string): React.ReactNode[] {
  if (!text) return [text];
  const out: React.ReactNode[] = [];
  let lastIndex = 0;
  let matchIdx = 0;
  TICKER_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TICKER_PATTERN.exec(text)) !== null) {
    const fullMatch = match[0];
    const symbolGroup = match[1];
    const start = match.index;
    const candidate = symbolGroup;
    // Require either a $ prefix OR all-caps in source for bare matches.
    const hasDollar = fullMatch.startsWith('$');
    const sourceToken = text.slice(start + (hasDollar ? 1 : 0), start + fullMatch.length);
    if (!hasDollar && sourceToken !== sourceToken.toUpperCase()) continue;
    if (!looksLikeTicker(candidate)) continue;

    if (start > lastIndex) out.push(text.slice(lastIndex, start));
    const href = getInsightsCompanyUrl(candidate);
    out.push(
      <a
        key={`${keyPrefix}-tk-${matchIdx++}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center rounded-md bg-elevated px-1.5 py-0.5 font-mono text-[0.85em] text-accent-brand hover:bg-canvas"
      >
        {candidate}
      </a>,
    );
    lastIndex = start + fullMatch.length;
  }
  if (lastIndex < text.length) out.push(text.slice(lastIndex));
  return out.length > 0 ? out : [text];
}

/**
 * Recursively transforms ReactMarkdown children, wrapping ticker tokens in
 * inline links — but ONLY inside plain text nodes. Tickers inside `<a>` or
 * `<code>` are left alone to avoid nesting / breaking code samples.
 */
function processTickerChildren(
  children: React.ReactNode,
  keyPrefix: string,
): React.ReactNode {
  if (typeof children === 'string') {
    return wrapTickersInText(children, keyPrefix);
  }
  if (Array.isArray(children)) {
    return children.map((child, idx) =>
      processTickerChildren(child, `${keyPrefix}-${idx}`),
    );
  }
  if (React.isValidElement<{ children?: React.ReactNode }>(children)) {
    const elementType = children.type;
    // Skip elements that we should NOT walk into.
    if (typeof elementType === 'string') {
      if (elementType === 'a' || elementType === 'code') return children;
    }
    const childProps = children.props as { children?: React.ReactNode };
    const inner = childProps.children;
    if (inner === undefined) return children;
    return React.cloneElement(children, {
      ...childProps,
      children: processTickerChildren(inner, `${keyPrefix}-c`),
    });
  }
  return children;
}

interface MarkdownRendererProps {
  content: string;
  className?: string;
  streaming?: boolean;
  sources?: WebSource[];
}

function countToken(input: string, token: string): number {
  if (!input || !token) return 0;
  let count = 0;
  let cursor = 0;
  while (cursor < input.length) {
    const idx = input.indexOf(token, cursor);
    if (idx === -1) break;
    count += 1;
    cursor = idx + token.length;
  }
  return count;
}

function stabilizeMarkdownForRender(content: string): string {
  if (!content.trim()) return content;

  let safe = content;

  // Close unfinished fenced code blocks to prevent style bleed in the rest.
  if (countToken(safe, '```') % 2 !== 0) {
    safe = `${safe}\n\`\`\``;
  }

  // Close unbalanced bold delimiters outside fenced/inline code.
  const fencedParts = safe.split(/(```[\s\S]*?```)/g);
  const balanced = fencedParts
    .map((part) => {
      if (part.startsWith('```') && part.endsWith('```')) return part;
      const inlineParts = part.split(/(`[^`\n]*`)/g);
      let textTokenCount = 0;
      inlineParts.forEach((inline) => {
        if (inline.startsWith('`') && inline.endsWith('`')) return;
        textTokenCount += countToken(inline, '**');
      });
      return textTokenCount % 2 === 0 ? part : `${part}**`;
    })
    .join('');

  return balanced;
}

function stripDuplicateSourcesSection(content: string, hasSourcesBox: boolean): string {
  if (!hasSourcesBox) return content;
  const match = content.match(/(^|\n)\s{0,3}#{1,6}\s*sources?\s*$/im);
  if (!match || match.index === undefined) return content;
  return content.slice(0, match.index).trimEnd();
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
  const hasSourcesBox = (sources?.length ?? 0) > 0;
  const processedContent = useMemo(
    () => (streaming ? content : stabilizeMarkdownForRender(stripDuplicateSourcesSection(content, hasSourcesBox))),
    [content, hasSourcesBox, streaming],
  );

  const rehypePlugins = useMemo(() => {
    const plugins: unknown[] = [];
    if (!streaming) plugins.push([rehypeHighlight, { ignoreMissing: true, detect: true }]);
    return plugins;
  }, [streaming]);

  return (
    <div
      className={cn(
        'prose max-w-none break-words',
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
        rehypePlugins={rehypePlugins as never}
        components={{
          code: CodeBlock as never,
          p: ({ children, ...props }) => (
            <p {...props}>{processTickerChildren(children, 'p')}</p>
          ),
          li: ({ children, ...props }) => (
            <li {...props}>{processTickerChildren(children, 'li')}</li>
          ),
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
              className="break-all text-accent-green transition-colors hover:text-accent-green/80 hover:underline"
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
