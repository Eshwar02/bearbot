'use client';

import dynamic from 'next/dynamic';
import { ChatPanel } from '@/components/chat/chat-panel';
import { useAppStore } from '@/stores/app-store';

const PortfolioView = dynamic(() => import('../portfolio/page'), { ssr: false });
const DailyBriefView = dynamic(() => import('../daily-brief/page').then(m => ({ default: m.DailyBriefView })), { ssr: false });
const WatchlistView = dynamic(() => import('../watchlist/page'), { ssr: false });
const SettingsView = dynamic(() => import('../settings/page'), { ssr: false });

export default function MainAppPage() {
  const activeView = useAppStore((s) => s.activeView);

  return (
    <>
      {activeView === 'chat' && <ChatPanel />}
      {activeView === 'portfolio' && <PortfolioView />}
      {activeView === 'brief' && <DailyBriefView />}
      {activeView === 'watchlist' && <WatchlistView />}
      {activeView === 'settings' && <SettingsView />}
    </>
  );
}
