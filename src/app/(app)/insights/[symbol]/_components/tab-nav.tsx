'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface TabNavProps {
  symbol: string;
}

const TABS = [
  { slug: 'chart', label: 'Chart' },
  { slug: 'analysis', label: 'Analysis' },
  { slug: 'peers', label: 'Peers' },
  { slug: 'quarters', label: 'Quarters' },
  { slug: 'pnl', label: 'P&L' },
  { slug: 'ratios', label: 'Ratios' },
] as const;

export function TabNav({ symbol }: TabNavProps) {
  const pathname = usePathname() ?? '';
  const encoded = encodeURIComponent(symbol);
  const base = `/insights/${encoded}`;

  return (
    <nav
      aria-label="Company sections"
      className="mt-6 border-b border-borderSubtle"
    >
      <ul className="no-scrollbar -mb-px flex gap-1 overflow-x-auto whitespace-nowrap text-sm">
        {TABS.map((tab) => {
          const href = `${base}/${tab.slug}`;
          const active =
            pathname === href ||
            pathname === `${base}/${tab.slug}/` ||
            pathname.startsWith(`${href}/`);
          return (
            <li key={tab.slug} className="shrink-0">
              <Link
                href={href}
                className={cn(
                  'inline-flex items-center border-b-2 px-3 py-2.5 font-medium transition-colors',
                  active
                    ? 'border-accent-brand text-accent-brand'
                    : 'border-transparent text-secondary hover:text-primary'
                )}
                aria-current={active ? 'page' : undefined}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
