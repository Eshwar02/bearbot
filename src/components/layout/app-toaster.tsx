'use client';

import { Toaster } from 'sonner';
import { usePrefs } from '@/lib/hooks/use-prefs';

export function AppToaster() {
  const prefs = usePrefs();
  if (!prefs.notif_in_app) return null;

  return <Toaster position="top-right" theme="dark" richColors closeButton />;
}
