'use client';

import React, { useEffect, useRef, memo, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChartWidgetProps {
  symbol: string;
  exchange?: string;
  className?: string;
  height?: number;
  compactHeight?: number;
  expandable?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

function toTradingViewSymbol(yahooSymbol: string, exchange?: string): string {
  const suffixMap: Record<string, string> = {
    '.NS': 'NSE', '.BO': 'BSE', '.L': 'LSE', '.TO': 'TSX',
    '.V': 'TSXV', '.HK': 'HKEX', '.T': 'TSE', '.SS': 'SSE',
    '.SZ': 'SZSE', '.PA': 'EURONEXT', '.AS': 'EURONEXT',
    '.BR': 'EURONEXT', '.DE': 'XETR', '.F': 'FWB', '.MI': 'MIL',
    '.MC': 'BME', '.SW': 'SIX', '.AX': 'ASX', '.NZ': 'NZX',
    '.SA': 'BMFBOVESPA',
  };
  for (const [suffix, prefix] of Object.entries(suffixMap)) {
    if (yahooSymbol.endsWith(suffix)) {
      return `${prefix}:${yahooSymbol.slice(0, -suffix.length)}`;
    }
  }

  if (/^[A-Z]+-USD$/.test(yahooSymbol)) {
    return `BINANCE:${yahooSymbol.replace('-USD', 'USDT')}`;
  }

  // Forex pairs (e.g. EURUSD=X)
  if (/^[A-Z]{6}=X$/.test(yahooSymbol)) {
    return `FX:${yahooSymbol.replace('=X', '')}`;
  }

  // Major Indices
  const indicesMap: Record<string, string> = {
    '^GSPC': 'SP:SPX',
    '^DJI': 'DJ:DJI',
    '^IXIC': 'NASDAQ:IXIC',
    '^RUT': 'RUSSELL:RUT',
    '^VIX': 'CBOE:VIX',
    '^FTSE': 'TVC:UKX',
    '^N225': 'TVC:NI225',
    '^NSEI': 'NSE:NIFTY',
    '^BSESN': 'BSE:SENSEX',
  };
  if (indicesMap[yahooSymbol]) {
    return indicesMap[yahooSymbol];
  }

  // Futures/Commodities
  const futuresMap: Record<string, string> = {
    'GC=F': 'COMEX:GC1!', // Gold
    'SI=F': 'COMEX:SI1!', // Silver
    'CL=F': 'NYMEX:CL1!', // Crude Oil
    'NG=F': 'NYMEX:NG1!', // Natural Gas
    'ZC=F': 'CBOT:ZC1!',  // Corn
    'ZW=F': 'CBOT:ZW1!',  // Wheat
    'SB=F': 'ICEUS:SB1!', // Sugar
    'CT=F': 'ICEUS:CT1!', // Cotton
  };
  if (futuresMap[yahooSymbol]) {
    return futuresMap[yahooSymbol];
  }

  // ── Exchange-based routing for US tickers ──
  if (exchange) {
    const ex = exchange.toUpperCase();
    if (ex.includes('NASDAQ') || ex === 'NMS' || ex === 'NGM' || ex === 'NCM' || ex === 'NAS') {
      return `NASDAQ:${yahooSymbol}`;
    }
    if (ex.includes('NYSE') || ex === 'NYQ' || ex === 'NYS' || ex === 'PCX' || ex === 'ARCA' || ex === 'NYSEARCA' || ex === 'BATS') {
      return `NYSE:${yahooSymbol}`;
    }
    if (ex.includes('AMEX') || ex === 'ASE') {
      return `AMEX:${yahooSymbol}`;
    }
  }

  if (/^[A-Z][A-Z0-9.-]{0,9}$/.test(yahooSymbol) && !yahooSymbol.includes('.')) {
    return `NASDAQ:${yahooSymbol}`;
  }

  return yahooSymbol;
}

function ChartWidgetInner({
  symbol,
  exchange,
  className,
  height = 400,
  compactHeight,
  expandable = false,
  onExpandedChange,
}: ChartWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const chartHeight = expandable ? compactHeight ?? Math.round(height / 2) : height;

  useEffect(() => {
    if (!expandable) return;
    setIsExpanded(false);
    onExpandedChange?.(false);
  }, [symbol, exchange, expandable, onExpandedChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    if (scriptRef.current) {
      scriptRef.current.remove();
      scriptRef.current = null;
    }
    container.innerHTML = '';

    const tvSymbol = toTradingViewSymbol(symbol, exchange);

    const rafId = requestAnimationFrame(() => {
      if (cancelled || !containerRef.current) return;

      const widgetContainer = document.createElement('div');
      widgetContainer.className = 'tradingview-widget-container__widget';
      widgetContainer.style.height = '100%';
      widgetContainer.style.width = '100%';

      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.type = 'text/javascript';
      script.async = true;
      
      // Removed the hardcoded transparent background to allow TradingView's 
      // native, highly readable dark/light themes to render properly.
      script.innerHTML = JSON.stringify({
        autosize: true,
        symbol: tvSymbol,
        interval: 'D',
        timezone: 'Etc/UTC',
        theme: 'dark', // Note: Depending on your global state, you might want to dynamically pass 'light' or 'dark' here.
        style: '1',
        locale: 'en',
        hide_top_toolbar: false,
        hide_legend: false,
        allow_symbol_change: true,
        save_image: false,
        calendar: false,
        hide_volume: false,
        support_host: 'https://www.tradingview.com',
      });

      containerRef.current.appendChild(widgetContainer);
      containerRef.current.appendChild(script);
      scriptRef.current = script;
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      if (scriptRef.current) {
        scriptRef.current.remove();
        scriptRef.current = null;
      }
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [symbol, exchange]);

  return (
    <div
      className={cn(
        // Clean, minimal container. Focus is entirely on the chart content.
        'relative my-6 overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-300 dark:border-dark-800 dark:bg-dark-950',
        expandable && (isExpanded ? 'w-full' : 'w-full lg:w-1/2'),
        className,
      )}
      style={{ height: chartHeight }}
    >
      {expandable && (
        <button
          type="button"
          onClick={() => {
            setIsExpanded(current => {
              const next = !current;
              onExpandedChange?.(next);
              return next;
            });
          }}
          aria-label={isExpanded ? 'Collapse chart width' : 'Expand chart width'}
          title={isExpanded ? 'Collapse chart width' : 'Expand chart width'}
          className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md border border-borderSubtle bg-canvas/90 text-primary shadow-sm backdrop-blur transition hover:bg-elevated"
        >
          {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      )}
      <div
        ref={containerRef}
        className="tradingview-widget-container"
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
}

export const ChartWidget = memo(ChartWidgetInner);
