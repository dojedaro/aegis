import { describe, it, expect, beforeAll } from "vitest";
import { RAGService } from "../../src/services/rag.js";

describe("RAGService", () => {
  let ragService: RAGService;

  beforeAll(async () => {
    // RAG service doesn't need database for basic functionality
    ragService = new RAGService();
  });

  describe("search", () => {
    it("should find GDPR articles for consent queries", () => {
      const results = ragService.search("consent");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.article.framework === "gdpr")).toBe(true);
    });

    it("should find eIDAS articles for wallet queries", () => {
      const results = ragService.search("digital identity wallet");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.article.framework === "eidas")).toBe(true);
    });

    it("should find AML articles for PEP queries", () => {
      const results = ragService.search("politically exposed person PEP");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.article.framework === "aml")).toBe(true);
    });

    it("should find EU AI Act articles for biometric queries", () => {
      const results = ragService.search("biometric AI high risk");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.article.framework === "eu-ai-act")).toBe(true);
    });

    it("should limit results correctly", () => {
      const results = ragService.search("data", 3);
      expect(results.length).toBeLessThanOrEqual(3);
    });

    it("should return empty array for irrelevant queries", () => {
      const results = ragService.search("xyznonexistent123");
      expect(results.length).toBe(0);
    });
  });

  describe("getFrameworks", () => {
    it("should return all four frameworks", () => {
      const frameworks = ragService.getFrameworks();
      expect(frameworks.length).toBe(4);
      expect(frameworks.map((f) => f.id).sort()).toEqual(["aml", "eidas", "eu-ai-act", "gdpr"]);
    });

    it("should include article counts", () => {
      const frameworks = ragService.getFrameworks();
      frameworks.forEach((f) => {
        expect(f.articleCount).toBeGreaterThan(0);
      });
    });
  });

  describe("getArticlesByFramework", () => {
    it("should return articles for GDPR", () => {
      const articles = ragService.getArticlesByFramework("gdpr");
      expect(articles.length).toBeGreaterThan(0);
      articles.forEach((a) => {
        expect(a.framework).toBe("gdpr");
      });
    });

    it("should return empty array for invalid framework", () => {
      const articles = ragService.getArticlesByFramework("invalid");
      expect(articles.length).toBe(0);
    });
  });

  describe("getAllArticles", () => {
    it("should return all articles", () => {
      const articles = ragService.getAllArticles();
      expect(articles.length).toBeGreaterThan(20);
    });

    it("should have required fields for each article", () => {
      const articles = ragService.getAllArticles();
      articles.forEach((a) => {
        expect(a.id).toBeDefined();
        expect(a.framework).toBeDefined();
        expect(a.title).toBeDefined();
        expect(a.summary).toBeDefined();
        expect(a.relevance).toBeDefined();
        expect(a.officialLink).toMatch(/^https:\/\/eur-lex\.europa\.eu/);
        expect(Array.isArray(a.keywords)).toBe(true);
      });
    });
  });
});
