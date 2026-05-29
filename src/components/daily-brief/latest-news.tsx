'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Newspaper, ExternalLink, ArrowRight, ArrowUpRight } from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { NewsItem } from '@/types/stock';
import { useAppStore } from '@/stores/app-store';

const CATEGORY_STYLES: Record<string, { bar: string; label: string; variant: 'blue' | 'amber' | 'green' | 'gray' }> = {
  market: { bar: 'bg-accent-blue', label: 'Market', variant: 'blue' },
  geopolitical: { bar: 'bg-accent-amber', label: 'Geopolitical', variant: 'amber' },
  holdings: { bar: 'bg-accent-green', label: 'Portfolio', variant: 'green' },
};

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export function LatestNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const setActiveView = useAppStore((s) => s.setActiveView);
  const newsCache = useAppStore((s) => s.newsCache);
  const setNewsCache = useAppStore((s) => s.setNewsCache);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('/api/news/aggregated?limit=9');
        if (res.ok) {
          const data = await res.json();
          setNews((data.news || []).slice(0, 9));
          setNewsCache(data);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };

    const newsLastFetched = useAppStore.getState().newsLastFetched;
    const isCacheFresh =
      newsCache && Date.now() - newsLastFetched < 5 * 60 * 1000;

    if (isCacheFresh && newsCache?.news) {
      setNews(newsCache.news.slice(0, 9));
      setLoading(false);
    } else {
      fetchNews();
    }
  }, [setNewsCache]);

  if (loading) {
    return (
      <div className="rounded-xl border border-borderSubtle bg-elevated p-6">
        <div className="flex items-center gap-2 mb-4">
          <Newspaper className="h-5 w-5 text-accent-blue" />
          <h2 className="text-lg font-semibold text-primary">Market News</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-skeleton rounded w-3/4 mb-2" />
              <div className="h-3 bg-skeleton rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (news.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-borderSubtle bg-elevated p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-accent-blue" />
          <h2 className="text-lg font-semibold text-primary">Market News</h2>
        </div>
        <span className="text-xs font-medium text-muted">{news.length} stories</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {news.map((item, index) => {
          const style = CATEGORY_STYLES[item.category || ''] || {
            bar: 'bg-accent-brand',
            label: 'News',
            variant: 'gray' as const,
          };
          return (
            <div
              key={index}
              className={cn(
                'group relative flex flex-col rounded-lg border border-borderSubtle',
                'bg-canvas hover:bg-elevated transition-all duration-200 overflow-hidden',
                'hover:shadow-md hover:border-transparent',
              )}
            >
              <div className={cn('h-[2px] shrink-0', style.bar)} />
              {item.imageUrl && (
                <div className="h-24 overflow-hidden bg-skeleton shrink-0">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="flex-1 p-3 flex flex-col">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Badge
                    variant={style.variant}
                    className="text-[9px] px-1 py-0 shrink-0"
                  >
                    {style.label}
                  </Badge>
                  {item.symbol && (
                    <span className="text-[9px] font-medium text-muted uppercase">
                      {item.symbol}
                    </span>
                  )}
                  <span className="text-[9px] text-muted ml-auto shrink-0">
                    {timeAgo(item.publishedAt)}
                  </span>
                </div>

                <h3 className="text-xs font-semibold text-primary line-clamp-2 mb-0.5">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent-blue transition-colors"
                  >
                    {item.title}
                    <ArrowUpRight className="inline h-2.5 w-2.5 ml-0.5 -mt-0.5 text-accent-blue opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </h3>

                <span className="text-[9px] text-muted/50 truncate mb-1.5">
                  {extractDomain(item.url)}
                </span>

                {item.summary && (
                  <p className="text-[10px] text-secondary line-clamp-1 mb-auto">
                    {item.summary}
                  </p>
                )}

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-borderSubtle">
                  <span className="text-[9px] text-muted">{item.source}</span>
                  <ExternalLink className="h-2.5 w-2.5 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => {
          setActiveView('news');
          router.push('/news');
        }}
        className="flex items-center justify-center gap-1.5 w-full px-3 py-2 text-sm font-medium text-accent-blue hover:bg-elevated rounded-lg transition-colors border border-borderSubtle hover:border-accent-brand/40"
      >
        Click to view more
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}
