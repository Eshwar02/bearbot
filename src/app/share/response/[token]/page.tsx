import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Shared AlphaSight Response',
  description: 'Shared AlphaSight AI response',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const TOKEN_RE = /^[a-z]{16}$/;

async function getSharedContentByToken(token: string): Promise<string> {
  if (!TOKEN_RE.test(token)) return '';
  const supabase = await createClient();
  const { data } = await supabase
    .from('shared_responses')
    .select('content')
    .eq('token', token)
    .maybeSingle();
  return data?.content ?? '';
}

export default async function SharedResponseTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const content = await getSharedContentByToken(token);

  return (
    <main className="min-h-screen bg-canvas text-primary">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold">Shared Response</h1>
        <p className="mt-2 text-sm text-muted">This link shares one response only.</p>
        <article className="mt-6 rounded-xl border border-borderSubtle bg-elevated p-5">
          {content ? (
            <div className="prose max-w-none break-words text-primary [overflow-wrap:anywhere] prose-pre:overflow-x-auto prose-pre:rounded-lg prose-code:break-words prose-li:break-words">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[[rehypeHighlight, { ignoreMissing: true, detect: true }]]}
                components={{
                  a: ({ children, href, ...props }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-accent-green hover:underline"
                      {...props}
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="leading-7 text-primary">This shared response is unavailable or invalid.</div>
          )}
        </article>
      </div>
    </main>
  );
}
