import { Role, ChatMessage, EvidenceData, StructuredResponse } from '../types';
import { pipelineAssets } from '../data/pipelineData';
import { competitors } from '../data/competitorData';
import { createAuditRecord } from '../data/auditLog';

export function classifyTool(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('compliance') || q.includes('audit') || q.includes('traceab') || q.includes('ai system') || q.includes('guardrail'))
    return 'Compliance / Traceability Log';
  if (q.includes('competitor') || q.includes('threat') || q.includes('cardiva') || q.includes('firenza') || q.includes('bionova') || q.includes('ash'))
    return 'Competitor Monitor';
  if (q.includes('payer') || q.includes('pricing') || q.includes('reimburse') || q.includes('coverage'))
    return 'Payer Strategy Simulator';
  if (q.includes('trial') || q.includes('endpoint') || q.includes('clinical design'))
    return 'Clinical Trial Design Assistant';
  if (q.includes('prioriti') || q.includes('pipeline') || q.includes('asset') || q.includes('phase 3') || q.includes('diversif') || q.includes('balance') || q.includes('cardiovascular dependence') || q.includes('endocrinology') || q.includes('revenue'))
    return 'Pipeline Prioritizer';
  return 'Recommendation Chatbot';
}

export function classifyEvidenceType(question: string): EvidenceData['type'] {
  const q = question.toLowerCase();
  if (q.includes('compliance') || q.includes('audit') || q.includes('traceab') || q.includes('ai system') || q.includes('guardrail'))
    return 'compliance';
  if (q.includes('competitor') || q.includes('threat') || q.includes('cardiva') || q.includes('firenza') || q.includes('bionova') || q.includes('ash'))
    return 'competitor';
  if (q.includes('payer') || q.includes('pricing') || q.includes('reimburse') || q.includes('coverage'))
    return 'payer';
  if (q.includes('trial') || q.includes('endpoint') || q.includes('clinical design'))
    return 'clinical';
  return 'pipeline';
}

export function buildEvidenceForType(type: EvidenceData['type']): EvidenceData {
  switch (type) {
    case 'pipeline':
      return {
        type: 'pipeline',
        assets: pipelineAssets,
        details: {
          'Risk-Adjusted Opportunity (PH-CV-301)': '$14.55B (97% x $15B)',
          'Risk-Adjusted Opportunity (PH-CV-302)': '$11.28B (94% x $12B)',
          'Risk-Adjusted Opportunity (PH-CV-201)': '$5.68B (71% x $8B)',
          'Risk-Adjusted Opportunity (PH-EN-201)': '$5.68B (71% x $8B) + diversification boost',
          'Risk-Adjusted Opportunity (PH-EN-202)': '$4.62B (66% x $7B) + diversification boost',
          'Risk-Adjusted Opportunity (PH-EN-101)': 'Not enough approval data',
          'Strategic Label': 'Staged diversification: secure near-term CV revenue, fund endocrinology expansion',
          'Key Assumption': 'Market opportunity estimates remain stable over planning horizon',
        },
      };
    case 'competitor':
      return {
        type: 'competitor',
        competitors,
        details: {
          'Primary Threat': 'Cardiva — most direct strategic overlap',
          'Commercial Threat': 'Firenza — affordable oral obesity, digital engagement',
          'Pipeline Threat': 'BioNova — licensing and partnerships for speed',
          'Technology Benchmark': 'Ash & Co — generative AI, automation',
          'Pharmora Overlap Areas': 'Cardiovascular, obesity, diabetes, AI capabilities',
        },
      };
    case 'payer':
      return {
        type: 'payer',
        details: {
          'Pricing Pressure (CV Phase 3)': 'Moderate — established market with generics',
          'Pricing Pressure (Endocrinology)': 'High — Firenza affordable alternatives',
          'Coverage Risk (PH-CV-301)': 'Low — strong efficacy data expected',
          'Coverage Risk (PH-EN-202)': 'Medium — must differentiate from oral competitors',
          'Patient Access Risk': 'Medium — depends on formulary placement and copay',
          'Reimbursement Strategy': 'Value-based contracting for CV; outcomes-based for endocrinology',
          'Launch Implication': 'Early payer engagement critical for 2028 endocrinology launches',
        },
      };
    case 'clinical':
      return {
        type: 'clinical',
        details: {
          'Trial Phase': 'Phase 2 (PH-EN-201, PH-EN-202)',
          'Suggested Design': 'Adaptive with interim analysis',
          'Primary Endpoint (PH-EN-201)': 'HbA1c reduction from baseline',
          'Primary Endpoint (PH-EN-202)': 'Percentage body weight loss',
          'Secondary Endpoints': 'Cardiovascular outcomes, metabolic biomarkers, safety',
          'Evidence Gaps': 'Long-term cardiovascular benefit of oral diabetes agents; durability of weight loss',
          'Development Risk': 'Medium — adaptive design complexity, competitive timeline pressure',
          'Human Review Owner': 'R&D Lead, Chief Medical Officer',
        },
      };
    case 'compliance':
      return {
        type: 'compliance',
        details: {
          'System Classification': 'Internal decision support only',
          'Data Used': 'AI use case documentation, recommendation logs, role assignments',
          'Key Assumptions': 'AI is decision support only, not autonomous decision-maker',
          'Risk Level': 'High — requires governance framework before scaled deployment',
          'Human Review Status': 'Requires compliance committee review',
          'Guardrails Active': [
            'No autonomous medical diagnosis',
            'No prescription recommendations',
            'No claim of FDA approval',
            'Human review required for all outputs',
            'Full traceability to source data',
            'Role-based access control recommended',
          ],
        },
      };
  }
}

export function parseStructuredResponse(text: string): StructuredResponse | null {
  const sections: Record<string, string> = {};
  const patterns = [
    { key: 'recommendation', regex: /\*\*Recommendation:\*\*\s*([\s\S]*?)(?=\*\*Evidence Used:\*\*|$)/ },
    { key: 'evidenceUsed', regex: /\*\*Evidence Used:\*\*\s*([\s\S]*?)(?=\*\*Strategic Risk:\*\*|$)/ },
    { key: 'strategicRisk', regex: /\*\*Strategic Risk:\*\*\s*([\s\S]*?)(?=\*\*Next Action:\*\*|$)/ },
    { key: 'nextAction', regex: /\*\*Next Action:\*\*\s*([\s\S]*?)(?=\*\*Human Review Needed:\*\*|$)/ },
    { key: 'humanReviewNeeded', regex: /\*\*Human Review Needed:\*\*\s*([\s\S]*?)(?=\*\*Traceability Tag:\*\*|$)/ },
    { key: 'traceabilityTag', regex: /\*\*Traceability Tag:\*\*\s*([\s\S]*?)$/ },
  ];

  for (const { key, regex } of patterns) {
    const match = text.match(regex);
    if (match) {
      sections[key] = match[1].trim();
    }
  }

  if (sections.recommendation && sections.traceabilityTag) {
    return {
      recommendation: sections.recommendation || '',
      evidenceUsed: sections.evidenceUsed || '',
      strategicRisk: sections.strategicRisk || '',
      nextAction: sections.nextAction || '',
      humanReviewNeeded: sections.humanReviewNeeded || '',
      traceabilityTag: sections.traceabilityTag || '',
    };
  }

  return null;
}

export function buildAssistantMessage(
  rawContent: string,
  question: string,
  role: Role,
  parseFailed: boolean
): ChatMessage {
  const tool = classifyTool(question);
  const evidenceType = classifyEvidenceType(question);
  const evidence = buildEvidenceForType(evidenceType);
  const riskLevel = evidenceType === 'compliance' ? 'High' as const : 'Medium' as const;

  const audit = createAuditRecord(
    role,
    question,
    tool,
    `Groq LLM response using ${tool} context`,
    'AI-generated response grounded in mock pipeline and competitor data',
    riskLevel
  );

  const content = parseFailed
    ? `**Warning: Response format could not be fully parsed. Displaying raw AI response.**\n\n${rawContent}`
    : rawContent;

  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    content,
    evidence,
    audit,
  };
}
