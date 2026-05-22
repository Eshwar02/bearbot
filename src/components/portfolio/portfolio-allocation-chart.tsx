'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { PieChart } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Dynamically import react-apexcharts to prevent SSR issues (ApexCharts relies on window)
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export interface PortfolioAllocationChartProps {
  data: {
    symbol: string;
    value: number;
  }[];
}

export function PortfolioAllocationChart({ data }: PortfolioAllocationChartProps) {
  if (!data || data.length === 0) return null;

  // Sort by value descending
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  const series = sortedData.map(d => d.value);
  const labels = sortedData.map(d => d.symbol);

  // Modern, vibrant palette
  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
  ];

  const options = {
    chart: {
      type: 'donut',
      background: 'transparent',
      fontFamily: 'inherit',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    labels: labels,
    colors: colors,
    stroke: {
      show: true,
      colors: ['var(--border-strong, #2a2b36)'], // border color to separate slices
      width: 2,
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: function (val: number) {
          return formatCurrency(val);
        }
      }
    },
    legend: {
      position: 'right',
      labels: {
        colors: '#a1a1aa',
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            name: {
              color: '#a1a1aa',
              fontSize: '14px',
            },
            value: {
              color: '#f4f4f5',
              fontSize: '24px',
              fontWeight: 700,
              formatter: function (val: string) {
                return formatCurrency(Number(val));
              }
            },
            total: {
              show: true,
              label: 'Total Value',
              color: '#a1a1aa',
              fontSize: '14px',
              formatter: function (w: any) {
                const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                return formatCurrency(total);
              }
            }
          }
        }
      }
    }
  };

  return (
    <div className="mb-8 rounded-2xl border border-borderSubtle dark:border-borderStrong bg-elevated p-6">
      <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
        <PieChart className="h-5 w-5 text-accent-blue" />
        Portfolio Allocation
      </h2>
      <div className="flex justify-center" style={{ minHeight: '350px' }}>
        <Chart options={options as any} series={series} type="donut" width="100%" height={350} />
      </div>
    </div>
  );
}
