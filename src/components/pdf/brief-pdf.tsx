import { Document, Page, Text, View, StyleSheet, Image, Link } from '@react-pdf/renderer';

interface HoldingSnapshot {
  id?: string;
  symbol: string;
  name?: string;
  quantity: number;
  avg_buy_price: number;
  current_value?: number;
  currentValue?: number;
  pnl?: number;
  currency?: string;
}

interface BriefPDFProps {
  brief: {
    title: string;
    created_at: string;
    content: string;
    portfolio_snapshot?: {
      total_value: number;
      total_pnl: number;
      total_pnl_percent: number;
      holdings: HoldingSnapshot[];
      currency: string;
    };
    news?: Array<{
      symbol: string;
      title: string;
      source: string;
      publishedAt: string;
      summary: string;
      url: string;
    }>;
  };
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottom: 2,
    borderBottomColor: '#14b8a6',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 32,
    height: 32,
  },
  brandName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0d0d0d',
    letterSpacing: 0.5,
  },
  dateSection: {
    textAlign: 'right',
  },
  dateLabel: {
    fontSize: 9,
    color: '#6e6e80',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0d0d0d',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0d0d0d',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: 1,
    borderBottomColor: '#ececec',
  },
  overviewText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#333333',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statBox: {
    width: '24%',
    padding: 10,
    backgroundColor: '#fafafa',
    borderRadius: 6,
    border: 1,
    borderColor: '#ececec',
  },
  statLabel: {
    fontSize: 8,
    color: '#6e6e80',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0d0d0d',
  },
  statValueGreen: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10b981',
  },
  statValueRed: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  holdingsTable: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f7f7f8',
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
    fontWeight: 'bold',
    fontSize: 9,
    color: '#5d5d5d',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: 1,
    borderBottomColor: '#ececec',
    fontSize: 9,
    alignItems: 'center',
  },
  colSymbol: { width: '20%' },
  colName: { width: '25%' },
  colQty: { width: '10%', textAlign: 'right' },
  colPrice: { width: '15%', textAlign: 'right' },
  colValue: { width: '15%', textAlign: 'right' },
  colPnl: { width: '15%', textAlign: 'right' },
  positive: { color: '#10b981' },
  negative: { color: '#ef4444' },
  newsItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottom: 1,
    borderBottomColor: '#ececec',
  },
  newsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0d0d0d',
    marginBottom: 3,
  },
  newsMeta: {
    fontSize: 8,
    color: '#6e6e80',
    marginBottom: 3,
  },
  newsSummary: {
    fontSize: 9,
    color: '#333333',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#8e8e8e',
    borderTop: 1,
    borderTopColor: '#ececec',
    paddingTop: 10,
  },
  disclaimer: {
    fontSize: 8,
    color: '#8e8e80',
    fontStyle: 'italic',
    marginTop: 15,
    padding: 8,
    backgroundColor: '#fafafa',
    borderRadius: 4,
    border: 1,
    borderColor: '#ececec',
  },
  // Markdown styles
  mdHeading1: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0d0d0d',
    marginTop: 12,
    marginBottom: 6,
  },
  mdHeading2: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0d0d0d',
    marginTop: 10,
    marginBottom: 5,
  },
  mdHeading3: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0d0d0d',
    marginTop: 8,
    marginBottom: 4,
  },
  mdParagraph: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#333333',
    marginBottom: 8,
  },
  mdListItem: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#333333',
    marginBottom: 3,
    paddingLeft: 10,
  },
  mdBold: {
    fontWeight: 'bold',
  },
});

const formatCurrency = (value: number, currency: string = 'USD') => {
  const symbols: Record<string, string> = { USD: '$', INR: '', EUR: '€', GBP: '£' };
  const symbol = symbols[currency] || '$';
  return `${symbol}${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const formatNewsDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Simple Markdown Parser for PDF
const parseMarkdown = (markdown: string) => {
  const lines = markdown.split('\n');
  const elements: any[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Headings
    if (trimmed.startsWith('### ')) {
      elements.push(<Text key={elements.length} style={styles.mdHeading3}>{trimmed.replace('### ', '')}</Text>);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(<Text key={elements.length} style={styles.mdHeading2}>{trimmed.replace('## ', '')}</Text>);
      continue;
    }
    if (trimmed.startsWith('# ')) {
      elements.push(<Text key={elements.length} style={styles.mdHeading1}>{trimmed.replace('# ', '')}</Text>);
      continue;
    }

    // Lists
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        inList = true;
      }
      const content = trimmed.replace(/^[-*] /, '');
      elements.push(<Text key={elements.length} style={styles.mdListItem}>• {content}</Text>);
      continue;
    } else {
      inList = false;
    }

    // Bold text handling (simple)
    if (trimmed.includes('**')) {
      const parts = trimmed.split(/(\*\*.*?\*\*)/g);
      const children = parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <Text key={i} style={styles.mdBold}>{part.replace(/\*\*/g, '')}</Text>;
        }
        return <Text key={i}>{part}</Text>;
      });
      elements.push(<Text key={elements.length} style={styles.mdParagraph}>{children}</Text>);
    } else {
      // Regular paragraph
      elements.push(<Text key={elements.length} style={styles.mdParagraph}>{trimmed}</Text>);
    }
  }

  return elements;
};

export const BriefPDF = ({ brief }: BriefPDFProps) => {
  const snapshot = brief.portfolio_snapshot;
  const currency = snapshot?.currency || 'USD';
  const news = brief.news || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Image
              src="https://raw.githubusercontent.com/Eshwar02/bearbot/main/public/logo.svg"
              style={styles.logo}
            />
            <Text style={styles.brandName}>AlphaSight AI</Text>
          </View>
          <View style={styles.dateSection}>
            <Text style={styles.dateLabel}>Daily Brief Update</Text>
            <Text style={styles.dateValue}>
              {formatDate(brief.created_at)} at {formatTime(brief.created_at)}
            </Text>
          </View>
        </View>

        {/* Portfolio Overview Stats */}
        {snapshot && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Portfolio Overview</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Total Value</Text>
                <Text style={styles.statValue}>{formatCurrency(snapshot.total_value, currency)}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Total P&L</Text>
                <Text style={snapshot.total_pnl >= 0 ? styles.statValueGreen : styles.statValueRed}>
                  {snapshot.total_pnl >= 0 ? '+' : '-'}{formatCurrency(snapshot.total_pnl, currency)}
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Return</Text>
                <Text style={snapshot.total_pnl_percent >= 0 ? styles.statValueGreen : styles.statValueRed}>
                  {snapshot.total_pnl_percent >= 0 ? '+' : ''}{snapshot.total_pnl_percent.toFixed(2)}%
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Holdings</Text>
                <Text style={styles.statValue}>{snapshot.holdings.length}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Holdings Table */}
        {snapshot && snapshot.holdings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Holdings</Text>
            <View style={styles.holdingsTable}>
              <View style={styles.tableHeader}>
                <Text style={styles.colSymbol}>Symbol</Text>
                <Text style={styles.colName}>Name</Text>
                <Text style={styles.colQty}>Qty</Text>
                <Text style={styles.colPrice}>Avg Price</Text>
                <Text style={styles.colValue}>Value</Text>
                <Text style={styles.colPnl}>P&L</Text>
              </View>
              {snapshot.holdings.map((holding, index) => (
                <View
                  key={holding.id || index}
                  style={[
                    styles.tableRow,
                    { backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa' },
                  ]}
                >
                  <Text style={styles.colSymbol}>{holding.symbol}</Text>
                  <Text style={styles.colName}>{holding.name || '-'}</Text>
                  <Text style={styles.colQty}>{holding.quantity}</Text>
                  <Text style={styles.colPrice}>{formatCurrency(holding.avg_buy_price, currency)}</Text>
                  <Text style={styles.colValue}>{formatCurrency(holding.current_value || holding.currentValue || 0, currency)}</Text>
                  <Text style={[styles.colPnl, (holding.pnl || 0) >= 0 ? styles.positive : styles.negative]}>
                    {(holding.pnl || 0) >= 0 ? '+' : ''}{formatCurrency(holding.pnl || 0, currency)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Latest News Section */}
        {news.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Latest News</Text>
            {news.map((item, index) => (
              <View key={index} style={styles.newsItem}>
                <Text style={styles.newsTitle}>{item.title}</Text>
                <Text style={styles.newsMeta}>
                  {item.source} • {formatNewsDate(item.publishedAt)}
                </Text>
                <Text style={styles.newsSummary}>{item.summary}</Text>
              </View>
            ))}
          </View>
        )}

        {/* AI Analysis Content (Parsed Markdown) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comprehensive Analysis</Text>
          {parseMarkdown(brief.content)}
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text>
            Disclaimer: This report is generated by AI for informational purposes only. It does not constitute financial advice. 
            Always consult a qualified financial advisor before making investment decisions. Past performance is not indicative of future results.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Generated by AlphaSight AI • {formatDate(brief.created_at)}</Text>
        </View>
      </Page>
    </Document>
  );
};
