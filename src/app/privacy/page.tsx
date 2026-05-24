import type { Metadata } from 'next';
import { buildMetadata, routeSeo, siteConfig } from '@/lib/seo';
import { LegalPage } from '@/components/seo/legal-page';

export const metadata: Metadata = buildMetadata(routeSeo.privacy);

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="May 24, 2026">
      <p>
        AlphaSight AI (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates {siteConfig.url} and{' '}
        {siteConfig.url} (the &quot;Service&quot;). This page explains what personal
        information we collect, how we use it, how we protect it, and the rights you have under
        applicable law including the EU General Data Protection Regulation (GDPR), the California
        Consumer Privacy Act (CCPA/CPRA), India&apos;s Digital Personal Data Protection Act (DPDP),
        and the UK Data Protection Act.
      </p>

      <h2>1. Information we collect</h2>
      <h3>1.1 Information you provide</h3>
      <ul>
        <li>Account data: name, email address, hashed password, profile photo.</li>
        <li>Portfolio &amp; watchlist data: tickers, holdings, target prices, custom notes.</li>
        <li>Chat history: prompts you send to the AI assistant and the responses returned.</li>
        <li>Billing data (when applicable): processed by our payment provider; we never store full card numbers.</li>
        <li>Support correspondence: emails, chat transcripts, attachments you share.</li>
      </ul>
      <h3>1.2 Information collected automatically</h3>
      <ul>
        <li>Device and browser metadata (user agent, screen size, language, timezone).</li>
        <li>IP address, approximate geolocation, and ISP — used for security, fraud prevention, and regional content.</li>
        <li>Usage analytics: pages visited, features used, performance metrics (Vercel Speed Insights).</li>
        <li>Cookies and similar technologies (see Section 6).</li>
      </ul>
      <h3>1.3 Information from third parties</h3>
      <ul>
        <li>Market data from Yahoo Finance and other providers (no personal data of yours is sent there — your tickers are queried server-side).</li>
        <li>OAuth identifiers if you sign in with Google, GitHub, or Apple.</li>
      </ul>

      <h2>2. How we use your information</h2>
      <ul>
        <li>To provide, maintain, and improve the Service.</li>
        <li>To personalize your dashboard, daily brief, and AI responses.</li>
        <li>To process transactions and send transactional emails (password reset, receipts, security alerts).</li>
        <li>To detect, prevent, and respond to fraud, abuse, security incidents, and illegal activity.</li>
        <li>To comply with legal obligations (KYC, tax reporting, court orders).</li>
        <li>To send marketing communications, where you have opted in and can unsubscribe at any time.</li>
      </ul>

      <h2>3. Legal bases (GDPR Art. 6)</h2>
      <p>We process your data on the following grounds: (a) performance of a contract — to deliver the Service you signed up for; (b) legitimate interests — security, fraud prevention, product improvement; (c) consent — for marketing, optional analytics, and personalized advertising; (d) legal obligation — when required by law.</p>

      <h2>4. AI processing</h2>
      <p>Chat messages are processed by large language model providers (Mistral AI, Groq, and similar) under contractual data-processing agreements that prohibit them from training models on your data. Conversations are stored in your Supabase-hosted database; you can delete them at any time. We do not sell your chat content to anyone, ever.</p>

      <h2>5. How we share your information</h2>
      <ul>
        <li><strong>Service providers</strong>: Supabase (database, auth), Vercel (hosting), Mistral &amp; Groq (LLM inference), Yahoo Finance (market data — outbound only), email delivery, payment processors.</li>
        <li><strong>Advertising partners</strong>: if you see ads on the marketing site, Google AdSense and other ad networks may set cookies. You can opt out of personalized advertising at{' '}
          <a href="https://www.google.com/settings/ads">google.com/settings/ads</a> and{' '}
          <a href="https://optout.aboutads.info">optout.aboutads.info</a>.
        </li>
        <li><strong>Legal compliance</strong>: when required by subpoena, court order, or applicable law.</li>
        <li><strong>Business transfers</strong>: in connection with a merger, acquisition, or sale of assets, with prior notice to you.</li>
        <li><strong>With your consent</strong>: for any other purpose disclosed at the time of collection.</li>
      </ul>
      <p>We do <strong>not</strong> sell your personal information for monetary consideration. Under CCPA, the &quot;sharing&quot; of identifiers for cross-context behavioral advertising may apply — you may opt out via our cookie banner or the &quot;Do Not Sell or Share My Personal Information&quot; link.</p>

      <h2>6. Cookies and tracking</h2>
      <p>We use cookies for: (a) essential authentication and security; (b) preferences (theme, language); (c) analytics (Vercel Speed Insights, Google Analytics if enabled); (d) advertising (Google AdSense if enabled on marketing pages). You can manage cookies through your browser, and we honor the Global Privacy Control (GPC) signal.</p>

      <h2>7. Data retention</h2>
      <ul>
        <li>Account data: kept while your account is active and for 30 days after deletion request, then permanently erased.</li>
        <li>Chat history: kept until you delete it, or up to 24 months for inactive accounts.</li>
        <li>Logs and analytics: aggregated and anonymized after 90 days.</li>
        <li>Backup tapes: rotated every 30 days; deleted data persists in backups for up to 35 days.</li>
      </ul>

      <h2>8. Security</h2>
      <p>We protect your data with: TLS 1.3 encryption in transit, AES-256 at rest, row-level security in Postgres, hashed passwords (Argon2id via Supabase), HTTP-only secure cookies, a strict Content-Security-Policy, and regular security audits. No system is perfectly secure — please use a strong unique password and enable two-factor authentication.</p>

      <h2>9. International data transfers</h2>
      <p>Your data may be processed in countries outside your own, including the United States and the European Union. We rely on Standard Contractual Clauses, the EU-US Data Privacy Framework, and equivalent safeguards.</p>

      <h2>10. Your rights</h2>
      <p>Depending on your jurisdiction you have the right to: access your data; correct it; delete it; restrict or object to processing; receive a portable copy; withdraw consent; lodge a complaint with a supervisory authority. To exercise these rights, email{' '}
        <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>. We respond within 30 days.</p>

      <h2>11. Children</h2>
      <p>AlphaSight AI is not directed at children under 16. We do not knowingly collect personal information from children. If you believe a child has provided us data, contact us and we will delete it.</p>

      <h2>12. Changes</h2>
      <p>We will post material changes to this Privacy Policy on this page with an updated effective date and, where required, notify you by email.</p>

      <h2>13. Contact</h2>
      <p>AlphaSight AI · <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a></p>
    </LegalPage>
  );
}
