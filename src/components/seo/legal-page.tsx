import Link from 'next/link';
import { siteConfig } from '@/lib/seo';

type LegalPageProps = {
  title: string;
  updated: string;
  children: React.ReactNode;
};

export function LegalPage({ title, updated, children }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
              α
            </span>
            {siteConfig.name}
          </Link>
          <nav className="hidden gap-6 text-sm md:flex">
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <Link href="/about" className="hover:underline">
              About
            </Link>
            <Link href="/contact" className="hover:underline">
              Contact
            </Link>
            <Link href={siteConfig.appUrl} className="hover:underline">
              Open App
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <article className="prose prose-gray dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Last updated: {updated}
          </p>
          <div className="mt-8 space-y-6 text-base leading-relaxed [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_a]:text-indigo-600 [&_a]:underline dark:[&_a]:text-indigo-400">
            {children}
          </div>
        </article>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-sm text-gray-500 dark:text-gray-400">
          <div>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</div>
          <nav className="flex gap-4">
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/terms" className="hover:underline">Terms</Link>
            <Link href="/disclaimer" className="hover:underline">Disclaimer</Link>
            <Link href="/contact" className="hover:underline">Contact</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
