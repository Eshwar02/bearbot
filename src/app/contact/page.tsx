import type { Metadata } from 'next';
import { buildMetadata, routeSeo, siteConfig } from '@/lib/seo';
import { LegalPage } from '@/components/seo/legal-page';
import { JsonLd } from '@/components/seo/json-ld';

export const metadata: Metadata = buildMetadata(routeSeo.contact);

const contactSchema = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Contact AlphaSight AI',
  url: `${siteConfig.url}/contact`,
  description: routeSeo.contact.description,
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url },
    { '@type': 'ListItem', position: 2, name: 'Contact', item: `${siteConfig.url}/contact` },
  ],
};

export default function ContactPage() {
  return (
    <>
      <JsonLd data={contactSchema} />
      <JsonLd data={breadcrumbSchema} />
      <LegalPage title="Contact Us" updated="May 24, 2026">
        <p>We&apos;d love to hear from you. Pick the lane that fits.</p>

        <h2>Support</h2>
        <p>
          Trouble signing in, missing data, billing? Email{' '}
          <a href={`mailto:${siteConfig.email}?subject=Support`}>{siteConfig.email}</a>. We aim to
          respond within one business day.
        </p>

        <h2>Partnerships &amp; press</h2>
        <p>
          Integrations, data partnerships, media inquiries —{' '}
          <a href={`mailto:${siteConfig.email}?subject=Partnership`}>{siteConfig.email}</a>.
        </p>

        <h2>Security &amp; responsible disclosure</h2>
        <p>
          Found a vulnerability? Please report it privately to{' '}
          <a href={`mailto:${siteConfig.email}?subject=Security`}>{siteConfig.email}</a>. See our{' '}
          <a href="/.well-known/security.txt">security.txt</a>. We acknowledge reports within 48
          hours and do not pursue legal action against good-faith researchers.
        </p>

        <h2>Hiring</h2>
        <p>
          Engineers, designers, quants, and finance researchers — write to{' '}
          <a href={`mailto:${siteConfig.email}?subject=Hiring`}>{siteConfig.email}</a> with a
          short note about what you&apos;ve built.
        </p>

        <h2>Privacy &amp; data requests</h2>
        <p>
          For data access, deletion, or correction requests under GDPR, CCPA, or DPDP, email{' '}
          <a href={`mailto:${siteConfig.email}?subject=Privacy`}>{siteConfig.email}</a>.
        </p>
      </LegalPage>
    </>
  );
}
