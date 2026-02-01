import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Requirement {
  id: string;
  category: string;
  requirement: string;
  description: string;
  severity: string;
  controls: string[];
}

interface Framework {
  name: string;
  fullName: string;
  jurisdiction: string;
  effectiveDate: string;
  requirements: Requirement[];
}

interface RegulationsData {
  frameworks: Record<string, Framework>;
  riskMatrix: {
    likelihood: Record<string, number>;
    impact: Record<string, number>;
    riskLevels: Record<string, { min: number; max: number; color: string }>;
  };
  piiPatterns: Record<string, { pattern: string; description: string; severity: string }>;
}

interface RegulationsResource {
  summary: {
    totalFrameworks: number;
    totalRequirements: number;
    jurisdictions: string[];
  };
  frameworks: Array<{
    id: string;
    name: string;
    fullName: string;
    jurisdiction: string;
    effectiveDate: string;
    requirementCount: number;
    categories: string[];
    severityCounts: Record<string, number>;
  }>;
  riskMatrix: RegulationsData["riskMatrix"];
  piiPatternCount: number;
}

export async function getRegulationsResource(): Promise<RegulationsResource> {
  const regulationsPath = join(__dirname, "../../data/regulations.json");
  const data: RegulationsData = JSON.parse(readFileSync(regulationsPath, "utf-8"));

  const frameworkList = Object.entries(data.frameworks).map(([id, fw]) => {
    const categories = [...new Set(fw.requirements.map((r) => r.category))];
    const severityCounts: Record<string, number> = {};

    for (const req of fw.requirements) {
      severityCounts[req.severity] = (severityCounts[req.severity] || 0) + 1;
    }

    return {
      id,
      name: fw.name,
      fullName: fw.fullName,
      jurisdiction: fw.jurisdiction,
      effectiveDate: fw.effectiveDate,
      requirementCount: fw.requirements.length,
      categories,
      severityCounts,
    };
  });

  const totalRequirements = frameworkList.reduce((sum, fw) => sum + fw.requirementCount, 0);
  const jurisdictions = [...new Set(frameworkList.map((fw) => fw.jurisdiction))];

  return {
    summary: {
      totalFrameworks: frameworkList.length,
      totalRequirements,
      jurisdictions,
    },
    frameworks: frameworkList,
    riskMatrix: data.riskMatrix,
    piiPatternCount: Object.keys(data.piiPatterns).length,
  };
}
