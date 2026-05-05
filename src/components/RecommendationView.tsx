import { useState } from 'react';
import {
  FileText,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Info,
  Copy,
  Check,
  Database,
  ShieldCheck,
} from 'lucide-react';
import { ChatMessage, EvidenceData } from '../types';
import { parseStructuredResponse } from '../lib/recommendationEngine';
import { pipelineAssets } from '../data/pipelineData';
import { competitors } from '../data/competitorData';
import { implementationSources } from '../data/companyData';

interface Props {
  message: ChatMessage;
  onExport: () => void;
  onBack: () => void;
}

export function RecommendationView({ message, onExport, onBack }: Props) {
  const [copied, setCopied] = useState(false);

  const confidence = message.audit?.riskLevel === 'Low' ? 91 : message.audit?.riskLevel === 'High' ? 58 : 82;
  const confidenceLabel = confidence >= 80 ? 'High' : confidence >= 60 ? 'Moderate' : 'Low';

  const sections = getSections(message.content);
  const sources = message.evidence ? buildCitedSources(message.evidence) : [];

  const handleCopy = () => {
    const summary = [
      sections.recommendation && `Recommendation: ${sections.recommendation}`,
      sections.strategicRisk && `Strategic Risk: ${sections.strategicRisk}`,
      sections.nextAction && `Next Action: ${sections.nextAction}`,
    ]
      .filter(Boolean)
      .join('\n\n');
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="recommendation-screen">
      <div className="recommendation-header">
        <button className="rec-back-btn" onClick={onBack}>Back to Chat</button>
        <h2>AI-Generated Recommendation</h2>
        <div className="rec-confidence">
          <span className="confidence-label">Confidence Level</span>
          <div className="confidence-bar">
            <div className="confidence-fill" style={{ width: `${confidence}%` }}></div>
          </div>
          <span className="confidence-value">{confidence}% {confidenceLabel}</span>
        </div>
      </div>

      <div className="recommendation-body">
        <div className="rec-main">
          {sections.recommendation && (
            <div className="rec-section rec-answer">
              <div className="rec-section-header">
                <CheckCircle size={16} />
                <h3>Recommendation</h3>
              </div>
              <p>{sections.recommendation}</p>
            </div>
          )}

          {sources.length > 0 && (
            <div className="rec-section rec-sources">
              <div className="rec-section-header">
                <Database size={16} />
                <h3>Cited Data Sources</h3>
              </div>
              <div className="rec-source-list">
                {sources.map((src) => (
                  <div key={src.name} className="rec-source-card">
                    <div className="rec-source-card-head">
                      <div className="rec-source-card-titles">
                        <span className="rec-source-name">{src.name}</span>
                        <span className="rec-source-meta">
                          {src.owner} / {src.records}
                        </span>
                      </div>
                      <span className={`rec-source-access access-${src.access.toLowerCase()}`}>
                        {src.access === 'Restricted' && <ShieldCheck size={10} />}
                        {src.access}
                      </span>
                    </div>
                    {src.dataPoints.length > 0 && (
                      <ul className="rec-source-points">
                        {src.dataPoints.map((point) => (
                          <li key={point.label}>
                            <span className="rec-source-point-label">{point.label}</span>
                            <span className="rec-source-point-value">{point.value}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {sections.strategicRisk && (
            <div className="rec-section rec-risk">
              <div className="rec-section-header">
                <AlertTriangle size={16} />
                <h3>Strategic Risk Assessment</h3>
              </div>
              <p>{sections.strategicRisk}</p>
            </div>
          )}

          {sections.nextAction && (
            <div className="rec-section rec-next">
              <div className="rec-section-header">
                <Info size={16} />
                <h3>Recommended Next Steps</h3>
              </div>
              <p>{sections.nextAction}</p>
            </div>
          )}
        </div>

        <div className="rec-sidebar">
          <div className="rec-actions">
            <h4>Actions</h4>
            <button className="rec-action-btn" onClick={onExport}>
              <FileText size={14} />
              Export Decision Summary
            </button>
            <button className="rec-action-btn" onClick={handleCopy}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy Summary'}
            </button>
            <button className="rec-action-btn" onClick={onBack}>
              <ExternalLink size={14} />
              Back to Conversation
            </button>
          </div>

          {message.audit && (
            <div className="rec-audit-trail">
              <h4>Audit Trail</h4>
              <div className="audit-mini">
                <div className="audit-mini-row"><span>Query ID</span><span>{message.audit.id}</span></div>
                <div className="audit-mini-row"><span>Role</span><span>{message.audit.role}</span></div>
                <div className="audit-mini-row">
                  <span>Risk Level</span>
                  <span className={`risk-badge risk-${message.audit.riskLevel.toLowerCase()}`}>{message.audit.riskLevel}</span>
                </div>
                <div className="audit-mini-row">
                  <span>Generated</span>
                  <span>{new Date(message.audit.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ParsedSections {
  recommendation: string;
  strategicRisk: string;
  nextAction: string;
}

function getSections(content: string): ParsedSections {
  const structured = parseStructuredResponse(content);
  if (structured) {
    return {
      recommendation: structured.recommendation,
      strategicRisk: structured.strategicRisk,
      nextAction: structured.nextAction,
    };
  }
  const stripped = content.replace(/\*\*/g, '').trim();
  return {
    recommendation: stripped.slice(0, 800),
    strategicRisk: '',
    nextAction: '',
  };
}

interface CitedSource {
  name: string;
  owner: string;
  access: string;
  records: string;
  dataPoints: { label: string; value: string }[];
}

function buildCitedSources(evidence: EvidenceData): CitedSource[] {
  const findSource = (name: string) =>
    implementationSources.find((s) => s.name === name) || {
      name,
      owner: 'Internal',
      access: 'Standard',
    };

  const fromDetails = (
    keys: string[],
  ): { label: string; value: string }[] =>
    keys
      .map((key) => {
        const raw = evidence.details[key];
        if (!raw) return null;
        return {
          label: key,
          value: Array.isArray(raw) ? raw.join(', ') : String(raw),
        };
      })
      .filter((entry): entry is { label: string; value: string } => entry !== null);

  switch (evidence.type) {
    case 'pipeline': {
      const pipeline = findSource('R&D pipeline data');
      const assets = evidence.assets || pipelineAssets;
      return [
        {
          name: pipeline.name,
          owner: pipeline.owner,
          access: pipeline.access,
          records: `${assets.length} assets cited`,
          dataPoints: assets.slice(0, 4).map((asset) => ({
            label: asset.name,
            value: `${asset.therapeuticArea} / ${asset.stage} / ${asset.marketOpportunityLabel}${
              asset.probabilityOfApproval ? ` / ${asset.probabilityOfApproval}% PoA` : ''
            }`,
          })),
        },
        {
          name: 'Financial reports',
          owner: 'Finance',
          access: 'Restricted',
          records: 'Risk-adjusted opportunity model',
          dataPoints: fromDetails([
            'Risk-Adjusted Opportunity (PH-CV-301)',
            'Risk-Adjusted Opportunity (PH-CV-302)',
            'Strategic Label',
          ]),
        },
      ];
    }
    case 'competitor': {
      const market = findSource('Competitor updates');
      const list = evidence.competitors || competitors;
      return [
        {
          name: market.name,
          owner: market.owner,
          access: market.access,
          records: `${list.length} competitors monitored`,
          dataPoints: list.map((c) => ({
            label: c.name,
            value: c.threatType,
          })),
        },
        {
          name: 'Market analysis docs',
          owner: 'Marketing',
          access: 'Standard',
          records: 'Overlap and threat scoring',
          dataPoints: fromDetails([
            'Primary Threat',
            'Commercial Threat',
            'Pharmora Overlap Areas',
          ]),
        },
      ];
    }
    case 'payer':
      return [
        {
          name: 'Market analysis docs',
          owner: 'Marketing',
          access: 'Standard',
          records: 'Pricing and access scenarios',
          dataPoints: fromDetails([
            'Pricing Pressure (CV Phase 3)',
            'Pricing Pressure (Endocrinology)',
            'Patient Access Risk',
          ]),
        },
        {
          name: 'Financial reports',
          owner: 'Finance',
          access: 'Restricted',
          records: 'Coverage and reimbursement model',
          dataPoints: fromDetails([
            'Coverage Risk (PH-CV-301)',
            'Coverage Risk (PH-EN-202)',
            'Reimbursement Strategy',
            'Launch Implication',
          ]),
        },
      ];
    case 'clinical': {
      const pipeline = findSource('R&D pipeline data');
      return [
        {
          name: pipeline.name,
          owner: pipeline.owner,
          access: pipeline.access,
          records: 'Trial design context',
          dataPoints: fromDetails([
            'Trial Phase',
            'Suggested Design',
            'Primary Endpoint (PH-EN-201)',
            'Primary Endpoint (PH-EN-202)',
            'Secondary Endpoints',
            'Evidence Gaps',
          ]),
        },
      ];
    }
    case 'compliance': {
      const audit = findSource('Audit logs');
      return [
        {
          name: audit.name,
          owner: audit.owner,
          access: audit.access,
          records: 'AI governance and traceability',
          dataPoints: fromDetails([
            'System Classification',
            'Data Used',
            'Risk Level',
            'Guardrails Active',
          ]),
        },
      ];
    }
    default:
      return [];
  }
}
