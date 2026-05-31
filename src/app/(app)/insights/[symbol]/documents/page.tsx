import { FileText, FileBarChart2, FileSearch, Megaphone, Wallet } from 'lucide-react';

interface DocumentsPageProps {
  params: Promise<{ symbol: string }>;
}

const sections = [
  {
    title: 'Annual Reports',
    description: 'Full annual report PDFs filed with the exchange.',
    icon: FileText,
  },
  {
    title: 'Investor Presentations',
    description: 'Quarterly and event-driven investor decks.',
    icon: FileBarChart2,
  },
  {
    title: 'Earnings Call Transcripts',
    description: 'Concall transcripts with AI-summarized highlights.',
    icon: FileSearch,
  },
  {
    title: 'Announcements & Filings',
    description: 'Exchange filings, board meeting outcomes and regulatory updates.',
    icon: Megaphone,
  },
  {
    title: 'Corporate Actions',
    description: 'Dividends, splits, bonus issues, rights and buybacks.',
    icon: Wallet,
  },
] as const;

export default async function DocumentsPage({ params }: DocumentsPageProps) {
  await params;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sections.map((s) => (
          <section
            key={s.title}
            className="rounded-xl border border-borderSubtle bg-elevated p-5 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-accent-brand/10 p-2 text-accent-brand">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-primary">{s.title}</h3>
                <p className="mt-1 text-xs text-muted">{s.description}</p>
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-dashed border-borderSubtle bg-canvas p-3 text-center text-xs text-muted">
              Will populate once exchange filing feed (BSE/NSE/SEC) is wired.
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
