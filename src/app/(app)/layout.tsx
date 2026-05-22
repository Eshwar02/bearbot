import { AppShell } from '@/components/layout/app-shell';
import { AppToaster } from '@/components/layout/app-toaster';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppShell>{children}</AppShell>
      <AppToaster />
    </>
  );
}
