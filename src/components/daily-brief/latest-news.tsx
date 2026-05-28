'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Newspaper, ExternalLink, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { NewsItem } from '@/types/stock';
import { useAppStore } from '@/stores/app-store';

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
          // Cache it for later use
          setNewsCache(data);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };

    // Use cached data if available and fresh (< 5 minutes)
    const newsLastFetched = useAppStore.getState().newsLastFetched;
    const isCacheFresh = newsCache && (Date.now() - newsLastFetched) < 5 * 60 * 1000;
    
    if (isCacheFresh && newsCache?.news) {
      setNews(newsCache.news.slice(0, 9));
      setLoading(false);
    } else {
      fetchNews();
    }
  }, [setNewsCache]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 24) {
      return diffHours < 1 ? 'Just now' : `${diffHours}h ago`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

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

  const categoryLabel = (cat?: string) => {
    switch (cat) {
      case 'market': return { label: 'Market', variant: 'blue' as const };
      case 'geopolitical': return { label: 'Geopolitical', variant: 'amber' as const };
      case 'holding': return { label: 'Portfolio', variant: 'green' as const };
      default: return { label: 'News', variant: 'gray' as const };
    }
  };

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
          const cat = categoryLabel(item.category);
          return (
            <a
              key={index}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col rounded-lg border border-borderSubtle bg-canvas hover:border-accent-brand/40 hover:bg-elevated transition-all duration-200 overflow-hidden"
            >
              {item.imageUrl && (
                <div className="h-24 overflow-hidden bg-skeleton">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
              <div className="flex-1 p-3 flex flex-col">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Badge variant={cat.variant} className="text-[9px] px-1 py-0 shrink-0">
                    {cat.label}
                  </Badge>
                  {item.symbol && (
                    <span className="text-[9px] font-medium text-muted uppercase">
                      {item.symbol}
                    </span>
                  )}
                </div>
                <h3 className="text-xs font-semibold text-primary line-clamp-2 mb-1 group-hover:text-accent-blue transition-colors">
                  {item.title}
                </h3>
                {item.summary && (
                  <p className="text-[10px] text-secondary line-clamp-1 mb-auto">
                    {item.summary}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-borderSubtle">
                  <span className="text-[9px] text-muted">
                    {formatDate(item.publishedAt)}
                  </span>
                  <span className="text-[9px] font-medium text-accent-blue opacity-0 group-hover:opacity-100 transition-opacity">
                    Read
                  </span>
                </div>
              </div>
            </a>
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
