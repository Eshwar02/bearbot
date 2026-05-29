import type { NewsItem } from "@/types/stock";
import { stockCache, CACHE_TTL } from "./cache";

const MARKETAUX_API_KEY = process.env.MARKETAUX_API_KEY;
const NEWSAPI_API_KEY = process.env.NEWSAPI_API_KEY || process.env.NEWSDATA_API_KEY;
const MAX_NEWS_ITEMS = 30;

const SOURCE_SITES = [
  "mint",
  "goodreturns",
  "moneycontrol",
  "economictimes",
  "livemint",
  "business-standard",
  "reuters",
  "bloomberg",
];

const COMPANY_PRODUCT_THEMES: Array<{
  matcher: RegExp;
  themes: string[];
}> = [
  {
    matcher: /\b(amara\s*raja|amararaja|are&m|amara\s*raja\s*energy)\b/i,
    themes: [
      "lithium battery",
      "lithium ion cell",
      "ev battery",
      "energy storage battery",
      "lead acid battery",
    ],
  },
  {
    matcher: /\b(reliance|ril)\b/i,
    themes: ["petrochemicals", "new energy", "solar", "green hydrogen"],
  },
];

function cleanSymbol(symbol: string): string {
  return symbol.replace(/\.(NS|BO)$/, "").trim();
}

function decodeXmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
}

function extractTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return decodeXmlEntities(match?.[1]?.trim() || "");
}

function sourceFromLink(link: string): string {
  try {
    const host = new URL(link).hostname.toLowerCase();
    if (host.includes("mint")) return "Mint";
    if (host.includes("goodreturns")) return "GoodReturns";
    if (host.includes("moneycontrol")) return "Moneycontrol";
    if (host.includes("economictimes")) return "Economic Times";
    if (host.includes("livemint")) return "Mint";
    if (host.includes("reuters")) return "Reuters";
    if (host.includes("bloomberg")) return "Bloomberg";
    if (host.includes("ndtv")) return "NDTV Profit";
    if (host.includes("thehindu")) return "The Hindu";
    if (host.includes("timesofindia")) return "Times of India";
    if (host.includes("indiatimes")) return "India Times";
    if (host.includes("cnbc")) return "CNBC";
    if (host.includes("yahoo")) return "Yahoo Finance";
    return host.replace(/^www\./, "");
  } catch {
    return "Google News";
  }
}

function fetchOptions(refresh = false): RequestInit {
  return refresh ? { cache: 'no-store' } : { next: { revalidate: 300 } };
}

async function fetchNewsdataNews(symbol: string, companyName: string, refresh = false): Promise<NewsItem[]> {
  if (!NEWSAPI_API_KEY) return [];

  try {
    const query = companyName || cleanSymbol(symbol);
    const url = `https://newsapi.org/v2/everything?apiKey=${NEWSAPI_API_KEY}&q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=10`;
    const res = await fetch(url, fetchOptions(refresh));
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.articles || !Array.isArray(data.articles)) return [];

    return data.articles.map((article: any) => ({
      title: article.title || '',
      url: article.url || '',
      source: article.source?.name || 'NewsAPI',
      publishedAt: article.publishedAt || new Date().toISOString(),
      summary: article.description || article.title || '',
      imageUrl: article.urlToImage || undefined,
    }));
  } catch {
    return [];
  }
}

async function fetchMarketauxNews(symbol: string, refresh = false): Promise<NewsItem[]> {
  if (!MARKETAUX_API_KEY) return [];

  try {
    const clean = cleanSymbol(symbol);
    const url = `https://api.marketaux.com/v1/news/all?symbols=${clean}&filter_entities=true&language=en&api_token=${MARKETAUX_API_KEY}&limit=10`;
    const res = await fetch(url, fetchOptions(refresh));
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.data || !Array.isArray(data.data)) return [];

    return data.data.map((article: any) => ({
      title: article.title || '',
      url: article.url || '',
      source: article.source || 'MarketAux',
      publishedAt: article.published_at || new Date().toISOString(),
      summary: article.description || article.snippet || article.title || '',
      imageUrl: article.image_url || undefined,
    }));
  } catch {
    return [];
  }
}

async function fetchGoogleNewsRss(query: string, limit = 10, refresh = false): Promise<NewsItem[]> {
  if (!query.trim()) return [];

  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
    const res = await fetch(url, refresh ? { cache: 'no-store' } : { next: { revalidate: 120 } });
    if (!res.ok) return [];
    const xml = await res.text();

    const items: NewsItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match: RegExpExecArray | null = itemRegex.exec(xml);

    while (match && items.length < limit) {
      const block = match[1];
      const title = extractTag(block, "title");
      const link = extractTag(block, "link");
      const pubDate = extractTag(block, "pubDate");
      const description = extractTag(block, "description");
      const source = sourceFromLink(link);
      let imageUrl: string | undefined;
      const enclosureMatch = block.match(/<enclosure[^>]*url="([^"]+)"/i);
      if (enclosureMatch) {
        imageUrl = enclosureMatch[1];
      } else {
        const descImgMatch = description.match(
          /<img[^>]+src=["']([^"']+)["']/i
        );
        if (descImgMatch) {
          const src = descImgMatch[1];
          if (src.startsWith('http')) imageUrl = src;
        }
      }

      if (title && link) {
        items.push({
          title,
          url: link,
          source,
          publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          summary: description || title,
          imageUrl,
        });
      }

      match = itemRegex.exec(xml);
    }

    return items;
  } catch {
    return [];
  }
}

function deriveThemeQueries(symbol: string, companyName: string): string[] {
  const base = `${companyName || cleanSymbol(symbol)}`.trim();
  const themeSet = new Set<string>();

  for (const entry of COMPANY_PRODUCT_THEMES) {
    if (entry.matcher.test(base) || entry.matcher.test(symbol)) {
      for (const t of entry.themes) themeSet.add(`${base} ${t}`);
    }
  }

  return Array.from(themeSet);
}

async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;

    const html = await res.text();
    const match = html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
    );
    if (match) return match[1];

    const matchAlt = html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i
    );
    return matchAlt ? matchAlt[1] : null;
  } catch {
    return null;
  }
}

async function enrichNewsImages(items: NewsItem[]): Promise<NewsItem[]> {
  const missing = items
    .map((item, i) => ({ item, index: i }))
    .filter(({ item }) => !item.imageUrl);

  if (missing.length === 0) return items;

  const concurrency = 5;
  for (let start = 0; start < missing.length; start += concurrency) {
    const batch = missing.slice(start, start + concurrency);
    const results = await Promise.all(
      batch.map(async ({ item, index }) => {
        const imageUrl = await fetchOgImage(item.url);
        return { index, imageUrl };
      })
    );

    for (const { index, imageUrl } of results) {
      if (imageUrl) items[index].imageUrl = imageUrl;
    }
  }

  return items;
}

function deduplicate(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function fetchStockNews(
  symbol: string,
  companyName: string = "",
  extraThemeQueries: string[] = [],
  refresh = false
): Promise<NewsItem[]> {
  const cacheKey = `news:${symbol.toUpperCase()}:${companyName}`;

  if (!refresh) {
    const cached = stockCache.get<NewsItem[]>(cacheKey);
    if (cached) return cached;
  }

  const themeQueries =
    extraThemeQueries.length > 0
      ? extraThemeQueries
      : deriveThemeQueries(symbol, companyName);

  const cleanSym = cleanSymbol(symbol);
  const name = companyName || cleanSym;

  const [marketauxNews, newsdataNews] = await Promise.all([
    fetchMarketauxNews(symbol, refresh),
    fetchNewsdataNews(symbol, name, refresh),
  ]);

  const newsItems: NewsItem[] = [...marketauxNews, ...newsdataNews];

  const siteFilter = SOURCE_SITES.map((s) => `site:${s}`).join(" OR ");
  const googleNamed = await fetchGoogleNewsRss(`${name} (${siteFilter})`, 10, refresh);
  newsItems.push(...googleNamed);

  const googleTicker = await fetchGoogleNewsRss(`${cleanSym} stock (${siteFilter})`, 8, refresh);
  newsItems.push(...googleTicker);

  if (newsItems.length < 5) {
    const googleBroad = await fetchGoogleNewsRss(`${name} stock news`, 10, refresh);
    newsItems.push(...googleBroad);
  }

  for (const q of themeQueries.slice(0, 3)) {
    const thematic = await fetchGoogleNewsRss(`${q} (${siteFilter})`, 6, refresh);
    newsItems.push(...thematic);
  }

  if (newsItems.length === 0) return [];

  const unique = deduplicate(newsItems)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, MAX_NEWS_ITEMS);

  if (unique.length > 0) {
    stockCache.set(cacheKey, unique, CACHE_TTL.NEWS);
  }

  return unique;
}

export { enrichNewsImages };

export async function fetchTopicNews(
  queries: string[],
  limitPerQuery = 10,
  maxTotal = 25,
  refresh = false
): Promise<NewsItem[]> {
  const results = await Promise.all(
    queries.map(async (q) => {
      const cacheKey = `topic:${q}`;

      if (!refresh) {
        const cached = stockCache.get<NewsItem[]>(cacheKey);
        if (cached) return cached;
      }

      const siteFilter = SOURCE_SITES.map((s) => `site:${s}`).join(" OR ");
      const named = await fetchGoogleNewsRss(`${q} (${siteFilter})`, limitPerQuery, refresh);
      const broad = await fetchGoogleNewsRss(`${q}`, limitPerQuery, refresh);

      const combined = deduplicate([...named, ...broad])
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, limitPerQuery);

      if (combined.length > 0) {
        stockCache.set(cacheKey, combined, CACHE_TTL.NEWS);
      }
      return combined;
    })
  );

  return deduplicate(results.flat())
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, maxTotal);
}
