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
  return (
    <div className="guardrails">
      <h4 className="guardrails-title">System Guardrails</h4>
      <ul className="guardrails-list">
        {guardrails.map((g, i) => (
          <li key={i}>{g}</li>
        ))}
      </ul>
    </div>
  );
}
