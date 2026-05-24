import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/json-ld';
import { getPostBySlug, blogPosts } from '@/lib/content/blog';
import { siteConfig } from '@/lib/seo';

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  const url = `${siteConfig.url}/blog/${post.slug}`;
  return {
    title: `${post.title} | AlphaSight AI Blog`,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: post.title,
      description: post.description,
      images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: post.title }],
      publishedTime: post.publishedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [siteConfig.ogImage],
    },
  };
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    author: { '@type': 'Person', name: post.author },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    mainEntityOfPage: `${siteConfig.url}/blog/${post.slug}`,
    publisher: { '@type': 'Organization', name: siteConfig.name, logo: { '@type': 'ImageObject', url: `${siteConfig.url}/icon-512.svg` } },
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <JsonLd data={articleSchema} />
      <article className="mx-auto max-w-4xl px-6 py-14">
        <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>
        <p className="mt-3 text-slate-400">{post.publishedAt} · {post.author}</p>
        <p className="mt-6 text-lg leading-8 text-slate-300">{post.description}</p>
        <div className="mt-8 space-y-5">
          {post.content.map((paragraph, idx) => (
            <p key={idx} className="leading-8 text-slate-200">{paragraph}</p>
          ))}
        </div>
        <section className="mt-12 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-2xl font-semibold">Related resources</h2>
          <p className="mt-3 text-slate-300">Go back to <Link href="/blog" className="underline">Blog index</Link> or review <Link href="/docs" className="underline">Docs</Link> and <Link href="/features" className="underline">Features</Link>.</p>
        </section>
      </article>
    </main>
  );
}
