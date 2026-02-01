import { Router } from "express";
import { z } from "zod";
import { RAGService } from "../services/rag.js";

const QuerySchema = z.object({
  question: z.string().min(3).max(500),
});

const SearchSchema = z.object({
  query: z.string().min(2).max(200),
  limit: z.number().min(1).max(20).default(5),
});

export function createRegulationsRouter(ragService: RAGService): Router {
  const router = Router();

  // GET /api/regulations - List all frameworks
  router.get("/", (req, res) => {
    const frameworks = ragService.getFrameworks();
    res.json({
      frameworks,
      total_articles: frameworks.reduce((sum, f) => sum + f.articleCount, 0),
      ai_enabled: ragService.isEnabled,
    });
  });

  // GET /api/regulations/articles - List all articles
  router.get("/articles", (req, res) => {
    const { framework } = req.query;

    let articles;
    if (framework && typeof framework === "string") {
      articles = ragService.getArticlesByFramework(framework);
    } else {
      articles = ragService.getAllArticles();
    }

    res.json({ articles, count: articles.length });
  });

  // POST /api/regulations/search - Semantic search
  router.post("/search", (req, res) => {
    try {
      const data = SearchSchema.parse(req.body);
      const results = ragService.search(data.query, data.limit);

      res.json({
        query: data.query,
        results: results.map((r) => ({
          article: r.article,
          score: Math.round(r.score * 100) / 100,
          match_type: r.matchType,
        })),
        count: results.length,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        throw error;
      }
    }
  });

  // POST /api/regulations/query - RAG query (AI-powered Q&A)
  router.post("/query", async (req, res) => {
    try {
      const data = QuerySchema.parse(req.body);
      const result = await ragService.query(data.question);

      res.json({
        question: data.question,
        answer: result.answer,
        sources: result.sources.map((s) => ({
          id: s.id,
          framework: s.framework,
          title: s.title,
          link: s.officialLink,
        })),
        cached: result.cached,
        ai_enabled: ragService.isEnabled,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        throw error;
      }
    }
  });

  // GET /api/regulations/:framework - Get framework details
  router.get("/:framework", (req, res) => {
    const articles = ragService.getArticlesByFramework(req.params.framework);

    if (articles.length === 0) {
      return res.status(404).json({ error: "Framework not found" });
    }

    const frameworks = ragService.getFrameworks();
    const framework = frameworks.find((f) => f.id === req.params.framework);

    res.json({
      framework: framework,
      articles,
    });
  });

  return router;
}
