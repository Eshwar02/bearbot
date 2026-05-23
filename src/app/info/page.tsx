'use client';

import { useRouter } from 'next/navigation';
import { Hero } from '@/components/ui/animated-hero';
import { Button } from '@/components/ui/button';
import { ShaderAnimation } from '@/components/ui/shader-lines';

export default function InfoPage() {
  const router = useRouter();

  const goToLogin = () => {
    router.push('/login');
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black">
      <div className="fixed inset-0 w-full h-full">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <ShaderAnimation />
      </div>

      <header className="relative z-20 flex items-center justify-between px-6 py-4 md:px-10 md:py-6">
        <span className="font-serif text-lg md:text-xl tracking-tightish text-white">
          AlphaSight AI
        </span>
        <Button variant="primary" size="sm" onClick={goToLogin}>
          Log in
        </Button>
      </header>

      <div className="relative z-20 flex-1 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <Hero
          inverted
          primaryLabel="Get Started"
          secondaryLabel="Learn More"
          onPrimaryClick={goToLogin}
          onSecondaryClick={goToLogin}
        />
      </div>
    </main>
  );
}
