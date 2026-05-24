'use client';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
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
    <header className="relative z-30 flex h-12 shrink-0 items-center justify-between overflow-visible border-b border-borderSubtle bg-canvas/80 px-3 backdrop-blur print:hidden">
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

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <PWAInstallButton />
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((p) => !p)}
            className="relative"
            aria-label="Open user menu"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            title="User options (Cmd/Ctrl+Shift+U)"
          >
            <Avatar className="h-8 w-8 ring-1 ring-accent-brand/50 ring-offset-2 ring-offset-canvas">
              <AvatarFallback className="bg-accent-brand text-sm font-semibold text-inverse">
                {initial}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -end-1 -top-1">
              <span className="sr-only">Verified</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  className="fill-background"
                  d="M3.046 8.277A4.402 4.402 0 0 1 8.303 3.03a4.4 4.4 0 0 1 7.411 0 4.397 4.397 0 0 1 5.19 3.068c.207.713.23 1.466.067 2.19a4.4 4.4 0 0 1 0 7.415 4.403 4.403 0 0 1-3.06 5.187 4.398 4.398 0 0 1-2.186.072 4.398 4.398 0 0 1-7.422 0 4.398 4.398 0 0 1-5.257-5.248 4.4 4.4 0 0 1 0-7.437Z"
                />
                <path
                  className="fill-accent-brand"
                  d="M4.674 8.954a3.602 3.602 0 0 1 4.301-4.293 3.6 3.6 0 0 1 6.064 0 3.598 3.598 0 0 1 4.3 4.302 3.6 3.6 0 0 1 0 6.067 3.6 3.6 0 0 1-4.29 4.302 3.6 3.6 0 0 1-6.074 0 3.598 3.598 0 0 1-4.3-4.293 3.6 3.6 0 0 1 0-6.085Z"
                />
                <path
                  className="fill-background"
                  d="M15.707 9.293a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 1 1 1.414-1.414L11 12.586l3.293-3.293a1 1 0 0 1 1.414 0Z"
                />
              </svg>
            </span>
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-full z-[99999] mt-2 w-[min(15rem,calc(100vw-1rem))] overflow-visible rounded-xl border border-borderSubtle bg-canvas shadow-lg"
              role="menu"
              onPointerDown={(e) => e.stopPropagation()}
            >
              {/* Personalization — placed at the top per user spec */}
              <button
                type="button"
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
                type="button"
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-primary transition-colors hover:bg-elevated"
                onClick={() => {
                  setMenuOpen(false);
                  router.push('/profile');
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
                type="button"
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
