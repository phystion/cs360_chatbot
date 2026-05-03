export type Role = 'C-Suite' | 'R&D' | 'Finance' | 'Marketing' | 'Regulatory/Compliance' | 'IT';

export interface PipelineAsset {
  id: number;
  name: string;
  therapeuticArea: string;
  stage: string;
  description: string;
  launchYear: string;
  marketOpportunity: number;
  marketOpportunityLabel: string;
  probabilityOfApproval: number | null;
}

export interface Competitor {
  name: string;
  focus: string;
  initiatives: string[];
  threatType: string;
  overlapWithPharmora: string;
}

export interface AuditRecord {
  id: string;
  role: Role;
  question: string;
  toolUsed: string;
  dataUsed: string;
  assumptions: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  reviewStatus: string;
  timestamp: string;
}

export interface EvidenceData {
  type: 'pipeline' | 'clinical' | 'payer' | 'competitor' | 'compliance';
  assets?: PipelineAsset[];
  competitors?: Competitor[];
  details: Record<string, string | string[]>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  evidence?: EvidenceData;
  audit?: AuditRecord;
}

export interface StructuredResponse {
  recommendation: string;
  evidenceUsed: string;
  strategicRisk: string;
  nextAction: string;
  humanReviewNeeded: string;
  traceabilityTag: string;
}
