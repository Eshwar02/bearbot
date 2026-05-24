import { AppShell } from '@/components/layout/app-shell';
import { AppToaster } from '@/components/layout/app-toaster';
import type { Metadata } from 'next';
import { buildMetadata, routeSeo } from '@/lib/seo';

export const metadata: Metadata = buildMetadata(routeSeo.workspace);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppShell>{children}</AppShell>
      <AppToaster />
    </>
  );
}
