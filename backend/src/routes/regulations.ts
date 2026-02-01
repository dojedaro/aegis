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

  /**
   * @swagger
   * /api/regulations:
   *   get:
   *     summary: List regulatory frameworks
   *     tags: [Regulations]
   *     responses:
   *       200:
   *         description: Available regulatory frameworks
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 frameworks:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id: { type: string }
   *                       name: { type: string }
   *                       description: { type: string }
   *                       articleCount: { type: integer }
   *                 total_articles: { type: integer }
   *                 ai_enabled: { type: boolean }
   */
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

  /**
   * @swagger
   * /api/regulations/search:
   *   post:
   *     summary: Semantic search across regulations
   *     description: Search regulatory articles using keyword and semantic matching
   *     tags: [Regulations]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [query]
   *             properties:
   *               query: { type: string, minLength: 2, maxLength: 200 }
   *               limit: { type: integer, minimum: 1, maximum: 20, default: 5 }
   *           example:
   *             query: "data retention requirements"
   *             limit: 5
   *     responses:
   *       200:
   *         description: Search results with relevance scores
   */
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

  /**
   * @swagger
   * /api/regulations/query:
   *   post:
   *     summary: AI-powered regulatory Q&A (RAG)
   *     description: Ask natural language questions about regulations. Uses retrieval-augmented generation to provide accurate, sourced answers.
   *     tags: [Regulations]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [question]
   *             properties:
   *               question: { type: string, minLength: 3, maxLength: 500 }
   *           example:
   *             question: "What are the data retention requirements under GDPR?"
   *     responses:
   *       200:
   *         description: AI-generated answer with regulatory sources
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 question: { type: string }
   *                 answer: { type: string }
   *                 sources:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/RegulationArticle'
   *                 cached: { type: boolean }
   *                 ai_enabled: { type: boolean }
   */
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
