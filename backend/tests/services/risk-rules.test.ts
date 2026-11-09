import { describe, it, expect } from "vitest";
import { assessRiskByRules } from "../../src/services/risk-rules.js";

describe("assessRiskByRules", () => {
  it("is deterministic (same input, same result)", () => {
    // Regression: the previous fallback used Math.random() for factor scores.
    const input = { pep: true, relationship_years: 2 };
    expect(assessRiskByRules("customer", input)).toEqual(assessRiskByRules("customer", input));
  });

  it("scores a clean, long-standing customer as low", () => {
    const result = assessRiskByRules("customer", { relationship_years: 5 });
    expect(result.level).toBe("low");
    expect(result.factors.every((f) => f.score === 1)).toBe(true);
  });

  it("raises risk for PEPs in high-risk jurisdictions", () => {
    const result = assessRiskByRules("customer", { pep: true, high_risk_jurisdiction: true, adverse_media: true });
    expect(["high", "critical"]).toContain(result.level);
    expect(result.recommendations).toContain("Enhanced Due Diligence required");
  });

  it("always rates a sanctions hit as critical", () => {
    expect(assessRiskByRules("vendor", { sanctions_hit: true, relationship_years: 10 }).level).toBe("critical");
  });

  it("only scores PEP exposure for customers", () => {
    expect(assessRiskByRules("vendor").factors.map((f) => f.name)).not.toContain("PEP Exposure");
    expect(assessRiskByRules("customer").factors.map((f) => f.name)).toContain("PEP Exposure");
  });
});
