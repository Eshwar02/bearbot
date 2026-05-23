'use client';
import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, LogOut, User, ArrowLeft, Palette } from 'lucide-react';
import Image from 'next/image';
import { useAppStore } from '@/stores/app-store';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { PWAInstallButton } from '@/components/ui/pwa-install-button';
import { PersonalizationModal } from '@/components/ui/personalization-modal';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const [menuOpen, setMenuOpen] = useState(false);
  const [personalizationOpen, setPersonalizationOpen] = useState(false);
  const [initial, setInitial] = useState('A');
  const menuRef = useRef<HTMLDivElement>(null);

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
    <header className="flex h-12 shrink-0 items-center justify-between overflow-visible border-b border-borderSubtle bg-canvas/80 px-3 backdrop-blur print:hidden">
      <div className="flex items-center gap-1">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-secondary transition-colors hover:bg-elevated hover:text-primary"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          title="Toggle sidebar (Cmd/Ctrl+B)"
        >
          <Menu size={18} />
        </button>
        {pathname !== '/' && (
          <button
            onClick={handleBack}
            className="rounded-lg p-1.5 text-secondary transition-colors hover:bg-elevated hover:text-primary"
            aria-label="Go back"
            title="Go back (Alt+←)"
          >
            <ArrowLeft size={18} />
          </button>
        )}
      </div>

      <button
        onClick={() => {
          setActiveView('chat');
          router.push('/');
        }}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium text-primary transition-colors hover:bg-elevated"
        aria-label="Go to chat home"
      >
        <Image src="/logo.svg" alt="AlphaSight" width={14} height={14} />
        <span
          className="font-serif text-[16px] font-medium tracking-tight"
          style={{ fontVariationSettings: '"opsz" 24, "SOFT" 50' }}
        >
          AlphaSight
        </span>
        <span className="text-muted">/</span>
        <span className="text-secondary">Pro</span>
      </button>

      <div className="flex items-center gap-2">
        <PWAInstallButton />
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((p) => !p)}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full',
              'bg-accent-brand text-sm font-semibold text-inverse',
              'ring-1 ring-accent-brand/50 ring-offset-2 ring-offset-canvas',
              'transition-transform hover:scale-105',
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
              className="fixed right-4 top-16 z-[99999] w-60 overflow-visible rounded-xl border border-borderSubtle bg-canvas shadow-lg"
              role="menu"
            >
              {/* Personalization — placed at the top per user spec */}
              <button
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-primary transition-colors hover:bg-elevated"
                onClick={() => {
                  setMenuOpen(false);
                  setPersonalizationOpen(true);
                }}
                role="menuitem"
                aria-label="Open personalization"
              >
                <div className="flex items-center justify-center rounded-lg bg-accent-brand/15 p-1.5 text-accent-brand">
                  <Palette size={16} />
                </div>
                <div className="flex flex-col items-start">
                  <span>Personalization</span>
                  <span className="text-[10px] text-muted">Themes & appearance</span>
                </div>
              </button>
              <div className="my-1 border-t border-borderSubtle" />
              <button
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-primary transition-colors hover:bg-elevated"
                onClick={() => {
                  window.location.href = "/profile";
                }}
                role="menuitem"
                aria-label="Open profile page"
              >
                <div className="flex items-center justify-center rounded-lg bg-elevated p-1.5 text-secondary">
                  <User size={16} />
                </div>
                <span>Profile Settings</span>
              </button>
              <div className="my-1 border-t border-borderSubtle" />
              <button
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-accent-red transition-colors hover:bg-elevated"
                onClick={() => void handleSignOut()}
                role="menuitem"
                aria-label="Sign out from account"
              >
                <div className="flex items-center justify-center rounded-lg bg-accent-red/10 p-1.5 text-accent-red">
                  <LogOut size={16} />
                </div>
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <PersonalizationModal
        open={personalizationOpen}
        onClose={() => setPersonalizationOpen(false)}
      />
    </header>
  );
}