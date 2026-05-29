import { AppShell } from '@/components/layout/app-shell';
import { AppToaster } from '@/components/layout/app-toaster';
import { SiteFooter } from '@/components/layout/site-footer';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppShell>
        {children}
        <SiteFooter />
      </AppShell>
      <AppToaster />
    </>
  );
}
