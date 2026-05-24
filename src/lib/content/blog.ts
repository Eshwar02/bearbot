export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  tags: string[];
  content: string[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: 'ai-workspace-architecture-for-modern-teams',
    title: 'AI Workspace Architecture for Modern Teams',
    description:
      'How to design AI workspace foundations for research, automation, and intelligent assistant operations at scale.',
    publishedAt: '2026-05-24',
    author: 'AlphaSight AI Editorial',
    tags: ['AI workspace', 'architecture', 'automation'],
    content: [
      'Modern teams do not need another isolated chatbot. They need an AI workspace where context, tooling, and execution live together. AlphaSight AI was built around that assumption.',
      'A reliable AI productivity platform starts with context architecture. Every prompt should inherit bounded organizational memory, relevant policies, and recent operational state. Without this, output quality oscillates and trust falls.',
      'The second pillar is workflow structure. Teams must transform one-off prompts into repeatable pipelines: gather data, synthesize insight, validate assumptions, and trigger action. This is where an AI automation workspace outperforms ad hoc prompting.',
      'Third is governance. Intelligent AI assistant systems need role isolation, audit trails, and explicit boundaries for actions. Good UX is not enough. Security and traceability decide whether a platform can survive enterprise requirements.',
      'AlphaSight AI combines these three layers with semantic retrieval, automation orchestration, and dashboard visibility. Teams keep moving fast while preserving rigor. That balance is core to long-term AI adoption.',
    ],
  },
  {
    slug: 'semantic-research-workflows-with-ai-assistants',
    title: 'Semantic Research Workflows with AI Assistants',
    description:
      'Practical blueprint for building AI research platform workflows with semantic chunking, retrieval, and decision-ready output.',
    publishedAt: '2026-05-24',
    author: 'AlphaSight AI Editorial',
    tags: ['AI research platform', 'semantic search', 'AI assistant'],
    content: [
      'Research velocity depends less on raw model size and more on information architecture. Teams need systems that can decompose questions, map entities, and retrieve grounded evidence.',
      'Semantic chunking is key. Instead of storing giant unstructured pages, split documents into coherent units with metadata. This improves retrieval precision and makes downstream analysis far more stable.',
      'An AI analysis tool should then synthesize findings into concise outputs: assumptions, evidence, confidence level, and recommended next checks. This format helps humans challenge results instead of blindly accepting them.',
      'AlphaSight AI supports this approach by combining retrieval-aware prompting with structured response patterns. Teams reduce repetitive digging while increasing decision quality.',
    ],
  },
  {
    slug: 'geo-optimization-for-ai-search-engines',
    title: 'GEO Optimization for AI Search Engines',
    description:
      'How to optimize SaaS content for ChatGPT, Gemini, Claude, and Perplexity with semantic structure and machine-readable docs.',
    publishedAt: '2026-05-24',
    author: 'AlphaSight AI Editorial',
    tags: ['GEO', 'AI search', 'technical SEO'],
    content: [
      'Generative engine optimization is now mandatory. AI systems rely on clear structure, stable entities, and explicit site signals to understand products.',
      'Start with canonical discipline and indexability separation. Public pages must be crawlable and rich. Auth pages should be noindex and excluded from sitemap.',
      'Next add machine-readable assets. llms.txt, structured docs, FAQ blocks, and JSON-LD schemas help AI systems summarize your platform correctly.',
      'Finally, write for retrieval. Use precise headings, scoped sections, and internal links across features, pricing, docs, and blog. These patterns improve both human discovery and AI answer inclusion.',
    ],
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
