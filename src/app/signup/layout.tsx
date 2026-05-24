import type { Metadata } from 'next';
import { buildMetadata, routeSeo } from '@/lib/seo';

export const metadata: Metadata = buildMetadata(routeSeo.signup);

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
