'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/workspace');
  }, [router]);

  return <div className="min-h-screen bg-black" aria-hidden="true" />;
}
