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
  overallRiskScore: number;
  overallRiskLevel: RiskLevel;
  executiveSummary: string;
  clauses: Clause[];
  keyTerms: string[];
  missingClauses: string[];
  createdAt: string;
}

// Chat types for the legal assistant
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface DocumentContext {
  fileName: string;
  fileType: "pdf" | "docx";
  text: string;
  fileUrl: string;
  htmlContent?: string; // For DOCX rendered as HTML
}

export interface UserPosition {
  role: string; // e.g. "Buyer", "Seller", "Tenant", "Employer", "Employee"
  customDescription?: string; // optional extra context
}
