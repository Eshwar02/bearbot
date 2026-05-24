import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata, routeSeo } from '@/lib/seo';
import { blogPosts } from '@/lib/content/blog';

export const metadata: Metadata = buildMetadata(routeSeo.blog);

export default function BlogIndexPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">AlphaSight AI Blog</h1>
        <p className="mt-5 text-lg leading-8 text-slate-300">Practical content on AI workspace architecture, intelligent assistant design, research workflows, and GEO/SEO implementation.</p>
        <div className="mt-10 space-y-5">
          {blogPosts.map((post) => (
            <article key={post.slug} className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-2xl font-semibold">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p className="mt-2 text-slate-300">{post.description}</p>
              <p className="mt-3 text-sm text-slate-400">{post.publishedAt}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
