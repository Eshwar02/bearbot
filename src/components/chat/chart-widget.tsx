'use client';

import React, { useEffect, useRef, memo } from 'react';
import { cn } from '@/lib/utils';

interface ChartWidgetProps {
  symbol: string;
  exchange?: string;
  className?: string;
  height?: number;
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

function ChartWidgetInner({ symbol, exchange, className, height = 400 }: ChartWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

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
      script.innerHTML = JSON.stringify({
        autosize: true,
        symbol: tvSymbol,
        interval: 'D',
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'en',
        // Darkened the background to match our #03060D theme seamlessly
        backgroundColor: 'rgba(3, 6, 13, 0)', 
        gridColor: 'rgba(255, 255, 255, 0.05)',
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
        // High-end SaaS Glassmorphism Wrapper
        'group relative my-6 overflow-hidden rounded-3xl border border-white/10 bg-[#ffffff05] backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all duration-500 hover:border-white/20 hover:shadow-[0_10px_50px_rgba(16,185,129,0.1)]',
        className,
      )}
      style={{ height }}
    >
      {/* Decorative top glowing edge */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10" />
      
      <div
        ref={containerRef}
        className="tradingview-widget-container relative z-0"
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
}

export const ChartWidget = memo(ChartWidgetInner);