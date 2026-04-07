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

// Client & Matter types
export type MatterType = 'analysis' | 'compliance_check' | 'due_diligence';

export interface Client {
  id: string;
  user_id: string;
  name: string;
  contact_name?: string;
  company_type?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  matter_count?: number;
}

export interface Matter {
  id: string;
  client_id: string;
  user_id: string;
  name: string;
  description?: string;
  matter_type: MatterType;
  status: string;
  created_at: string;
  updated_at: string;
  project_count?: number;
}

// Delivery feature types
export type DeliverableAudience = 'client' | 'partner';

export type DeliverableFormat =
  | 'client_email'
  | 'written_report'
  | 'annotated_document'
  | 'presentation_outline'
  | 'letter_of_advice'
  | 'negotiation_playbook'
  | 'risk_register';

export interface Deliverable {
  id: string;
  project_id: string;
  user_id: string;
  audience: DeliverableAudience;
  format: DeliverableFormat;
  title: string;
  content: string;
  ai_generated_content?: string;
  created_at: string;
  updated_at: string;
}
