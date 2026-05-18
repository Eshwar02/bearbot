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
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-40 bg-black/40 md:hidden"
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
    // Minimal, flat productivity theme
    <div className="flex h-full flex-col bg-gray-50 border-r border-gray-200 dark:bg-[#171717] dark:border-dark-800 text-sm overflow-hidden">
      
      {/* ── Brand row ────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="AlphaSight" width={20} height={20} className="dark:opacity-90" />
          <span className="text-[14px] font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            AlphaSight
          </span>
        </div>
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-dark-800 dark:hover:text-gray-200 md:hidden"
          aria-label="Close sidebar"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* ── New Chat button ──────────────────── */}
      <div className="px-3 pb-4 pt-2">
        <button
          onClick={handleNewChat}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg px-3 py-2',
            'border border-gray-200 bg-white text-[13px] font-medium text-gray-900',
            'dark:border-dark-700 dark:bg-dark-900 dark:text-gray-100',
            'transition-colors duration-150',
            'hover:bg-gray-100 dark:hover:bg-dark-800',
          )}
        >
          <Plus size={16} strokeWidth={2} className="text-gray-500 dark:text-gray-400" />
          <span>New chat</span>
        </button>
      </div>

      {/* ── Chat history ─────────────────────── */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-dark-700">
        {grouped.length === 0 && (
          <p className="px-3 py-8 text-center text-xs text-gray-500 dark:text-dark-500">
            No conversations yet
          </p>
        )}
        
        {grouped.map((group) => (
          <div key={group.label} className="mb-5">
            <h3 className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-dark-400">
              {group.label}
            </h3>
            <div className="space-y-0.5">
              {group.items.map((conv) => {
                const isActive = conv.id === activeConversationId;
                return (
                  <div
                    key={conv.id}
                    className={cn(
                      'group relative flex cursor-pointer items-center rounded-lg px-3 py-2',
                      'transition-colors duration-150',
                      isActive
                        ? 'bg-gray-200 text-gray-900 dark:bg-dark-800 dark:text-gray-100'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-dark-800/60 dark:hover:text-gray-200',
                    )}
                    onClick={() => handleSelectChat(conv.id)}
                  >
                    <MessageSquare
                      size={14}
                      className={cn(
                        'mr-2.5 shrink-0',
                        isActive ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-dark-500',
                      )}
                    />
                    
                    <span className="flex-1 truncate text-[13px]">
                      {conv.title}
                    </span>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDeleteConversation(conv.id);
                      }}
                      className={cn(
                        "ml-1 hidden shrink-0 rounded p-1 transition-colors",
                        "text-gray-400 hover:bg-white hover:text-red-500 dark:hover:bg-dark-900 dark:hover:text-red-400",
                        "group-hover:block"
                      )}
                      aria-label="Delete conversation"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom nav ───────────────────────── */}
      <div className="border-t border-gray-200 bg-gray-50 p-2 dark:border-dark-800 dark:bg-[#171717]">
        <div className="space-y-0.5">
          {navLinks.map((link) => {
            const isActive = activeView === link.view;
            return (
              <button
                key={link.view}
                onClick={() => handleViewSelect(link.view)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium',
                  'transition-colors duration-150',
                  isActive
                    ? 'bg-gray-200 text-gray-900 dark:bg-dark-800 dark:text-gray-100'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-dark-800/60 dark:hover:text-gray-200',
                )}
              >
                <link.icon
                  size={16}
                  className={isActive ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-dark-500'}
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
            initial={{ x: -260, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -260, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }} // Snappy, standard animation
            className="fixed left-0 top-0 z-50 h-full w-[260px] md:static md:z-auto shadow-xl md:shadow-none"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}