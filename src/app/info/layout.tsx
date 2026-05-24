import type { Metadata } from 'next';
import { buildMetadata, routeSeo } from '@/lib/seo';
import { JsonLd, faqSchema } from '@/components/seo/json-ld';

export const metadata: Metadata = buildMetadata(routeSeo.info);

export default function InfoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={faqSchema} />
      {children}
    </>
  );
}
