'use client';

import { useRouter } from 'next/navigation';
import { Hero } from '@/components/ui/animated-hero';
import { Button } from '@/components/ui/button';

export default function InfoPage() {
  const router = useRouter();

  const goToLogin = () => {
    router.push('/login');
  };

  return (
    <main className="relative min-h-screen w-full bg-canvas text-primary flex flex-col">
      <header className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-6 py-4 md:px-10 md:py-6">
        <span className="font-serif text-lg md:text-xl tracking-tightish">
          AlphaSight AI
        </span>
        <Button variant="primary" size="sm" onClick={goToLogin}>
          Log in
        </Button>
      </header>

      <div className="flex-1 flex items-center justify-center">
        <Hero
          primaryLabel="Sign up here"
          secondaryLabel="Jump on a call"
          onPrimaryClick={goToLogin}
          onSecondaryClick={goToLogin}
        />
      </div>
    </main>
  );
}
