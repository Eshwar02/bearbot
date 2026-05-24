import type { Metadata } from 'next';
import { buildMetadata, routeSeo } from '@/lib/seo';

export const metadata: Metadata = buildMetadata(routeSeo.login);

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
