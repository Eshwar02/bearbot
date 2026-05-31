import { useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';

/**
 * Hook that preloads news in the background when the app is idle.
 * Uses requestIdleCallback for low-priority loading.
 */
export function useNewsPreloader() {
  const newsCache = useAppStore((s) => s.newsCache);
  const newsLastFetched = useAppStore((s) => s.newsLastFetched);
  const setNewsCache = useAppStore((s) => s.setNewsCache);

  useEffect(() => {
    // Check if cache is stale (> 10 minutes old)
    const isCacheStale = !newsCache || (Date.now() - newsLastFetched) > 10 * 60 * 1000;
    
    if (!isCacheStale) return; // Cache is fresh, don't preload

    // Use requestIdleCallback if available, otherwise use setTimeout
    const preload = async () => {
      try {
        const res = await fetch('/api/news/aggregated?limit=50', {
          priority: 'low' as RequestInit['priority'],
        });
        if (res.ok) {
          const data = await res.json();
          setNewsCache(data);
        }
      } catch {
        // Silent fail - preloading failure shouldn't affect UX
      }
    };

    if ('requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(preload, { timeout: 5000 });
      return () => (window as any).cancelIdleCallback(id);
    } else {
      // Fallback: setTimeout with a delay to avoid blocking
      const timeoutId = setTimeout(preload, 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [newsCache, newsLastFetched, setNewsCache]);
}
