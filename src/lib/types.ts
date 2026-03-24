export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface Clause {
  title: string;
  category: string;
  originalText: string;
  plainEnglish: string;
  riskLevel: RiskLevel;
  riskExplanation: string;
  suggestedAlternative: string | null;
}

export interface ContractAnalysis {
  id: string;
  fileName: string;
  contractType: string;
  parties: string[];
  effectiveDate: string | null;
  overallRiskScore: number; // 1-10
  overallRiskLevel: RiskLevel;
  executiveSummary: string;
  clauses: Clause[];
  keyTerms: string[];
  missingClauses: string[];
  createdAt: string;
}
