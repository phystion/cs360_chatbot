import { useEffect, useMemo, useState } from 'react';
import {
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Check,
  CircleDot,
  Activity,
} from 'lucide-react';
import { Role, AuditRecord } from '../types';
import { pipelineAssets } from '../data/pipelineData';
import { competitors } from '../data/competitorData';

const KEEP_IN_MIND: { label: string; detail: string }[] = [
  { label: 'Decision support only', detail: 'Outputs assist humans — never act autonomously.' },
  { label: 'No medical diagnosis', detail: 'System will refuse to diagnose patients or conditions.' },
  { label: 'No prescription guidance', detail: 'Will not recommend dosing or specific therapies.' },
  { label: 'No FDA approval claims', detail: 'No statements implying regulatory clearance.' },
  { label: 'Human review required', detail: 'A qualified reviewer must sign off before action.' },
  { label: 'Source-traceable outputs', detail: 'Every answer is bound to its data inputs.' },
  { label: 'Role-based access', detail: 'Department scope limits who can view what data.' },
  { label: 'Compliance review pre-deploy', detail: 'Compliance committee approves before scaling.' },
];

interface Props {
  role: Role;
  open: boolean;
  auditRecords: AuditRecord[];
}

export function DepartmentPanel({ role, open, auditRecords }: Props) {
  if (!open) return null;

  return (
    <aside className="department-panel">
      <div className="department-panel-topbar">
        <div className="department-panel-topbar-icon">
          <Lightbulb size={16} />
        </div>
        <div className="department-panel-topbar-titles">
          <span className="department-panel-topbar-title">Keep in mind</span>
          <span className="department-panel-topbar-subtitle">
            A few things to remember while using Pharmora Co-Assist
          </span>
        </div>
      </div>

      <div className="department-panel-body">
        <KeepInMindList />

        {role === 'C-Suite' && <CSuiteTools />}
        {role === 'R&D' && <RDTools />}
        {role === 'Finance' && <FinanceTools />}
        {role === 'Marketing' && <MarketingTools />}
        {role === 'Regulatory/Compliance' && <ComplianceTools auditRecords={auditRecords} />}
        {role === 'IT' && <ITTools auditRecords={auditRecords} />}
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Keep in mind                                                        */
/* ------------------------------------------------------------------ */

function KeepInMindList() {
  return (
    <section className="dp-card keep-in-mind-card">
      <ul className="guardrail-list">
        {KEEP_IN_MIND.map((g) => (
          <li key={g.label} className="guardrail-row">
            <span className="guardrail-check" aria-hidden>
              <Check size={11} />
            </span>
            <div>
              <div className="guardrail-label">{g.label}</div>
              <div className="guardrail-detail">{g.detail}</div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* C-Suite                                                             */
/* ------------------------------------------------------------------ */

function CSuiteTools() {
  const ranked = useMemo(() => {
    return [...pipelineAssets]
      .map((a) => ({
        ...a,
        rav: a.probabilityOfApproval ? (a.probabilityOfApproval / 100) * a.marketOpportunity : 0,
      }))
      .sort((a, b) => b.rav - a.rav);
  }, []);

  const totalByArea = useMemo(() => {
    const totals: Record<string, number> = {};
    ranked.forEach((a) => {
      totals[a.therapeuticArea] = (totals[a.therapeuticArea] || 0) + a.rav;
    });
    return totals;
  }, [ranked]);
  const totalAll = Object.values(totalByArea).reduce((s, v) => s + v, 0);
  const top = ranked[0];

  return (
    <>
      <ToolCard title="Portfolio heatmap" subtitle="Risk-adjusted opportunity, ranked">
        <div className="heatmap-list">
          {ranked.map((a) => {
            const pct = top.rav > 0 ? (a.rav / top.rav) * 100 : 0;
            return (
              <div key={a.id} className="heatmap-row">
                <div className="heatmap-row-top">
                  <span className="heatmap-name">{a.name}</span>
                  <span className="heatmap-value">${a.rav.toFixed(1)}B</span>
                </div>
                <div className="heatmap-row-meta">
                  <span>{a.therapeuticArea}</span>
                  <span>·</span>
                  <span>{a.stage}</span>
                  <span>·</span>
                  <span>{a.probabilityOfApproval ? `${a.probabilityOfApproval}% PoA` : 'No PoA data'}</span>
                </div>
                <div className="heatmap-bar-track">
                  <div className="heatmap-bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </ToolCard>

      <ToolCard title="Diversification meter" subtitle="Therapeutic area mix of risk-adjusted value">
        <div className="diversification-bar">
          {Object.entries(totalByArea).map(([area, val], i) => {
            const pct = totalAll > 0 ? (val / totalAll) * 100 : 0;
            return (
              <div
                key={area}
                className={`diversification-slice diversification-slice-${i % 3}`}
                style={{ width: `${pct}%` }}
                title={`${area}: ${pct.toFixed(0)}%`}
              />
            );
          })}
        </div>
        <div className="diversification-legend">
          {Object.entries(totalByArea).map(([area, val], i) => {
            const pct = totalAll > 0 ? (val / totalAll) * 100 : 0;
            return (
              <div key={area} className="diversification-legend-row">
                <span className={`diversification-dot diversification-slice-${i % 3}`} />
                <span className="diversification-area">{area}</span>
                <span className="diversification-pct">{pct.toFixed(0)}%</span>
                <span className="diversification-val">${val.toFixed(1)}B</span>
              </div>
            );
          })}
        </div>
        <div className="diversification-flag">
          {Math.max(...Object.values(totalByArea)) / totalAll > 0.7
            ? 'High concentration risk — diversification recommended.'
            : 'Concentration within acceptable range.'}
        </div>
      </ToolCard>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* R&D                                                                 */
/* ------------------------------------------------------------------ */

function RDTools() {
  const phases = ['All', 'Phase 1', 'Phase 2', 'Phase 3'] as const;
  const [phase, setPhase] = useState<(typeof phases)[number]>('All');
  const filtered = phase === 'All' ? pipelineAssets : pipelineAssets.filter((a) => a.stage === phase);

  const [selectedId, setSelectedId] = useState<number>(pipelineAssets[0].id);
  const selected = pipelineAssets.find((a) => a.id === selectedId)!;

  const ENDPOINTS = [
    'HbA1c reduction from baseline',
    'Body weight loss percentage',
    'LDL cholesterol reduction',
    'Major adverse cardiovascular events',
    'Long-term durability (24+ mo)',
    'Quality of life (PRO)',
  ];
  const [checked, setChecked] = useChecklist('pharmora-rd-endpoints', ENDPOINTS, [0, 3]);

  return (
    <>
      <ToolCard title="Pipeline by phase" subtitle="Filter active development assets">
        <div className="dp-segmented">
          {phases.map((p) => (
            <button
              key={p}
              className={`dp-segment ${phase === p ? 'is-active' : ''}`}
              onClick={() => setPhase(p)}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="phase-list">
          {filtered.length === 0 && <div className="dp-empty">No assets in {phase}.</div>}
          {filtered.map((a) => (
            <div key={a.id} className="phase-row">
              <div className="phase-row-top">
                <span className="phase-name">{a.name}</span>
                <span className="phase-tag">{a.stage}</span>
              </div>
              <div className="phase-meta">
                {a.therapeuticArea} · {a.marketOpportunityLabel} ·{' '}
                {a.probabilityOfApproval ? `${a.probabilityOfApproval}% PoA` : '— PoA'}
              </div>
            </div>
          ))}
        </div>
      </ToolCard>

      <ToolCard title="Asset inspector" subtitle="Pick an asset to review">
        <select
          className="dp-select"
          value={selectedId}
          onChange={(e) => setSelectedId(Number(e.target.value))}
        >
          {pipelineAssets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} — {a.stage}
            </option>
          ))}
        </select>
        <div className="inspector-body">
          <div className="inspector-row">
            <span>Area</span>
            <span>{selected.therapeuticArea}</span>
          </div>
          <div className="inspector-row">
            <span>Launch</span>
            <span>{selected.launchYear}</span>
          </div>
          <div className="inspector-row">
            <span>Market</span>
            <span>{selected.marketOpportunityLabel}</span>
          </div>
          <div className="inspector-row">
            <span>PoA</span>
            <span>{selected.probabilityOfApproval ? `${selected.probabilityOfApproval}%` : '—'}</span>
          </div>
          <p className="inspector-desc">{selected.description}</p>
        </div>
      </ToolCard>

      <ToolCard title="Trial endpoint checklist" subtitle="Toggle target endpoints (saved locally)">
        <ul className="check-list">
          {ENDPOINTS.map((label, i) => (
            <li key={label}>
              <button
                className={`check-row ${checked.includes(i) ? 'is-on' : ''}`}
                onClick={() =>
                  setChecked(
                    checked.includes(i) ? checked.filter((x) => x !== i) : [...checked, i]
                  )
                }
              >
                <span className="check-box">{checked.includes(i) && <Check size={11} />}</span>
                <span>{label}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="dp-footnote">
          {checked.length} of {ENDPOINTS.length} selected
        </div>
      </ToolCard>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Finance                                                             */
/* ------------------------------------------------------------------ */

function FinanceTools() {
  const [assetId, setAssetId] = useState<number>(pipelineAssets[0].id);
  const [investment, setInvestment] = useState<number>(500);
  const [pressure, setPressure] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const asset = pipelineAssets.find((a) => a.id === assetId)!;

  const pressureMultiplier = pressure === 'Low' ? 1 : pressure === 'Medium' ? 0.85 : 0.65;
  const poa = asset.probabilityOfApproval ? asset.probabilityOfApproval / 100 : 0.5;
  const marketB = asset.marketOpportunity;
  const expectedReturnB = marketB * poa * pressureMultiplier;
  const investmentB = investment / 1000;
  const roiMultiple = investmentB > 0 ? expectedReturnB / investmentB : 0;

  return (
    <>
      <ToolCard title="Risk-adjusted ROI calculator" subtitle="Estimate return under a pricing scenario">
        <label className="dp-label">Asset</label>
        <select
          className="dp-select"
          value={assetId}
          onChange={(e) => setAssetId(Number(e.target.value))}
        >
          {pipelineAssets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.stage})
            </option>
          ))}
        </select>

        <label className="dp-label">Investment ($M): {investment}</label>
        <input
          type="range"
          min={50}
          max={2000}
          step={25}
          value={investment}
          onChange={(e) => setInvestment(Number(e.target.value))}
          className="dp-range"
        />

        <label className="dp-label">Payer pressure</label>
        <div className="dp-segmented">
          {(['Low', 'Medium', 'High'] as const).map((p) => (
            <button
              key={p}
              className={`dp-segment ${pressure === p ? 'is-active' : ''}`}
              onClick={() => setPressure(p)}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="roi-output">
          <div className="roi-stat">
            <span>Expected return</span>
            <strong>${expectedReturnB.toFixed(2)}B</strong>
          </div>
          <div className="roi-stat">
            <span>ROI multiple</span>
            <strong>{roiMultiple.toFixed(1)}×</strong>
          </div>
          <div className="roi-stat">
            <span>PoA × pressure</span>
            <strong>
              {(poa * 100).toFixed(0)}% × {(pressureMultiplier * 100).toFixed(0)}%
            </strong>
          </div>
        </div>
      </ToolCard>

      <ToolCard title="Risk-adjusted snapshot" subtitle="All assets at current pressure">
        <table className="dp-table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Market</th>
              <th>Adj. value</th>
            </tr>
          </thead>
          <tbody>
            {pipelineAssets.map((a) => {
              const p = a.probabilityOfApproval ? a.probabilityOfApproval / 100 : 0.5;
              const adj = a.marketOpportunity * p * pressureMultiplier;
              return (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td>{a.marketOpportunityLabel}</td>
                  <td>${adj.toFixed(1)}B</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ToolCard>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Marketing                                                           */
/* ------------------------------------------------------------------ */

function MarketingTools() {
  const [openName, setOpenName] = useState<string | null>(competitors[0].name);

  const DIFFERENTIATORS = [
    'AI-driven trial design',
    'Outcomes-based contracting',
    'Best-in-class CV efficacy',
    'Oral formulation convenience',
    'Real-world evidence program',
    'Specialty + primary care reach',
  ];
  const [selected, setSelected] = useChecklist('pharmora-mkt-diffs', DIFFERENTIATORS, [0, 2]);

  const strength =
    selected.length >= 4 ? 'Strong' : selected.length >= 2 ? 'Developing' : 'Underdeveloped';

  return (
    <>
      <ToolCard title="Competitor threat browser" subtitle="Tap to see overlap and initiatives">
        <div className="competitor-feed">
          {competitors.map((c) => {
            const isOpen = openName === c.name;
            return (
              <div key={c.name} className={`competitor-feed-row ${isOpen ? 'is-open' : ''}`}>
                <button
                  className="competitor-feed-head"
                  onClick={() => setOpenName(isOpen ? null : c.name)}
                >
                  <span className="competitor-feed-name">{c.name}</span>
                  <span className="competitor-feed-tag">{c.threatType}</span>
                  {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                {isOpen && (
                  <div className="competitor-feed-body">
                    <div className="competitor-feed-row-line">
                      <span>Focus</span>
                      <span>{c.focus}</span>
                    </div>
                    <div className="competitor-feed-row-line">
                      <span>Overlap</span>
                      <span>{c.overlapWithPharmora}</span>
                    </div>
                    {c.initiatives.length > 0 && (
                      <ul className="competitor-feed-list">
                        {c.initiatives.map((init) => (
                          <li key={init}>{init}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ToolCard>

      <ToolCard title="Positioning differentiators" subtitle="Pick the levers Pharmora can lead on">
        <ul className="check-list">
          {DIFFERENTIATORS.map((label, i) => (
            <li key={label}>
              <button
                className={`check-row ${selected.includes(i) ? 'is-on' : ''}`}
                onClick={() =>
                  setSelected(
                    selected.includes(i) ? selected.filter((x) => x !== i) : [...selected, i]
                  )
                }
              >
                <span className="check-box">{selected.includes(i) && <Check size={11} />}</span>
                <span>{label}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className={`positioning-strength positioning-${strength.toLowerCase()}`}>
          Positioning strength: <strong>{strength}</strong>
        </div>
      </ToolCard>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Regulatory / Compliance                                             */
/* ------------------------------------------------------------------ */

function ComplianceTools({ auditRecords }: { auditRecords: AuditRecord[] }) {
  const CHECKLIST = [
    'Use case documented',
    'Human reviewer assigned',
    'RBAC verified for all roles',
    'Audit log retention configured',
    'AI model card on file',
    'Data lineage validated',
    'Bias / drift monitor scheduled',
  ];
  const [done, setDone] = useChecklist('pharmora-compliance-checklist', CHECKLIST, [0, 1, 2]);

  return (
    <>
      <ToolCard title="Live audit log" subtitle={`${auditRecords.length} records this session`}>
        {auditRecords.length === 0 ? (
          <div className="dp-empty">
            No audit records yet. Ask the assistant a question to generate one.
          </div>
        ) : (
          <div className="audit-feed">
            {auditRecords.slice(0, 10).map((r) => (
              <div key={r.id} className="audit-feed-row">
                <div className="audit-feed-top">
                  <span className="audit-feed-id">{r.id}</span>
                  <span className={`risk-badge risk-${r.riskLevel.toLowerCase()}`}>{r.riskLevel}</span>
                </div>
                <div className="audit-feed-question">{r.question}</div>
                <div className="audit-feed-meta">
                  <span>{r.toolUsed}</span>
                  <span>·</span>
                  <span>{r.role}</span>
                  <span>·</span>
                  <span>{new Date(r.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </ToolCard>

      <ToolCard title="Compliance checklist" subtitle="Track readiness for scaled deployment">
        <ul className="check-list">
          {CHECKLIST.map((label, i) => (
            <li key={label}>
              <button
                className={`check-row ${done.includes(i) ? 'is-on' : ''}`}
                onClick={() =>
                  setDone(done.includes(i) ? done.filter((x) => x !== i) : [...done, i])
                }
              >
                <span className="check-box">{done.includes(i) && <Check size={11} />}</span>
                <span>{label}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="dp-progressbar">
          <div
            className="dp-progressbar-fill"
            style={{ width: `${(done.length / CHECKLIST.length) * 100}%` }}
          />
        </div>
        <div className="dp-footnote">
          {done.length} of {CHECKLIST.length} cleared
        </div>
      </ToolCard>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* IT                                                                  */
/* ------------------------------------------------------------------ */

function ITTools({ auditRecords }: { auditRecords: AuditRecord[] }) {
  const [latency, setLatency] = useState(142);
  useEffect(() => {
    const id = setInterval(() => {
      setLatency(110 + Math.floor(Math.random() * 90));
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const sources = [
    { name: 'Pipeline DB (mock)', status: 'ok' as const, detail: `${pipelineAssets.length} assets` },
    { name: 'Competitor feed (mock)', status: 'ok' as const, detail: `${competitors.length} entries` },
    { name: 'Audit log store', status: 'ok' as const, detail: `${auditRecords.length} records` },
    { name: 'LLM endpoint', status: 'ok' as const, detail: `${latency}ms p50` },
  ];

  const matrix: { feature: string; perms: Record<string, 'R' | 'RW' | '—'> }[] = [
    { feature: 'Pipeline data', perms: { 'C-Suite': 'R', 'R&D': 'RW', Finance: 'R', Marketing: 'R', 'Reg/Comp': 'R', IT: 'RW' } },
    { feature: 'Competitor data', perms: { 'C-Suite': 'R', 'R&D': 'R', Finance: 'R', Marketing: 'RW', 'Reg/Comp': 'R', IT: 'RW' } },
    { feature: 'Audit log', perms: { 'C-Suite': 'R', 'R&D': '—', Finance: '—', Marketing: '—', 'Reg/Comp': 'RW', IT: 'RW' } },
    { feature: 'Conversations', perms: { 'C-Suite': 'RW', 'R&D': 'RW', Finance: 'RW', Marketing: 'RW', 'Reg/Comp': 'RW', IT: 'RW' } },
  ];

  return (
    <>
      <ToolCard title="Data source status" subtitle="Live connection mock">
        <ul className="source-status">
          {sources.map((s) => (
            <li key={s.name} className="source-status-row">
              <span className={`source-status-dot is-${s.status}`}>
                <CircleDot size={8} />
              </span>
              <span className="source-status-name">{s.name}</span>
              <span className="source-status-detail">{s.detail}</span>
            </li>
          ))}
        </ul>
      </ToolCard>

      <ToolCard title="System health" subtitle="Running mock telemetry">
        <div className="health-grid">
          <div className="health-stat">
            <span>API latency</span>
            <strong>{latency} ms</strong>
          </div>
          <div className="health-stat">
            <span>Audit records</span>
            <strong>{auditRecords.length}</strong>
          </div>
          <div className="health-stat">
            <span>Active sources</span>
            <strong>{sources.length}</strong>
          </div>
          <div className="health-stat">
            <span>Status</span>
            <strong className="health-ok">
              <Activity size={11} /> Healthy
            </strong>
          </div>
        </div>
      </ToolCard>

      <ToolCard title="Access control matrix" subtitle="Read (R) · Read+Write (RW)">
        <table className="dp-table dp-table-compact">
          <thead>
            <tr>
              <th>Feature</th>
              {Object.keys(matrix[0].perms).map((r) => (
                <th key={r}>{r}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((m) => (
              <tr key={m.feature}>
                <td>{m.feature}</td>
                {Object.entries(m.perms).map(([r, p]) => (
                  <td key={r} className={`perm perm-${p === '—' ? 'none' : p.toLowerCase()}`}>
                    {p}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </ToolCard>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Shared                                                              */
/* ------------------------------------------------------------------ */

function ToolCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="dp-card">
      <div className="dp-card-header">
        <div className="dp-card-titles">
          <span className="dp-card-title">{title}</span>
          {subtitle && <span className="dp-card-subtitle">{subtitle}</span>}
        </div>
      </div>
      <div className="dp-card-body">{children}</div>
    </section>
  );
}

function useChecklist(
  storageKey: string,
  items: string[],
  initial: number[],
): [number[], (next: number[]) => void] {
  const [state, setState] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return initial;
      const parsed = JSON.parse(raw) as number[];
      return parsed.filter((i) => i >= 0 && i < items.length);
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, storageKey]);
  return [state, setState];
}
