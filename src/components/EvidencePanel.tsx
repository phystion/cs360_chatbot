import {
  Database,
  Users,
  ListChecks,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { EvidenceData, AuditRecord } from '../types';

interface Props {
  evidence: EvidenceData | null;
  audit: AuditRecord | null;
  open: boolean;
}

const TYPE_META: Record<EvidenceData['type'], { label: string; description: string }> = {
  pipeline: { label: 'Pipeline Data', description: 'Internal portfolio assets and stage information' },
  competitor: { label: 'Competitor Intelligence', description: 'External competitive landscape signals' },
  payer: { label: 'Payer Strategy Data', description: 'Coverage, access, and pricing landscape' },
  clinical: { label: 'Clinical Trial Data', description: 'Trial design and endpoint references' },
  compliance: { label: 'Compliance & Traceability', description: 'Audit, governance, and risk evidence' },
};

export function EvidencePanel({ evidence, audit, open }: Props) {
  const hasNothing = !evidence && !audit;

  if (!open) return null;

  return (
    <aside className="evidence-panel">
      <div className="evidence-panel-heading">
        <span className="evidence-title">Sources &amp; Audit</span>
        <span className="evidence-subtitle">What this answer is grounded in</span>
      </div>

      <>
        {hasNothing && (
            <div className="evidence-empty">
              <div className="evidence-empty-icon">
                <FileText size={26} />
              </div>
              <h4>No question yet</h4>
              <p>
                Ask Pharmora Co-Assist something — the data sources, competitor signals,
                and traceable audit record used to build the answer will appear here.
              </p>
            </div>
          )}

          {evidence && (
            <>
              <section className="evidence-card">
                <div className="evidence-card-header">
                  <Database size={14} />
                  <div className="evidence-card-titles">
                    <span className="evidence-card-title">{TYPE_META[evidence.type].label}</span>
                    <span className="evidence-card-subtitle">{TYPE_META[evidence.type].description}</span>
                  </div>
                </div>

                {evidence.assets && evidence.assets.length > 0 && (
                  <table className="evidence-table">
                    <thead>
                      <tr>
                        <th>Asset</th>
                        <th>Stage</th>
                        <th>PoA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evidence.assets.map((a) => (
                        <tr key={a.id}>
                          <td>
                            <div className="evidence-asset-name">{a.name}</div>
                            <div className="evidence-asset-area">
                              {a.therapeuticArea} · {a.marketOpportunityLabel}
                            </div>
                          </td>
                          <td>{a.stage}</td>
                          <td>{a.probabilityOfApproval ? `${a.probabilityOfApproval}%` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>

              {evidence.competitors && evidence.competitors.length > 0 && (
                <section className="evidence-card">
                  <div className="evidence-card-header">
                    <Users size={14} />
                    <div className="evidence-card-titles">
                      <span className="evidence-card-title">Competitors</span>
                      <span className="evidence-card-subtitle">
                        {evidence.competitors.length} signal{evidence.competitors.length === 1 ? '' : 's'} tracked
                      </span>
                    </div>
                  </div>
                  <div className="evidence-competitors">
                    {evidence.competitors.map((c) => (
                      <div key={c.name} className="competitor-card">
                        <div className="competitor-card-row">
                          <strong>{c.name}</strong>
                          <span className="threat-badge">{c.threatType}</span>
                        </div>
                        <p className="competitor-focus">{c.focus}</p>
                        {c.initiatives.length > 0 && (
                          <ul>
                            {c.initiatives.map((init, i) => (
                              <li key={i}>{init}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {Object.keys(evidence.details).length > 0 && (
                <section className="evidence-card">
                  <div className="evidence-card-header">
                    <ListChecks size={14} />
                    <div className="evidence-card-titles">
                      <span className="evidence-card-title">Reference Points</span>
                      <span className="evidence-card-subtitle">Cited inputs to the recommendation</span>
                    </div>
                  </div>
                  <div className="evidence-details">
                    {Object.entries(evidence.details).map(([key, value]) => (
                      <div key={key} className="evidence-detail-row">
                        <span className="detail-label">{key}</span>
                        {Array.isArray(value) ? (
                          <ul className="detail-list">
                            {value.map((v, i) => (
                              <li key={i}>{v}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="detail-value">{value}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {audit && (
            <section className="evidence-card audit-card">
              <div className="evidence-card-header">
                <ShieldCheck size={14} />
                <div className="evidence-card-titles">
                  <span className="evidence-card-title">Audit Trail</span>
                  <span className="evidence-card-subtitle">Traceable record for this answer</span>
                </div>
                <span className={`risk-badge risk-${audit.riskLevel.toLowerCase()}`}>
                  {audit.riskLevel} risk
                </span>
              </div>
              <div className="audit-record">
                <div className="audit-row">
                  <span>ID</span>
                  <span className="audit-mono">{audit.id}</span>
                </div>
                <div className="audit-row">
                  <span>Tool</span>
                  <span>{audit.toolUsed}</span>
                </div>
                <div className="audit-row">
                  <span>Role</span>
                  <span>{audit.role}</span>
                </div>
                <div className="audit-row">
                  <span>Review</span>
                  <span>{audit.reviewStatus}</span>
                </div>
                <div className="audit-row">
                  <span>Generated</span>
                  <span>{new Date(audit.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </section>
          )}
      </>
    </aside>
  );
}
