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

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('/api/news/aggregated');
        if (res.ok) {
          const data = await res.json();
          setNews((data.news || []).slice(0, 3));
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

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
          <h2 className="text-lg font-semibold text-primary">Latest News</h2>
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
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="h-5 w-5 text-accent-blue" />
        <h2 className="text-lg font-semibold text-primary">Latest News</h2>
      </div>
      <div className="space-y-3">
        {news.map((item, index) => {
          const cat = categoryLabel(item.category);
          return (
            <div
              key={index}
              className="flex items-start gap-3 pb-3 border-b border-borderSubtle last:border-b-0 last:pb-0"
            >
              {item.imageUrl && (
                <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-skeleton">
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={cat.variant} className="text-[10px] px-1.5 py-0">
                    {cat.label}
                  </Badge>
                  {item.symbol && (
                    <span className="text-[10px] font-medium text-muted uppercase">
                      {item.symbol}
                    </span>
                  )}
                  <span className="text-[10px] text-muted">{item.source}</span>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:text-accent-blue transition-colors line-clamp-2"
                >
                  {item.title}
                </a>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted">
                    {formatDate(item.publishedAt)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-3 border-t border-borderSubtle">
        <button
          onClick={() => {
            setActiveView('news');
            router.push('/news');
          }}
          className="flex items-center gap-1.5 text-sm font-medium text-accent-blue hover:underline"
        >
          Go to News
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
