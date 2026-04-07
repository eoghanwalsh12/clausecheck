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

// Compliance Check types
export type ComplianceJobStatus =
  | 'pending' | 'uploading' | 'extracting' | 'analysing' | 'complete' | 'error';

export type ComplianceTier = 'non_compliant' | 'risky' | 'compliant';

export type ComplianceRiskBasis = 'interpretive' | 'future_legislation' | 'ambiguous_drafting';

export type ComplianceTopicArea =
  | 'Data Processing' | 'Liability' | 'Termination' | 'Intellectual Property'
  | 'Confidentiality' | 'Payment Terms' | 'Dispute Resolution' | 'Employment'
  | 'Regulatory' | 'Other';

export type ContractStatus = 'compliant' | 'risky' | 'non_compliant';

export interface ComplianceJob {
  id: string;
  user_id: string;
  matter_id?: string;
  name: string;
  legislation_name: string;
  status: ComplianceJobStatus;
  error_message?: string;
  requirements_count: number;
  total_contracts: number;
  contracts_done: number;
  compliant_contracts: number;
  risky_contracts: number;
  noncompliant_contracts: number;
  created_at: string;
  updated_at: string;
}

export type ComplianceDocType = 'legislation' | 'contract';

export interface ComplianceDocument {
  id: string;
  job_id: string;
  user_id: string;
  doc_type: ComplianceDocType;
  file_name: string;
  file_type: 'pdf' | 'docx';
  storage_path: string;
  char_count?: number;
  contract_status?: ContractStatus;
  contract_summary?: string;
  noncompliant_count: number;
  risky_count: number;
  compliant_count: number;
  status: 'pending' | 'done' | 'error';
  created_at: string;
}

export interface ComplianceRequirement {
  id: string;
  job_id: string;
  user_id: string;
  legislation_doc_id?: string;
  article_ref: string;
  requirement_text: string;
  obligation_type?: 'obligation' | 'prohibition' | 'right' | 'definition' | 'procedure';
}

export interface ComplianceFinding {
  id: string;
  job_id: string;
  contract_doc_id: string;
  user_id: string;
  compliance_tier: ComplianceTier;
  risk_basis?: ComplianceRiskBasis;
  topic_area?: ComplianceTopicArea;
  clause_text?: string;
  legislation_ref: string;
  issue_summary: string;
  suggested_fix?: string;
  created_at: string;
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
