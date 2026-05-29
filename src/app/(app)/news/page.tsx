'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Newspaper,
  Globe,
  Briefcase,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Loader2,
  ArrowUpRight,
} from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/app-store';
import { SkeletonCard } from '@/components/ui/skeleton';
import type { NewsItem } from '@/types/stock';

interface AggregatedNews {
  news: NewsItem[];
  categories: {
    holdings: NewsItem[];
    market: NewsItem[];
    geopolitical: NewsItem[];
  };
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

const CATEGORY_CONFIG = {
  market: {
    label: 'Market News',
    icon: Globe,
    variant: 'blue' as const,
    description: 'NSE, Sensex, Nifty & Indian market updates',
    borderBar: 'bg-accent-blue',
    borderGlow: 'shadow-accent-blue/15',
    iconBg: 'bg-accent-blue/10 text-accent-blue',
    divider: 'border-accent-blue/20',
  },
  geopolitical: {
    label: 'Geopolitical',
    icon: AlertTriangle,
    variant: 'amber' as const,
    description: 'Global events & macroeconomic impact',
    borderBar: 'bg-accent-amber',
    borderGlow: 'shadow-accent-amber/15',
    iconBg: 'bg-accent-amber/10 text-accent-amber',
    divider: 'border-accent-amber/20',
  },
  holdings: {
    label: 'Portfolio Holdings',
    icon: Briefcase,
    variant: 'green' as const,
    description: 'News related to your portfolio stocks',
    borderBar: 'bg-accent-green',
    borderGlow: 'shadow-accent-green/15',
    iconBg: 'bg-accent-green/10 text-accent-green',
    divider: 'border-accent-green/20',
  },
} as const;

type CategoryKey = keyof typeof CATEGORY_CONFIG;

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function NewsCard({ item }: { item: NewsItem }) {
  const [imgError, setImgError] = useState(false);
  const catKey = item.category as CategoryKey;
  const config = CATEGORY_CONFIG[catKey];

  if (!config) {
    return (
      <motion.a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="group block rounded-xl border border-borderSubtle dark:border-borderStrong bg-elevated overflow-hidden hover:border-accent-brand/30 transition-all duration-200"
      >
        {item.imageUrl && !imgError && (
          <div className="relative h-40 sm:h-44 overflow-hidden bg-skeleton">
            <img
              src={item.imageUrl}
              alt=""
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          </div>
        )}
        <div className="p-4">
          <h3 className="text-sm font-semibold text-primary mb-1.5 line-clamp-2">
            {item.title}
          </h3>
          {item.summary && (
            <p className="text-xs text-secondary line-clamp-2 mb-3">{item.summary}</p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted">{item.source}</span>
            <ExternalLink className="h-3 w-3 text-muted" />
          </div>
        </div>
      </motion.a>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'group relative rounded-xl border border-borderSubtle dark:border-borderStrong',
        'bg-elevated overflow-hidden flex flex-col',
        'hover:shadow-lg transition-all duration-300',
        config.borderGlow,
        'hover:border-transparent',
      )}
    >
      {/* Category-colored top bar */}
      <div className={cn('absolute inset-x-0 top-0 h-[3px] z-10', config.borderBar)} />

      {/* Category-colored left accent on hover */}
      <div
        className={cn(
          'absolute left-0 top-3 bottom-3 w-[2px] rounded-full',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-300',
          config.borderBar,
        )}
      />

      {item.imageUrl && !imgError && (
        <div className="relative h-40 sm:h-44 overflow-hidden bg-skeleton shrink-0">
          <img
            src={item.imageUrl}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-elevated to-transparent" />
        </div>
      )}

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          {item.symbol && (
            <Badge variant="gray" className="text-[10px] px-1.5 py-0 uppercase shrink-0">
              {item.symbol.replace(/\.(NS|BO)$/, '')}
            </Badge>
          )}
          <span className="text-[11px] text-muted truncate">{item.source}</span>
          <span className="text-[10px] text-muted ml-auto shrink-0">
            {timeAgo(item.publishedAt)}
          </span>
        </div>

        {/* Title as link — fixes <a> embedding issue */}
        <h3 className="mb-1">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'text-sm font-semibold text-primary leading-snug',
              'hover:text-accent-blue transition-colors',
              'underline decoration-transparent hover:decoration-accent-blue/30 underline-offset-2',
            )}
          >
            {item.title}
            <ArrowUpRight className="inline h-3 w-3 ml-0.5 -mt-0.5 text-accent-blue opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        </h3>

        {/* URL domain as visible sub-heading — fixes raw <a> embedding */}
        <div className="flex items-center gap-1 mb-2">
          <span className="text-[10px] text-muted/50 truncate">
            {extractDomain(item.url)}
          </span>
          <ExternalLink className="h-2.5 w-2.5 text-muted/30 shrink-0" />
        </div>

        {item.summary && (
          <p className="text-xs text-secondary leading-relaxed line-clamp-2 mb-auto">
            {item.summary}
          </p>
        )}

        <div className={cn('flex items-center justify-between pt-2 mt-3 border-t', config.divider)}>
          <Badge
            variant={config.variant}
            className="text-[9px] px-1.5 py-0"
          >
            {config.label}
          </Badge>
          <span className="text-[10px] font-medium text-muted group-hover:text-accent-blue transition-colors">
            Read more →
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function CategorySection({
  category,
  items,
}: {
  category: CategoryKey;
  items: NewsItem[];
}) {
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;

  if (items.length === 0) return null;

  return (
    <section>
      <div className="flex items-start gap-3 mb-5">
        <div className={cn('p-2 rounded-lg shrink-0', config.iconBg)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-primary">{config.label}</h2>
            <Badge variant={config.variant} className="text-[10px] px-1.5 py-0">
              {items.length} {items.length === 1 ? 'story' : 'stories'}
            </Badge>
          </div>
          <p className="text-xs text-muted mt-0.5">{config.description}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, i) => (
          <NewsCard key={`${category}-${i}`} item={item} />
        ))}
      </div>
    </section>
  );
}

export function NewsView() {
  const newsCache = useAppStore((s) => s.newsCache);
  const newsLastFetched = useAppStore((s) => s.newsLastFetched);
  const [data, setData] = useState<AggregatedNews | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchNews = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const url = isRefresh
        ? '/api/news/aggregated?offset=0&limit=50&refresh=1'
        : '/api/news/aggregated?offset=0&limit=50';
      const res = await fetch(url);
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!data || !data.hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/news/aggregated?offset=${data.offset + data.limit}&limit=50`,
      );
      if (res.ok) {
        const d: AggregatedNews = await res.json();
        setData((prev) => {
          if (!prev) return d;
          return {
            ...d,
            news: [...prev.news, ...d.news],
            categories: {
              holdings: [...prev.categories.holdings, ...d.categories.holdings],
              market: [...prev.categories.market, ...d.categories.market],
              geopolitical: [...prev.categories.geopolitical, ...d.categories.geopolitical],
            },
          };
        });
      }
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  }, [data, loadingMore]);

  useEffect(() => {
    if (newsCache && Date.now() - newsLastFetched < 5 * 60 * 1000) {
      setData(newsCache);
      setLoading(false);
    } else {
      fetchNews();
    }
  }, [fetchNews, newsCache, newsLastFetched]);

  useEffect(() => {
    if (!sentinelRef.current || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '300px' },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loading, loadMore]);

  return (
    <div className="bg-canvas min-h-full">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <Newspaper className="h-6 w-6 text-accent-blue" />
              News
            </h1>
            <p className="text-sm text-muted mt-1">
              Curated market, geopolitical & portfolio news
            </p>
          </div>
          <Button onClick={() => fetchNews(true)} loading={refreshing} size="md">
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        {loading && (
          <div className="space-y-8">
            {[1, 2, 3].map((s) => (
              <div key={s}>
                <div className="flex items-center gap-2 mb-4">
                  <SkeletonCard className="!h-10 !w-10 !rounded-lg" />
                  <div className="space-y-1">
                    <SkeletonCard className="!h-5 !w-32" />
                    <SkeletonCard className="!h-3 !w-48" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && data && (
          <>
            <div className="space-y-10">
              <CategorySection category="market" items={data.categories.market} />
              <CategorySection category="geopolitical" items={data.categories.geopolitical} />
              <CategorySection category="holdings" items={data.categories.holdings} />
            </div>

            {data.news.length > 0 && (
              <>
                <div className="mt-10">
                  <h2 className="text-base font-semibold text-primary mb-4 flex items-center gap-2">
                    <Newspaper className="h-4 w-4 text-accent-blue" />
                    All Stories ({data.total})
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.news.map((item, i) => (
                      <NewsCard key={`all-${i}`} item={item} />
                    ))}
                  </div>
                </div>

                <div
                  ref={sentinelRef}
                  className="h-10 mt-6 flex items-center justify-center"
                >
                  {loadingMore && (
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading more news...
                    </div>
                  )}
                  {!data.hasMore && data.news.length > 0 && (
                    <p className="text-xs text-muted">
                      Showing all {data.total} stories
                    </p>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {!loading && !data && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-elevated p-6 mb-4">
              <Newspaper className="h-10 w-10 text-muted" />
            </div>
            <h2 className="text-lg font-semibold text-primary mb-1">
              No news available
            </h2>
            <p className="text-sm text-muted mb-6">
              Could not fetch news at this time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NewsPage() {
  return <NewsView />;
}
