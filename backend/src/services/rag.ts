import Anthropic from "@anthropic-ai/sdk";
import type { Database } from "better-sqlite3";
import { createHash } from "crypto";

// Regulation data structure
interface Article {
  id: string;
  framework: string;
  title: string;
  summary: string;
  relevance: string;
  keywords: string[];
  officialLink: string;
}

interface SearchResult {
  article: Article;
  score: number;
  matchType: "keyword" | "semantic" | "hybrid";
}

interface RAGResponse {
  answer: string;
  sources: Article[];
  cached: boolean;
}

export class RAGService {
  private client: Anthropic | null = null;
  private db: Database;
  private articles: Article[] = [];
  private embeddings: Map<string, number[]> = new Map();

  constructor(db: Database, apiKey?: string) {
    this.db = db;
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
    }
    this.loadRegulations();
  }

  get isEnabled(): boolean {
    return this.client !== null;
  }

  private loadRegulations(): void {
    // Load the regulations data (same as web/src/data/regulations.ts)
    this.articles = [
      // GDPR Articles
      { id: "gdpr-art-5", framework: "gdpr", title: "Article 5 - Principles relating to processing of personal data", summary: "Personal data must be processed lawfully, fairly, and transparently. Data must be collected for specified, explicit purposes and be adequate, relevant, and limited to what is necessary.", relevance: "Core principle for KYC - only collect identity data that is strictly necessary for verification purposes.", keywords: ["lawfulness", "fairness", "transparency", "purpose limitation", "data minimization"], officialLink: "https://eur-lex.europa.eu/eli/reg/2016/679/art_5/oj" },
      { id: "gdpr-art-6", framework: "gdpr", title: "Article 6 - Lawfulness of processing", summary: "Processing is lawful only if one of the following applies: consent, contract necessity, legal obligation, vital interests, public task, or legitimate interests.", relevance: "KYC processing typically relies on legal obligation (AML requirements) or contract necessity as the lawful basis.", keywords: ["consent", "legal basis", "legitimate interest", "contract", "legal obligation"], officialLink: "https://eur-lex.europa.eu/eli/reg/2016/679/art_6/oj" },
      { id: "gdpr-art-9", framework: "gdpr", title: "Article 9 - Processing of special categories of personal data", summary: "Processing of biometric data for uniquely identifying a natural person is prohibited unless specific conditions are met.", relevance: "Critical for biometric identity verification - requires explicit consent or legal authorization.", keywords: ["biometric", "special categories", "sensitive data", "explicit consent"], officialLink: "https://eur-lex.europa.eu/eli/reg/2016/679/art_9/oj" },
      { id: "gdpr-art-13", framework: "gdpr", title: "Article 13 - Information to be provided when collecting personal data", summary: "Data controller must provide identity, contact details, purposes, legal basis, recipients, retention period, and data subject rights at collection time.", relevance: "KYC onboarding must include clear privacy notices explaining identity verification process.", keywords: ["transparency", "privacy notice", "data subject rights", "collection"], officialLink: "https://eur-lex.europa.eu/eli/reg/2016/679/art_13/oj" },
      { id: "gdpr-art-17", framework: "gdpr", title: "Article 17 - Right to erasure ('right to be forgotten')", summary: "Data subject has right to obtain erasure of personal data without undue delay under specific circumstances.", relevance: "Conflict with AML retention requirements - need to document legal basis for retention beyond customer request.", keywords: ["erasure", "right to be forgotten", "deletion", "retention"], officialLink: "https://eur-lex.europa.eu/eli/reg/2016/679/art_17/oj" },
      { id: "gdpr-art-22", framework: "gdpr", title: "Article 22 - Automated individual decision-making, including profiling", summary: "Data subject has right not to be subject to a decision based solely on automated processing, including profiling, which produces legal effects.", relevance: "AI-based KYC risk scoring must allow for human review and intervention.", keywords: ["automated decision", "profiling", "human intervention", "AI"], officialLink: "https://eur-lex.europa.eu/eli/reg/2016/679/art_22/oj" },
      { id: "gdpr-art-30", framework: "gdpr", title: "Article 30 - Records of processing activities", summary: "Controllers must maintain records of processing activities including purposes, data categories, recipients, transfers, and retention periods.", relevance: "Must document all identity verification processing activities in the processing register.", keywords: ["records", "processing register", "documentation", "accountability"], officialLink: "https://eur-lex.europa.eu/eli/reg/2016/679/art_30/oj" },
      { id: "gdpr-art-35", framework: "gdpr", title: "Article 35 - Data protection impact assessment", summary: "DPIA required when processing is likely to result in high risk to rights and freedoms, especially with new technologies, profiling, or large-scale special category data.", relevance: "Biometric KYC systems typically require DPIA before deployment.", keywords: ["DPIA", "risk assessment", "impact assessment", "high risk"], officialLink: "https://eur-lex.europa.eu/eli/reg/2016/679/art_35/oj" },

      // eIDAS 2.0 Articles
      { id: "eidas-art-3", framework: "eidas", title: "Article 3 - Definitions", summary: "Defines key terms including electronic identification, authentication, trust service, qualified trust service provider, and European Digital Identity Wallet.", relevance: "Foundation for understanding wallet-based identity and credential verification.", keywords: ["definitions", "wallet", "trust service", "authentication", "identification"], officialLink: "https://eur-lex.europa.eu/eli/reg/2014/910/art_3/oj" },
      { id: "eidas-art-6a", framework: "eidas", title: "Article 6a - European Digital Identity Wallets", summary: "Member States shall provide EUDI Wallets enabling secure request, storage, and sharing of identity data and electronic attestations of attributes.", relevance: "Core framework for accepting wallet-based credentials in KYC processes.", keywords: ["EUDI wallet", "digital identity", "attestations", "credentials"], officialLink: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1183" },
      { id: "eidas-art-6b", framework: "eidas", title: "Article 6b - Essential requirements for wallets", summary: "Wallets must ensure high level of security, user control, privacy by design, and interoperability across Member States.", relevance: "Security requirements for accepting wallet credentials in verification workflows.", keywords: ["security", "privacy by design", "interoperability", "user control"], officialLink: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1183" },
      { id: "eidas-art-8", framework: "eidas", title: "Article 8 - Assurance levels", summary: "Three assurance levels: low (limited confidence), substantial (substantial confidence), and high (high confidence in claimed identity).", relevance: "Determines required identity verification stringency - AML typically requires substantial or high.", keywords: ["assurance levels", "LoA", "identity confidence", "verification strength"], officialLink: "https://eur-lex.europa.eu/eli/reg/2014/910/art_8/oj" },
      { id: "eidas-art-24", framework: "eidas", title: "Article 24 - Requirements for qualified trust service providers", summary: "QTSPs must use trustworthy systems, employ qualified personnel, maintain financial stability, and undergo regular audits.", relevance: "Requirements for credential issuers in the trust framework.", keywords: ["QTSP", "qualified provider", "audit", "trust service"], officialLink: "https://eur-lex.europa.eu/eli/reg/2014/910/art_24/oj" },
      { id: "eidas-art-45", framework: "eidas", title: "Article 45 - Requirements for electronic attestation of attributes", summary: "Electronic attestations must be issued by qualified provider, include issuer identity, and be verifiable against authentic source.", relevance: "Standard for accepting verified credentials (address proof, employment verification, etc.).", keywords: ["attestation", "attributes", "verified credentials", "authentic source"], officialLink: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1183" },

      // AML/6AMLD Articles
      { id: "aml-art-13", framework: "aml", title: "Article 13 - Customer due diligence measures", summary: "Obliged entities must identify and verify customer identity, identify beneficial owners, assess and obtain information on purpose and nature of business relationship.", relevance: "Core CDD requirements that define minimum KYC standards.", keywords: ["CDD", "customer identification", "beneficial owner", "verification"], officialLink: "https://eur-lex.europa.eu/eli/dir/2015/849/art_13/oj" },
      { id: "aml-art-14", framework: "aml", title: "Article 14 - Verification of identity", summary: "Identity verification must be done before establishing business relationship or carrying out transaction, using reliable and independent sources.", relevance: "Specifies when and how identity verification must occur.", keywords: ["verification timing", "reliable sources", "independent verification"], officialLink: "https://eur-lex.europa.eu/eli/dir/2015/849/art_14/oj" },
      { id: "aml-art-18", framework: "aml", title: "Article 18 - Enhanced due diligence", summary: "EDD required for high-risk situations including PEPs, high-risk countries, and complex ownership structures.", relevance: "Triggers for enhanced verification procedures.", keywords: ["EDD", "enhanced due diligence", "high risk", "PEP"], officialLink: "https://eur-lex.europa.eu/eli/dir/2015/849/art_18/oj" },
      { id: "aml-art-20", framework: "aml", title: "Article 20 - Politically exposed persons", summary: "Specific measures for PEPs including senior management approval, establishing source of wealth and funds, and enhanced ongoing monitoring.", relevance: "Special handling requirements for politically exposed persons.", keywords: ["PEP", "politically exposed", "source of wealth", "senior approval"], officialLink: "https://eur-lex.europa.eu/eli/dir/2015/849/art_20/oj" },
      { id: "aml-art-40", framework: "aml", title: "Article 40 - Record keeping", summary: "Records of CDD and transaction records must be kept for 5 years after business relationship ends.", relevance: "Defines minimum retention periods for KYC documentation.", keywords: ["retention", "record keeping", "5 years", "documentation"], officialLink: "https://eur-lex.europa.eu/eli/dir/2015/849/art_40/oj" },

      // EU AI Act Articles
      { id: "ai-art-5", framework: "eu-ai-act", title: "Article 5 - Prohibited AI practices", summary: "Prohibits AI systems that deploy subliminal techniques, exploit vulnerabilities, social scoring, and real-time remote biometric identification in public spaces (with exceptions).", relevance: "Constraints on AI use in identity verification - real-time biometric in public spaces is restricted.", keywords: ["prohibited AI", "social scoring", "biometric identification", "manipulation"], officialLink: "https://eur-lex.europa.eu/eli/reg/2024/1689/art_5/oj" },
      { id: "ai-art-6", framework: "eu-ai-act", title: "Article 6 - Classification rules for high-risk AI systems", summary: "AI systems used in biometric identification and categorisation of natural persons are classified as high-risk.", relevance: "Biometric KYC systems are automatically classified as high-risk AI.", keywords: ["high-risk AI", "classification", "biometric", "Annex III"], officialLink: "https://eur-lex.europa.eu/eli/reg/2024/1689/art_6/oj" },
      { id: "ai-art-9", framework: "eu-ai-act", title: "Article 9 - Risk management system", summary: "High-risk AI providers must establish and maintain a risk management system throughout the AI lifecycle.", relevance: "Continuous risk assessment required for biometric verification AI.", keywords: ["risk management", "lifecycle", "continuous assessment", "mitigation"], officialLink: "https://eur-lex.europa.eu/eli/reg/2024/1689/art_9/oj" },
      { id: "ai-art-10", framework: "eu-ai-act", title: "Article 10 - Data and data governance", summary: "Training, validation, and testing data sets must be relevant, representative, free of errors, and complete. Bias examination required.", relevance: "Data quality standards for AI training in identity verification.", keywords: ["data governance", "training data", "bias", "data quality"], officialLink: "https://eur-lex.europa.eu/eli/reg/2024/1689/art_10/oj" },
      { id: "ai-art-13", framework: "eu-ai-act", title: "Article 13 - Transparency and information for deployers", summary: "High-risk AI must be designed for transparency with instructions for use including capabilities, limitations, and human oversight.", relevance: "Transparency requirements for AI-assisted identity decisions.", keywords: ["transparency", "instructions", "limitations", "capabilities"], officialLink: "https://eur-lex.europa.eu/eli/reg/2024/1689/art_13/oj" },
      { id: "ai-art-14", framework: "eu-ai-act", title: "Article 14 - Human oversight", summary: "High-risk AI must be designed for effective human oversight to prevent or minimize risks, including ability to override or reverse decisions.", relevance: "Human review requirement for automated identity verification decisions.", keywords: ["human oversight", "human in the loop", "override", "intervention"], officialLink: "https://eur-lex.europa.eu/eli/reg/2024/1689/art_14/oj" },
      { id: "ai-art-26", framework: "eu-ai-act", title: "Article 26 - Obligations of deployers of high-risk AI", summary: "Deployers must use AI in accordance with instructions, ensure human oversight, monitor operation, and keep logs.", relevance: "Operational requirements for organizations using AI in KYC.", keywords: ["deployer obligations", "monitoring", "logs", "compliance"], officialLink: "https://eur-lex.europa.eu/eli/reg/2024/1689/art_26/oj" },
    ];

    // Initialize simple keyword-based "embeddings" (in production, use real embeddings)
    this.articles.forEach((article) => {
      const text = `${article.title} ${article.summary} ${article.relevance} ${article.keywords.join(" ")}`.toLowerCase();
      const embedding = this.createSimpleEmbedding(text);
      this.embeddings.set(article.id, embedding);
    });
  }

  // Simple TF-IDF-like embedding (in production, use Claude embeddings or a vector DB)
  private createSimpleEmbedding(text: string): number[] {
    const words = text.split(/\s+/);
    const wordFreq = new Map<string, number>();
    words.forEach((w) => wordFreq.set(w, (wordFreq.get(w) ?? 0) + 1));

    // Important compliance terms
    const terms = [
      "gdpr", "eidas", "aml", "kyc", "pii", "biometric", "consent", "verification",
      "identity", "data", "processing", "risk", "compliance", "audit", "credential",
      "wallet", "pep", "sanctions", "cdd", "edd", "transparency", "oversight", "ai",
      "retention", "erasure", "dpia", "high-risk", "trust", "attestation", "qualified"
    ];

    return terms.map((term) => wordFreq.get(term) ?? 0);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  search(query: string, limit: number = 5): SearchResult[] {
    const queryLower = query.toLowerCase();
    const queryEmbedding = this.createSimpleEmbedding(queryLower);
    const queryWords = queryLower.split(/\s+/);

    const results: SearchResult[] = [];

    this.articles.forEach((article) => {
      // Keyword matching score
      const keywordScore = article.keywords.filter((k) =>
        queryWords.some((qw) => k.toLowerCase().includes(qw) || qw.includes(k.toLowerCase()))
      ).length / article.keywords.length;

      // Semantic (embedding) similarity
      const articleEmbedding = this.embeddings.get(article.id) ?? [];
      const semanticScore = this.cosineSimilarity(queryEmbedding, articleEmbedding);

      // Title/summary text match
      const textMatch =
        (article.title.toLowerCase().includes(queryLower) ? 0.3 : 0) +
        (article.summary.toLowerCase().includes(queryLower) ? 0.2 : 0) +
        (article.relevance.toLowerCase().includes(queryLower) ? 0.2 : 0);

      // Hybrid score
      const score = keywordScore * 0.3 + semanticScore * 0.4 + textMatch * 0.3;

      if (score > 0.1) {
        results.push({
          article,
          score,
          matchType: keywordScore > semanticScore ? "keyword" : "semantic",
        });
      }
    });

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async query(question: string): Promise<RAGResponse> {
    // Search for relevant articles
    const searchResults = this.search(question, 5);
    const sources = searchResults.map((r) => r.article);

    // Check cache
    const cacheKey = createHash("sha256").update(question).digest("hex");
    const cachedStmt = this.db.prepare(`
      SELECT response FROM ai_cache
      WHERE cache_key = ? AND expires_at > datetime('now')
    `);
    const cached = cachedStmt.get(cacheKey) as { response: string } | undefined;

    if (cached) {
      return { answer: cached.response, sources, cached: true };
    }

    // If no API key, return simple answer
    if (!this.client) {
      const answer = this.generateSimpleAnswer(question, sources);
      return { answer, sources, cached: false };
    }

    // Use Claude to generate comprehensive answer
    const context = sources
      .map((s) => `[${s.framework.toUpperCase()} - ${s.title}]\n${s.summary}\nRelevance: ${s.relevance}`)
      .join("\n\n");

    try {
      const response = await this.client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: `You are a regulatory compliance expert. Answer questions using ONLY the provided regulation context. Be specific and cite article numbers. If the context doesn't contain relevant information, say so.`,
        messages: [
          {
            role: "user",
            content: `Context:\n${context}\n\nQuestion: ${question}\n\nProvide a clear, actionable answer citing specific articles.`,
          },
        ],
      });

      const textContent = response.content.find((c) => c.type === "text");
      const answer = textContent?.text ?? this.generateSimpleAnswer(question, sources);

      // Cache the response
      const cacheStmt = this.db.prepare(`
        INSERT OR REPLACE INTO ai_cache (cache_key, response, model, tokens_used, expires_at)
        VALUES (?, ?, 'claude-sonnet-4-20250514', ?, datetime('now', '+1 hour'))
      `);
      cacheStmt.run(cacheKey, answer, response.usage.input_tokens + response.usage.output_tokens);

      return { answer, sources, cached: false };
    } catch (error) {
      console.error("RAG query error:", error);
      return { answer: this.generateSimpleAnswer(question, sources), sources, cached: false };
    }
  }

  private generateSimpleAnswer(question: string, sources: Article[]): string {
    if (sources.length === 0) {
      return "I couldn't find specific regulations matching your question. Please try rephrasing or ask about specific topics like GDPR consent, eIDAS wallets, AML CDD, or EU AI Act requirements.";
    }

    const primary = sources[0];
    let answer = `Based on ${primary.framework.toUpperCase()} ${primary.title}:\n\n`;
    answer += `${primary.summary}\n\n`;
    answer += `**Relevance for KYC/Identity:** ${primary.relevance}\n\n`;

    if (sources.length > 1) {
      answer += `**Related regulations:**\n`;
      sources.slice(1, 4).forEach((s) => {
        answer += `- ${s.framework.toUpperCase()} ${s.title}\n`;
      });
    }

    answer += `\n*For authoritative information, please consult the official EUR-Lex links provided.*`;

    return answer;
  }

  getFrameworks(): { id: string; name: string; articleCount: number }[] {
    const frameworks = new Map<string, number>();
    this.articles.forEach((a) => {
      frameworks.set(a.framework, (frameworks.get(a.framework) ?? 0) + 1);
    });

    const names: Record<string, string> = {
      gdpr: "GDPR",
      eidas: "eIDAS 2.0",
      aml: "AML/6AMLD",
      "eu-ai-act": "EU AI Act",
    };

    return Array.from(frameworks.entries()).map(([id, count]) => ({
      id,
      name: names[id] ?? id,
      articleCount: count,
    }));
  }

  getArticlesByFramework(framework: string): Article[] {
    return this.articles.filter((a) => a.framework === framework);
  }

  getAllArticles(): Article[] {
    return this.articles;
  }
}
