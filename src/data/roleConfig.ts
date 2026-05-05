import { Role } from '../types';

export interface RoleConfig {
  role: Role;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  welcomeMessage: string;
  suggestedPrompts: string[];
}

export const roleConfigs: RoleConfig[] = [
  {
    role: 'C-Suite',
    label: 'C-Suite',
    shortLabel: 'C-Suite',
    icon: 'Briefcase',
    description: 'Strategy, growth & prioritization',
    welcomeMessage: 'Welcome, Executive. Pharmora Signal is ready to support portfolio prioritization, market positioning, and growth strategy decisions.',
    suggestedPrompts: [
      'Top strategic priority',
      'Portfolio risk summary',
      'Revenue diversification',
    ],
  },
  {
    role: 'R&D',
    label: 'R&D',
    shortLabel: 'R&D',
    icon: 'FlaskConical',
    description: 'Pipeline, trials & development risk',
    welcomeMessage: 'Welcome, R&D. Pharmora Signal can help with pipeline analysis, clinical trial design, endpoint selection, and development risk assessment.',
    suggestedPrompts: [
      'Phase 2 evidence gaps',
      'Adaptive trial design',
      'Pipeline development risks',
    ],
  },
  {
    role: 'Finance',
    label: 'Finance',
    shortLabel: 'Finance',
    icon: 'DollarSign',
    description: 'ROI, allocation & pricing risk',
    welcomeMessage: 'Welcome, Finance. Pharmora Signal can assist with R&D allocation modeling, risk-adjusted opportunity analysis, and payer pricing scenarios.',
    suggestedPrompts: [
      'Risk-adjusted ROI',
      'R&D budget allocation',
      'Phase 3 pricing risks',
    ],
  },
  {
    role: 'Marketing',
    label: 'Marketing',
    shortLabel: 'Marketing',
    icon: 'Megaphone',
    description: 'Positioning, access & competition',
    welcomeMessage: 'Welcome, Marketing. Pharmora Signal can help with competitive positioning, prescriber strategy, and market access messaging.',
    suggestedPrompts: [
      'Competitor positioning',
      'Key differentiators',
      'Target prescriber segments',
    ],
  },
  {
    role: 'Regulatory/Compliance',
    label: 'Regulatory/Compliance',
    shortLabel: 'Reg/Comp',
    icon: 'ShieldCheck',
    description: 'Compliance, audit & AI guardrails',
    welcomeMessage: 'Welcome, Regulatory/Compliance. Pharmora Signal provides full traceability, audit trails, and compliance risk assessment for all AI-generated recommendations.',
    suggestedPrompts: [
      'AI compliance risks',
      'Recent audit trail',
      'Governance framework',
    ],
  },
  {
    role: 'IT',
    label: 'IT',
    shortLabel: 'IT',
    icon: 'Server',
    description: 'Data, access control & security',
    welcomeMessage: 'Welcome, IT. Pharmora Signal can assist with data source validation, access control planning, and system integration requirements.',
    suggestedPrompts: [
      'Pipeline data sources',
      'Access control setup',
      'System integration',
    ],
  },
];

export function getRoleConfig(role: Role): RoleConfig {
  return roleConfigs.find((r) => r.role === role)!;
}

export function getRoleSystemMessage(role: Role): string {
  const config = getRoleConfig(role);
  const emphasisMap: Record<Role, string> = {
    'C-Suite': 'strategy, market share, growth, prioritization, and executive action',
    'R&D': 'pipeline development, clinical trial design, endpoints, evidence gaps, and development risk',
    'Finance': 'ROI, R&D allocation, payer pressure, and pricing risk',
    'Marketing': 'competitor positioning, prescriber strategy, trust, and access messaging',
    'Regulatory/Compliance': 'compliance risk, audit trail, human review, and AI guardrails',
    'IT': 'data sources, access control, system workflow, and security',
  };
  return `Now answering from a ${config.label} perspective. Responses will emphasize ${emphasisMap[role]}.`;
}
