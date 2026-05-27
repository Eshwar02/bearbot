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
import { useAuth } from '@/lib/hooks/use-auth';
import type { Conversation } from '@/types/database';

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

const navLinks = [
  { view: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { view: 'brief', label: 'Daily Brief', icon: Sun },
  { view: 'watchlist', label: 'Watchlist', icon: Star },
  { view: 'settings', label: 'Settings', icon: Settings },
] as const;

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
  const { user } = useAuth();
  const isGuest = !user;

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
        // ignore
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
    <div className="flex h-full flex-col bg-sidebar text-sm font-sans">
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <button
          onClick={() => {
            createNewChat();
            setActiveView('chat');
            if (pathname !== '/') router.push('/');
            const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
            if (isMobile) toggleSidebar();
          }}
          className="flex items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-elevated"
          aria-label="Start a new chat"
        >
          <Image src="/logo.svg" alt="AlphaSight" width={20} height={20} />
          <span
            className="font-serif text-[19px] font-medium leading-none tracking-tight text-primary"
            style={{ fontVariationSettings: '"opsz" 36, "SOFT" 50' }}
          >
            AlphaSight
          </span>
        </button>
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-secondary transition-colors hover:bg-elevated hover:text-primary"
          aria-label="Close sidebar"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      <div className="px-3 pb-3">
        <button
          onClick={handleNewChat}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg px-3 py-2',
            'border border-borderSubtle bg-canvas text-[13px] font-medium text-primary',
            'transition-all duration-150',
            'hover:border-accent-brand/40 hover:bg-elevated',
          )}
        >
          <Plus size={16} strokeWidth={2} className="text-gray-500 dark:text-gray-400" />
          <span className="leading-relaxed tracking-tightish">New chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-borderStrong">
        {isGuest && (
          <div className="mx-1 mt-2 rounded-lg border border-borderSubtle bg-canvas px-3 py-3 text-[12px] leading-relaxed text-secondary">
            <p className="mb-2 text-primary">You&apos;re using AlphaSight as a guest.</p>
            <p className="mb-3 text-muted">
              Use the top-right Log in button to save chats and unlock Portfolio, Watchlist, and the
              Daily Brief.
            </p>
          </div>
        )}
        {!isGuest && grouped.length === 0 && (
          <p className="px-3 py-8 text-center text-xs text-muted">
            No conversations yet
          </p>
        )}

        {!isGuest && grouped.map((group) => (
          <div key={group.label} className="mb-4">
              <h3 className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted">
                {group.label}
              </h3>
            {group.items.map((conv) => {
              const isActive = conv.id === activeConversationId;
              return (
                <div
                  key={conv.id}
                  className={cn(
                    'group relative flex cursor-pointer items-center rounded-lg px-3 py-1.5',
                    'transition-colors duration-100',
                    isActive ? 'bg-elevated text-primary' : 'text-secondary',
                  )}
                  onClick={() => handleSelectChat(conv.id)}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-accent-brand" />
                  )}
                  <MessageSquare
                    size={13}
                    className={cn(
                      'mr-2.5 shrink-0',
                      isActive ? 'text-accent-brand' : 'text-muted',
                    )}
                  />
                  <span className="flex-1 truncate text-[13px] leading-relaxed tracking-tightish">
                    {conv.title}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDeleteConversation(conv.id);
                    }}
                    className="ml-1 hidden shrink-0 rounded p-1 text-muted transition-colors hover:bg-elevated-hover hover:text-accent-red group-hover:block"
                    aria-label="Delete conversation"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className={cn('border-t border-borderSubtle p-2', isGuest && 'hidden')}>
        {navLinks.map((link) => {
          const isActive = activeView === link.view;
          return (
            <button
              key={link.view}
              onClick={() => handleViewSelect(link.view)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px]',
                'transition-colors duration-100',
                isActive
                  ? 'bg-elevated font-medium text-primary'
                  : 'text-secondary hover:bg-elevated hover:text-primary',
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-accent-brand" />
              )}
              <link.icon
                size={15}
                className={isActive ? 'text-accent-brand' : undefined}
              />
              <span className="leading-relaxed tracking-tightish">{link.label}</span>
            </button>
          );
        })}
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
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="fixed left-0 top-0 z-40 h-full w-[260px] md:static md:z-auto print:hidden"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}