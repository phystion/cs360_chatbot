import { EvidenceData, AuditRecord } from '../types';

interface Props {
  evidence: EvidenceData | null;
  audit: AuditRecord | null;
}

export function EvidencePanel({ evidence, audit }: Props) {
  return (
    <aside className="evidence-panel">
      <h3 className="evidence-title">Evidence Panel</h3>

      {!evidence && !audit && (
        <p className="evidence-empty">
          Ask a question to see supporting evidence, data sources, and traceability information here.
        </p>
      )}

      {evidence && (
        <div className="evidence-section">
          <h4 className="evidence-section-title">
            {evidence.type === 'pipeline' && 'Pipeline Data'}
            {evidence.type === 'competitor' && 'Competitor Intelligence'}
            {evidence.type === 'payer' && 'Payer Strategy Data'}
            {evidence.type === 'clinical' && 'Clinical Trial Data'}
            {evidence.type === 'compliance' && 'Compliance & Traceability'}
          </h4>

          {evidence.assets && (
            <div className="evidence-assets">
              <table className="evidence-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Area</th>
                    <th>Stage</th>
                    <th>Market</th>
                    <th>Approval %</th>
                  </tr>
                </thead>
                <tbody>
                  {evidence.assets.map((a) => (
                    <tr key={a.id}>
                      <td>{a.name}</td>
                      <td>{a.therapeuticArea}</td>
                      <td>{a.stage}</td>
                      <td>{a.marketOpportunityLabel}</td>
                      <td>{a.probabilityOfApproval ? `${a.probabilityOfApproval}%` : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {evidence.competitors && (
            <div className="evidence-competitors">
              {evidence.competitors.map((c) => (
                <div key={c.name} className="competitor-card">
                  <strong>{c.name}</strong>
                  <span className="threat-badge">{c.threatType}</span>
                  <p className="competitor-focus">{c.focus}</p>
                  <ul>
                    {c.initiatives.map((init, i) => (
                      <li key={i}>{init}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          <div className="evidence-details">
            {Object.entries(evidence.details).map(([key, value]) => (
              <div key={key} className="evidence-detail-row">
                <span className="detail-label">{key}</span>
                {Array.isArray(value) ? (
                  <ul className="detail-list">
                    {value.map((v, i) => <li key={i}>{v}</li>)}
                  </ul>
                ) : (
                  <span className="detail-value">{value}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {audit && (
        <div className="evidence-section audit-section">
          <h4 className="evidence-section-title">Audit Trail</h4>
          <div className="audit-record">
            <div className="audit-field"><span>ID:</span> {audit.id}</div>
            <div className="audit-field"><span>Role:</span> {audit.role}</div>
            <div className="audit-field"><span>Tool:</span> {audit.toolUsed}</div>
            <div className="audit-field"><span>Risk Level:</span>
              <span className={`risk-badge risk-${audit.riskLevel.toLowerCase()}`}>{audit.riskLevel}</span>
            </div>
            <div className="audit-field"><span>Review:</span> {audit.reviewStatus}</div>
            <div className="audit-field"><span>Time:</span> {new Date(audit.timestamp).toLocaleString()}</div>
          </div>
        </div>
      )}
    </aside>
  );
}
