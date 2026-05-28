'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Newspaper,
  Globe,
  Briefcase,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
}

const CATEGORY_CONFIG = {
  market: {
    label: 'Market News',
    icon: Globe,
    variant: 'blue' as const,
    description: 'NSE, Sensex, Nifty & Indian market updates',
  },
  geopolitical: {
    label: 'Geopolitical',
    icon: AlertTriangle,
    variant: 'amber' as const,
    description: 'Global events & macroeconomic impact',
  },
  holdings: {
    label: 'Portfolio Holdings',
    icon: Briefcase,
    variant: 'green' as const,
    description: 'News related to your portfolio stocks',
  },
} as const;

type CategoryKey = keyof typeof CATEGORY_CONFIG;

function NewsCard({ item }: { item: NewsItem }) {
  const [imgError, setImgError] = useState(false);

  const dateStr = item.publishedAt
    ? new Date(item.publishedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

  return (
    <motion.a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group block rounded-xl border border-borderSubtle dark:border-borderStrong bg-elevated overflow-hidden hover:border-accent-brand/30 hover:shadow-sm transition-all duration-200"
    >
      {item.imageUrl && !imgError && (
        <div className="relative h-40 sm:h-48 overflow-hidden bg-skeleton">
          <img
            src={item.imageUrl}
            alt=""
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {item.symbol && (
            <Badge variant="gray" className="text-[10px] px-1.5 py-0 uppercase">
              {item.symbol.replace(/\.(NS|BO)$/, '')}
            </Badge>
          )}
          <span className="text-[11px] text-muted">{item.source}</span>
          {item.category && (
            <Badge
              variant={CATEGORY_CONFIG[item.category as CategoryKey]?.variant || 'gray'}
              className="text-[10px] px-1.5 py-0 ml-auto"
            >
              {CATEGORY_CONFIG[item.category as CategoryKey]?.label || item.category}
            </Badge>
          )}
        </div>
        <h3 className="text-sm font-semibold text-primary mb-1.5 line-clamp-2 group-hover:text-accent-blue transition-colors">
          {item.title}
        </h3>
        {item.summary && (
          <p className="text-xs text-secondary leading-relaxed line-clamp-2 mb-3">
            {item.summary}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted">{dateStr}</span>
          <span className="flex items-center gap-1 text-[11px] font-medium text-accent-blue opacity-0 group-hover:opacity-100 transition-opacity">
            Read more <ExternalLink className="h-3 w-3" />
          </span>
        </div>
      </div>
    </motion.a>
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
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-elevated border border-borderSubtle">
          <Icon className="h-4 w-4 text-accent-blue" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-primary">{config.label}</h2>
          <p className="text-xs text-muted">{config.description}</p>
        </div>
        <Badge variant={config.variant} className="ml-auto">
          {items.length} stories
        </Badge>
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
  const [data, setData] = useState<AggregatedNews | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNews = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/news/aggregated');
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
  };

  useEffect(() => {
    fetchNews();
  }, []);

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
          <Button
            onClick={() => fetchNews(true)}
            loading={refreshing}
            size="md"
          >
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
          <div className="space-y-10">
            <CategorySection category="market" items={data.categories.market} />
            <CategorySection category="geopolitical" items={data.categories.geopolitical} />
            <CategorySection category="holdings" items={data.categories.holdings} />
          </div>
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
              Could not fetch news at this time. Try again later.
            </p>
          </div>
        )}

        {data && data.total > 0 && (
          <div className="mt-8 pt-6 border-t border-borderSubtle text-center">
            <p className="text-xs text-muted">
              Showing {data.news.length} curated stories. Sources include NewsAPI, MarketAux & Google News.
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
