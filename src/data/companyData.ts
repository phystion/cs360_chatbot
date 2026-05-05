export const pharmoraProfile = {
  company: 'Pharmora',
  headquarters: 'Boston, Massachusetts',
  size: 'Under 30 employees',
  coreArea: 'Cardiovascular prescription drugs',
  problem:
    'Growth and market share have slowed because decisions are manual, the portfolio is overconcentrated, and competitors are moving faster in obesity and diabetes.',
};

export const financialSnapshot = {
  grossMargin: '~60%',
  revenueGrowth2024: '4.43%',
  cardiovascularRevenueMix: '~80%',
  targetCardiovascularMix: '65-70%',
  targetRevenueGrowth: '6-8%',
  planningHorizon: '3-5 years',
};

export const operatingExpenseMix = [
  { segment: 'SG&A', share: 35 },
  { segment: 'Marketing & Sales', share: 30 },
  { segment: 'R&D', share: 25 },
  { segment: 'Other', share: 10 },
];

export const strategicObjectives = [
  { label: 'Market share', value: 'Recover', detail: 'Strengthen competitive position within 5 years' },
  { label: 'CV dependence', value: 'Reduce', detail: 'Move from about 80% toward 65-70%' },
  { label: 'Growth rate', value: '6-8%', detail: 'Target annual revenue growth in 3-5 years' },
];

export const implementationSources = [
  { name: 'Financial reports', owner: 'Finance', access: 'Restricted' },
  { name: 'R&D pipeline data', owner: 'R&D', access: 'Restricted' },
  { name: 'Market analysis docs', owner: 'Marketing', access: 'Standard' },
  { name: 'Competitor updates', owner: 'Marketing', access: 'Standard' },
  { name: 'Audit logs', owner: 'Reg/Comp', access: 'Restricted' },
];

export const governanceRequirements = [
  'Role-based access control for sensitive financial and pipeline data',
  'Evidence references for every recommendation',
  'Low-confidence and insufficient-data warnings',
  'Audit log with user, timestamp, query, response, and confidence level',
  'Minimum 3-year audit log retention',
  'Structured onboarding before first active use',
];

export const departmentUseCases = {
  'C-Suite': [
    'Prioritize market-share recovery and growth strategy',
    'Compare diversification scenarios before capital allocation',
    'Review exportable recommendations with cited rationale',
  ],
  'R&D': [
    'Compare therapeutic area scenarios side-by-side',
    'Use internal pipeline and external market context together',
    'Identify evidence gaps before advancing assets',
  ],
  Finance: [
    'Model ROI, budget tradeoffs, and pricing pressure',
    'Prepare investor-ready decision summaries',
    'Validate financial justification behind recommendations',
  ],
  Marketing: [
    'Monitor Cardiva, Firenza, BioNova, and Ash & Co',
    'Tune market access and prescriber messaging',
    'Connect patient, physician, and partner outreach to strategy',
  ],
  'Regulatory/Compliance': [
    'Review AI governance, human review, and traceability',
    'Export auditable query and response logs',
    'Verify FDA-aligned guardrails before scaled deployment',
  ],
  IT: [
    'Validate data ingestion and refresh readiness',
    'Maintain RBAC and role assignment logs',
    'Monitor source availability and integration health',
  ],
} as const;
