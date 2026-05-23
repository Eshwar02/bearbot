'use client';

import { Toaster } from 'sonner';
import { usePrefs } from '@/lib/hooks/use-prefs';
import { useTheme } from '@/components/theme-provider';

export function AppToaster() {
  const prefs = usePrefs();
  const { theme } = useTheme();
  if (!prefs.notif_in_app) return null;

  const toasterTheme = theme === 'light' || theme === 'sandal' ? 'light' : 'dark';

  return <Toaster position="top-right" theme={toasterTheme} richColors closeButton />;
}
