'use client';

import { useEffect, useState } from 'react';
import { Newspaper, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { PortfolioSnapshotItem } from '@/types/stock';

interface NewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  summary: string;
  symbol: string;
}

interface HoldingNewsProps {
  holdings: PortfolioSnapshotItem[];
}

export function HoldingNews({ holdings }: HoldingNewsProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const symbols = holdings.slice(0, 5).map((h) => h.symbol);
        const results = await Promise.all(
          symbols.map(async (symbol) => {
            try {
              const res = await fetch(`/api/stock/news?symbol=${encodeURIComponent(symbol)}`);
              if (res.ok) {
                const data = await res.json();
                return (data.news || []).slice(0, 2).map((item: any) => ({
                  ...item,
                  symbol,
                }));
              }
            } catch {
              return [];
            }
            return [];
          })
        );
        setNews(results.flat().slice(0, 8));
      } finally {
        setLoading(false);
      }
    };

    if (holdings.length > 0) {
      fetchNews();
    }
  }, [holdings]);

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

  if (news.length === 0) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="rounded-xl border border-borderSubtle bg-elevated p-6">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="h-5 w-5 text-accent-blue" />
        <h2 className="text-lg font-semibold text-primary">Latest News</h2>
      </div>
      <div className="space-y-4">
        {news.map((item, index) => (
          <div
            key={index}
            className="pb-4 border-b border-borderSubtle last:border-b-0 last:pb-0"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="blue" className="text-xs">
                    {item.symbol}
                  </Badge>
                  <span className="text-xs text-muted">{item.source}</span>
                </div>
                <h3 className="text-sm font-medium text-primary mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  {item.summary}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted">
                    {formatDate(item.publishedAt)}
                  </span>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent-blue hover:underline flex items-center gap-1"
                    >
                      Read more <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
