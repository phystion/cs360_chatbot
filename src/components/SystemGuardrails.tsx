import { useState } from 'react';

const guardrails = [
  'Internal strategic decision support only',
  'No autonomous medical diagnosis',
  'No prescription recommendations',
  'No claim of FDA approval',
  'Human review required',
  'Outputs must be traceable to source data',
  'Role-based access control recommended',
  'Compliance review needed before deployment',
];

export function SystemGuardrails() {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="guardrails">
      <button className="guardrails-toggle" onClick={() => setCollapsed(!collapsed)}>
        <span className="guardrails-title">System Guardrails</span>
        <span className="guardrails-chevron">{collapsed ? '+' : '-'}</span>
      </button>
      {!collapsed && (
        <ul className="guardrails-list">
          {guardrails.map((g, i) => (
            <li key={i}>{g}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
