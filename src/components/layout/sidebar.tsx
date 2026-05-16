'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Plus,
  MessageSquare,
  Briefcase,
  Sun,
  Star,
  Settings,
  ChevronLeft,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore, type AppView } from '@/stores/app-store';
import type { Conversation } from '@/types/database';

/* ── Date grouping helpers ───────────────────────────────────────── */

function startOfDay(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function groupConversations(conversations: Conversation[]) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = todayStart - 86_400_000;
  const sevenDaysAgo = todayStart - 7 * 86_400_000;

  const groups: { label: string; items: Conversation[] }[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Previous 7 Days', items: [] },
    { label: 'Older', items: [] },
  ];

  const sorted = [...conversations].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  for (const conv of sorted) {
    const ts = new Date(conv.updated_at).getTime();
    if (ts >= todayStart) groups[0].items.push(conv);
    else if (ts >= yesterdayStart) groups[1].items.push(conv);
    else if (ts >= sevenDaysAgo) groups[2].items.push(conv);
    else groups[3].items.push(conv);
  }

  return groups.filter((g) => g.items.length > 0);
}

/* ── Nav links ───────────────────────────────────────────────────── */

const navLinks = [
  { view: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { view: 'brief', label: 'Daily Brief', icon: Sun },
  { view: 'watchlist', label: 'Watchlist', icon: Star },
  { view: 'settings', label: 'Settings', icon: Settings },
] as const;

/* ── Sidebar overlay (mobile) ────────────────────────────────────── */

function MobileBackdrop({ onClick }: { onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed inset-0 z-40 bg-[#03060D]/80 backdrop-blur-sm md:hidden"
      onClick={onClick}
    />
  );
}

/* ── Main Sidebar ────────────────────────────────────────────────── */

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const conversations = useAppStore((s) => s.conversations);
  const activeConversationId = useAppStore((s) => s.activeConversationId);
  const setActiveConversation = useAppStore((s) => s.setActiveConversation);
  const activeView = useAppStore((s) => s.activeView);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const createNewChat = useAppStore((s) => s.createNewChat);
  const deleteConversation = useAppStore((s) => s.deleteConversation);

  const grouped = useMemo(() => groupConversations(conversations), [conversations]);

  const handleNewChat = useCallback(() => {
    createNewChat();
    setActiveView('chat');
    if (pathname !== '/') {
      router.push('/');
    }
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile) toggleSidebar();
  }, [createNewChat, pathname, router, setActiveView, toggleSidebar]);

  const handleSelectChat = useCallback(
    (id: string) => {
      setActiveConversation(id);
      setActiveView('chat');
      router.push(`/chat/${id}`);
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      if (isMobile) toggleSidebar();
    },
    [router, setActiveConversation, setActiveView, toggleSidebar]
  );

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/conversations/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) return;
        deleteConversation(id);
      } catch {
        // ignore delete failures in UI
      }
    },
    [deleteConversation]
  );

  const handleViewSelect = useCallback(
    (view: AppView) => {
      setActiveView(view);
      const routes: Record<AppView, string> = {
        chat: '/',
        portfolio: '/portfolio',
        brief: '/daily-brief',
        watchlist: '/watchlist',
        settings: '/settings',
      };
      router.push(routes[view]);
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      if (isMobile) toggleSidebar();
    },
    [router, setActiveView, toggleSidebar]
  );

  const sidebarContent = (
    // Replaced flat gray with deep space acrylic glassmorphism
    <div className="relative flex h-full flex-col bg-[#03060D]/95 backdrop-blur-3xl border-r border-white/5 text-sm overflow-hidden">
      
      {/* Subtle top-left ambient glow inside sidebar */}
      <div className="absolute top-0 left-0 w-full h-64 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none" />

      {/* ── Brand row ────────────────────────── */}
      <div className="relative flex items-center justify-between px-4 pt-5 pb-4 z-10">
        <div className="flex items-center gap-3 px-1">
          <div className="relative flex items-center justify-center p-1.5 bg-white/5 rounded-xl border border-white/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
             <Image src="/logo.svg" alt="AlphaSight" width={22} height={22} />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-white drop-shadow-md">
            AlphaSight
          </span>
        </div>
        <button
          onClick={toggleSidebar}
          className="rounded-xl p-2 text-gray-400 transition-all duration-300 hover:bg-white/10 hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] md:hidden"
          aria-label="Close sidebar"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* ── New Chat button ──────────────────── */}
      <div className="px-4 pb-6 relative z-10">
        <button
          onClick={handleNewChat}
          className={cn(
            'group flex w-full items-center gap-3 rounded-2xl px-4 py-3.5',
            // Upgraded to a glowing neon pill
            'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-[14px] font-semibold text-emerald-400 shadow-[0_4px_20px_rgba(0,0,0,0.3)]',
            'transition-all duration-300 ease-out',
            'hover:border-emerald-400/50 hover:from-emerald-500/20 hover:to-teal-500/20 hover:shadow-[0_0_25px_rgba(16,185,129,0.2)] hover:text-emerald-300 hover:-translate-y-0.5',
          )}
        >
          <Plus size={18} strokeWidth={2.5} className="transition-transform duration-300 group-hover:rotate-90" />
          <span>New Chat</span>
        </button>
      </div>

      {/* ── Chat history ─────────────────────── */}
      <div className="relative z-10 flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
        {grouped.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 opacity-50">
            <MessageSquare size={24} className="mb-3 text-gray-500" />
            <p className="text-xs text-gray-400 font-medium tracking-wide">
              No conversations yet
            </p>
          </div>
        )}
        
        {grouped.map((group) => (
          <div key={group.label} className="mb-6">
            <h3 className="mb-2 px-3 text-[11px] font-bold uppercase tracking-widest text-gray-500/80">
              {group.label}
            </h3>
            <div className="space-y-1">
              {group.items.map((conv) => {
                const isActive = conv.id === activeConversationId;
                return (
                  <div
                    key={conv.id}
                    className={cn(
                      'group relative flex cursor-pointer items-center rounded-xl px-3 py-2.5',
                      'transition-all duration-300 ease-out overflow-hidden',
                      isActive
                        ? 'bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
                        : 'text-gray-400 hover:bg-white/5 hover:text-gray-200',
                    )}
                    onClick={() => handleSelectChat(conv.id)}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    )}
                    
                    <MessageSquare
                      size={15}
                      className={cn(
                        'mr-3 shrink-0 transition-colors duration-300',
                        isActive ? 'text-emerald-400' : 'text-gray-500 group-hover:text-gray-400',
                      )}
                    />
                    
                    <span className="flex-1 truncate text-[13px] font-medium leading-relaxed">
                      {conv.title}
                    </span>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDeleteConversation(conv.id);
                      }}
                      className={cn(
                        "ml-2 shrink-0 rounded-lg p-1.5 opacity-0 transition-all duration-200",
                        "text-gray-500 hover:bg-red-500/20 hover:text-red-400",
                        "group-hover:opacity-100" // Only shows on parent hover
                      )}
                      aria-label="Delete conversation"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom nav ───────────────────────── */}
      <div className="relative z-10 border-t border-white/5 bg-[#03060D]/80 p-3 backdrop-blur-xl">
        <div className="space-y-1">
          {navLinks.map((link) => {
            const isActive = activeView === link.view;
            return (
              <button
                key={link.view}
                onClick={() => handleViewSelect(link.view)}
                className={cn(
                  'relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-medium',
                  'transition-all duration-300 overflow-hidden',
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/10 to-transparent text-emerald-400'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200',
                )}
              >
                {isActive && (
                   <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-400" />
                )}
                <link.icon
                  size={18}
                  className={isActive ? 'text-emerald-400' : 'text-gray-500'}
                />
                <span>{link.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <MobileBackdrop onClick={toggleSidebar} />
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            key="sidebar"
            initial={{ x: -280, opacity: 0 }} // Slightly wider animation sweep
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} // Springier, premium easing
            className="fixed left-0 top-0 z-50 h-full w-[280px] md:static md:z-auto shadow-[20px_0_40px_rgba(0,0,0,0.5)] md:shadow-none"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}