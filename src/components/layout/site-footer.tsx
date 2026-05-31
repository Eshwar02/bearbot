import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { ThemeColumn } from '@/components/layout/theme-column';

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-borderSubtle bg-canvas/40">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Image src="/logo.svg" width={28} height={28} alt="" />
              <span className="font-semibold text-primary">alphasightai</span>
            </div>
            <p className="text-sm text-secondary">
              AI-native stock intelligence for the modern investor.
            </p>
            <p className="text-xs text-muted">
              AlphaSight AI Pvt Ltd &copy; 2024-{year}
            </p>
            <p className="flex items-center gap-1 text-xs text-muted">
              <span>Made with</span>
              <Heart className="h-3.5 w-3.5 fill-accent-red text-accent-red" />
              <span>in India.</span>
            </p>
            <p className="text-xs text-muted">
              Data provided by Yahoo Finance &middot; Cerebras AI
            </p>
            <p className="text-xs text-muted">
              <Link href="/terms" className="hover:text-primary">
                Terms
              </Link>
              {' '}&middot;{' '}
              <Link href="/privacy" className="hover:text-primary">
                Privacy
              </Link>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                Product
              </h3>
              <Link href="/info" className="text-sm text-secondary hover:text-primary">
                Premium
              </Link>
              <Link href="/info" className="text-sm text-secondary hover:text-primary">
                What&apos;s new
              </Link>
              <Link href="/info" className="text-sm text-secondary hover:text-primary">
                Learn
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                Team
              </h3>
              <Link href="/about" className="text-sm text-secondary hover:text-primary">
                About us
              </Link>
              <Link href="/contact" className="text-sm text-secondary hover:text-primary">
                Support
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                Theme
              </h3>
              <ThemeColumn />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
