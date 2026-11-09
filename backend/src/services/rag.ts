import { createHash } from "crypto";
import { get, run } from "../db/schema.js";
import { ARTICLES, Article, FRAMEWORK_NAMES } from "../data/regulations.js";
import { LLMClient, LLMError, textOf } from "./llm.js";

export type { Article };

export interface SearchResult {
  article: Article;
  score: number;
}

export type AnswerSource = "claude" | "cache" | "extractive";

export interface RAGResponse {
  answer: string;
  sources: Article[];
  /** "extractive" = assembled from retrieved articles without a model (no key or API error). */
  answer_source: AnswerSource;
}

const STOPWORDS = new Set(
  "a an and are as at be by can do does for from has have how i in is it its may must of on or should that the their this to under what when which who why with".split(
    " "
  )
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map((t) => (t.length > 4 && t.endsWith("s") && !t.endsWith("ss") ? t.slice(0, -1) : t)); // light plural folding
}

/**
 * Okapi BM25 over the curated article library. Lexical (no embeddings): with ~26 short,
 * keyword-dense documents this is fast, deterministic and easy to evaluate. Titles and
 * keywords are weighted by repeating them in the indexed text.
 */
class BM25Index {
  private readonly docs: string[][];
  private readonly df = new Map<string, number>();
  private readonly avgLength: number;

  constructor(
    texts: string[],
    private readonly k1 = 1.2,
    private readonly b = 0.75
  ) {
    this.docs = texts.map(tokenize);
    for (const doc of this.docs) {
      for (const term of new Set(doc)) this.df.set(term, (this.df.get(term) ?? 0) + 1);
    }
    this.avgLength = this.docs.reduce((sum, d) => sum + d.length, 0) / Math.max(this.docs.length, 1);
  }

  scores(query: string): number[] {
    const terms = [...new Set(tokenize(query))];
    const n = this.docs.length;
    return this.docs.map((doc) => {
      const tf = new Map<string, number>();
      for (const t of doc) tf.set(t, (tf.get(t) ?? 0) + 1);
      return terms.reduce((score, term) => {
        const freq = tf.get(term) ?? 0;
        if (freq === 0) return score;
        const df = this.df.get(term) ?? 0;
        const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
        const norm = freq + this.k1 * (1 - this.b + (this.b * doc.length) / this.avgLength);
        return score + idf * ((freq * (this.k1 + 1)) / norm);
      }, 0);
    });
  }
}

const SYSTEM_PROMPT = `You are a regulatory compliance expert. Answer using ONLY the provided regulation context.
Cite article numbers for every claim. If the context does not answer the question, say so plainly.`;

export class RAGService {
  private readonly articles = ARTICLES;
  private readonly index = new BM25Index(
    ARTICLES.map((a) => [a.title, a.title, a.keywords.join(" "), a.keywords.join(" "), a.summary, a.relevance].join(" "))
  );

  constructor(private readonly llm: LLMClient | null = null) {}

  get isEnabled(): boolean {
    return this.llm !== null;
  }

  search(query: string, limit = 5): SearchResult[] {
    const scores = this.index.scores(query);
    return this.articles
      .map((article, i) => ({ article, score: scores[i] }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async query(question: string): Promise<RAGResponse> {
    const sources = this.search(question, 5).map((r) => r.article);
    // Nothing retrieved: don't let the model answer from memory. No key: quote the sources.
    if (sources.length === 0 || !this.llm) {
      return { answer: extractiveAnswer(sources), sources, answer_source: "extractive" };
    }

    const context = sources
      .map((s) => `[${FRAMEWORK_NAMES[s.framework]} - ${s.title}]\n${s.summary}\nRelevance: ${s.relevance}`)
      .join("\n\n");
    const user = `Context:\n${context}\n\nQuestion: ${question}\n\nProvide a clear, actionable answer citing specific articles.`;

    const cacheKey = createHash("sha256").update(`${this.llm.model}\n${user}`).digest("hex");
    const cached = get<{ response: string }>(
      `SELECT response FROM ai_cache WHERE cache_key = ? AND expires_at > datetime('now')`,
      [cacheKey]
    );
    if (cached) return { answer: cached.response, sources, answer_source: "cache" };

    try {
      const response = await this.llm.create({ system: SYSTEM_PROMPT, messages: [{ role: "user", content: user }] });
      const answer = textOf(response);
      if (!answer) throw new LLMError("Empty answer");
      run(
        `INSERT OR REPLACE INTO ai_cache (cache_key, response, model, tokens_used, expires_at) VALUES (?, ?, ?, ?, datetime('now', '+1 hour'))`,
        [cacheKey, answer, this.llm.model, response.usage.input_tokens + response.usage.output_tokens]
      );
      return { answer, sources, answer_source: "claude" };
    } catch (error) {
      // Quoting the retrieved articles is still a truthful answer; it is labeled as such.
      console.error("RAG generation failed, returning extractive answer:", error);
      return { answer: extractiveAnswer(sources), sources, answer_source: "extractive" };
    }
  }

  getFrameworks(): { id: string; name: string; articleCount: number }[] {
    const counts = new Map<Article["framework"], number>();
    for (const a of this.articles) counts.set(a.framework, (counts.get(a.framework) ?? 0) + 1);
    return [...counts].map(([id, articleCount]) => ({ id, name: FRAMEWORK_NAMES[id], articleCount }));
  }

  getArticlesByFramework(framework: string): Article[] {
    return this.articles.filter((a) => a.framework === framework);
  }

  getAllArticles(): Article[] {
    return this.articles;
  }
}

function extractiveAnswer(sources: Article[]): string {
  if (sources.length === 0) {
    return "I couldn't find specific regulations matching your question. Try asking about topics like GDPR consent, eIDAS wallets, AML due diligence, or EU AI Act requirements.";
  }
  const [primary, ...related] = sources;
  let answer = `Based on ${FRAMEWORK_NAMES[primary.framework]} ${primary.title}:\n\n${primary.summary}\n\n`;
  answer += `**Relevance for KYC/Identity:** ${primary.relevance}\n\n`;
  if (related.length > 0) {
    answer += `**Related regulations:**\n${related
      .slice(0, 3)
      .map((s) => `- ${FRAMEWORK_NAMES[s.framework]} ${s.title}`)
      .join("\n")}\n`;
  }
  return answer + `\n*For authoritative information, consult the official EUR-Lex links provided.*`;
}
