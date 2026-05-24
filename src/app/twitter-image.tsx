import { ImageResponse } from 'next/og';
import { siteConfig } from '@/lib/seo';

export const runtime = 'edge';
export const alt = 'AlphaSight AI — AI-Powered Stock Analysis & Market Intelligence';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background:
            'linear-gradient(135deg, #0f172a 0%, #1f2937 50%, #111827 100%)',
          color: '#fff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <img src={`${siteConfig.url}/logo.svg`} alt="AlphaSight AI logo" width={64} height={64} />
          <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1 }}>
            AlphaSight AI
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 1000,
            }}
          >
            AI-Powered Stock Intelligence
          </div>
          <div style={{ fontSize: 32, color: '#94a3b8', maxWidth: 1000 }}>
            Streaming chat, real-time portfolios, daily market briefs.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 24,
            color: '#94a3b8',
          }}
        >
          <div>chat.alphasightai.online</div>
          <div style={{ display: 'flex', gap: 30 }}>
            <span>Real-time data</span>
            <span>•</span>
            <span>LLM research</span>
            <span>•</span>
            <span>Portfolio AI</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
