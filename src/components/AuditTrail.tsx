import { AuditRecord } from '../types';

interface Props {
  records: AuditRecord[];
}

export function AuditTrail({ records }: Props) {
  if (records.length === 0) return null;

  return (
    <div className="audit-trail">
      <h4>Session Audit Log ({records.length} records)</h4>
      <div className="audit-list">
        {records.map((r) => (
          <div key={r.id} className="audit-item">
            <span className="audit-id">{r.id}</span>
            <span className="audit-tool">{r.toolUsed}</span>
            <span className={`risk-badge risk-${r.riskLevel.toLowerCase()}`}>{r.riskLevel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
