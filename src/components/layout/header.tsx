'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, LogOut, User, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useAppStore } from '@/stores/app-store';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { ThemeSwitch } from '@/components/ui/theme-switch-button';
import { PWAInstallButton } from '@/components/ui/pwa-install-button';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const [menuOpen, setMenuOpen] = useState(false);
  const [initial, setInitial] = useState('A');
  const menuRef = useRef<HTMLDivElement>(null);

  /* Close dropdown on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [menuOpen]);

  /* Fetch user initial once */
  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) return;
      const user = data.user;
      const source = user?.user_metadata?.full_name || user?.email || 'A';
      const first = source.trim().charAt(0).toUpperCase();
      if (first) setInitial(first);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    setMenuOpen(false);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace('/login');
      router.refresh();
    } catch (error) {
      logger.error('Sign out failed', error);
    }
  }, [router]);

  const handleBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    setActiveView('chat');
    router.push('/');
  }, [router, setActiveView]);

  return (
    // Replaced flat header with a floating, glassmorphic pill
    <header className="relative z-50 mx-4 mt-4 mb-2 flex h-14 shrink-0 items-center justify-between rounded-2xl border border-white/10 bg-[#ffffff05] px-4 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] dark:border-white/5 dark:bg-[#ffffff03]">
      
      {/* Subtle top edge highlight for 3D depth */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-t-2xl pointer-events-none" />

      {/* ── Left: sidebar toggle + back ──────── */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSidebar}
          className="rounded-xl p-2 text-gray-400 transition-all duration-300 hover:bg-white/10 hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          title="Toggle sidebar (Cmd/Ctrl+B)"
        >
          <Menu size={18} />
        </button>
        {pathname !== '/' && (
          <button
            onClick={handleBack}
            className="rounded-xl p-2 text-gray-400 transition-all duration-300 hover:bg-white/10 hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            aria-label="Go back"
            title="Go back (Alt+←)"
          >
            <ArrowLeft size={18} />
          </button>
        )}
      </div>

      {/* ── Center: compact brand (clickable) ── */}
      <button
        onClick={() => {
          setActiveView('chat');
          router.push('/');
        }}
        className="group flex items-center gap-2 rounded-xl px-3 py-1.5 transition-all duration-300 hover:bg-white/5"
        aria-label="Go to chat home"
      >
        <div className="relative p-1 bg-white/5 rounded-lg border border-white/10 shadow-sm group-hover:border-emerald-500/30 transition-colors">
          <img src="/logo.svg" alt="AlphaSight" width={16} height={16} />
        </div>
        <div className="flex items-center text-[14px] font-semibold tracking-wide">
          <span className="text-gray-100 group-hover:text-white transition-colors">AlphaSight</span>
          <span className="mx-1 text-white/20">/</span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">Pro</span>
        </div>
      </button>

      {/* ── Right: PWA install + theme toggle + user avatar + menu ────────── */}
      <div className="flex items-center gap-3">
        <div className="opacity-80 hover:opacity-100 transition-opacity">
           <PWAInstallButton />
        </div>
        <div className="opacity-80 hover:opacity-100 transition-opacity">
           <ThemeSwitch />
        </div>
        
        {/* Divider */}
        <div className="h-6 w-px bg-white/10 mx-1" />

        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((p) => !p)}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl',
              // Upgraded to a glowing gradient orb instead of a solid color
              'bg-gradient-to-br from-emerald-400 to-teal-600 text-[15px] font-bold text-dark-950 shadow-lg',
              'border border-emerald-300/30',
              'transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]',
            )}
            aria-label="Open user menu"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            title="User options (Cmd/Ctrl+Shift+U)"
          >
            {initial}
          </button>

          {menuOpen && (
            <div 
              className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#0a0e17]/95 py-2 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
              role="menu"
            >
              <button
                className="group flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
                onClick={() => {
                  setMenuOpen(false);
                  setActiveView('settings');
                  router.push('/');
                }}
                role="menuitem"
                aria-label="Open profile settings"
              >
                <div className="flex items-center justify-center rounded-lg bg-white/5 p-1.5 text-gray-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-colors">
                  <User size={16} />
                </div>
                <span>Profile Settings</span>
              </button>
              
              <div className="my-1.5 mx-3 border-t border-white/10" />
              
              <button
                className="group flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-red-500/10 hover:text-red-400"
                onClick={() => void handleSignOut()}
                role="menuitem"
                aria-label="Sign out from account"
              >
                <div className="flex items-center justify-center rounded-lg bg-white/5 p-1.5 text-gray-400 group-hover:text-red-400 group-hover:bg-red-500/20 transition-colors">
                  <LogOut size={16} />
                </div>
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}