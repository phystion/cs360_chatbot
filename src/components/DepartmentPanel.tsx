import { createContext, useContext, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Check,
  CircleDot,
  Activity,
  Eye,
  GripVertical,
  PlusCircle,
  RotateCcw,
  Upload,
  X,
} from 'lucide-react';
import { Role, AuditRecord } from '../types';
import { pipelineAssets } from '../data/pipelineData';
import { competitors } from '../data/competitorData';
import {
  departmentUseCases,
  financialSnapshot,
  governanceRequirements,
  implementationSources,
  operatingExpenseMix,
  pharmoraProfile,
  strategicObjectives,
} from '../data/companyData';

const KEEP_IN_MIND: string[] = [
  'No medical diagnosis',
  'No prescription guidance',
  'No FDA approval claims',
  'Human review required',
];

const CUSTOM_CARDS_KEY = 'pharmora-panel-custom-cards-v2';
const ORDER_KEY_PREFIX = 'pharmora-panel-card-order-v1';
const HIDDEN_KEY_PREFIX = 'pharmora-panel-hidden-cards-v1';
const PINNED_KEY_PREFIX = 'pharmora-panel-pinned-library-cards-v1';
const CHECKLIST_DEFAULTS_VERSION = 'pharmora-checklist-defaults-v2';

interface CardAttachment {
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
  text?: string;
}

interface CustomCardData {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  attachment?: CardAttachment;
  updatedAt: number;
}

interface PanelCardContextValue {
  order: string[];
  hidden: string[];
  role: Role;
  availableCards: {
    id: string;
    title: string;
    subtitle?: string;
    department: Role | 'All';
    hidden: boolean;
    custom: boolean;
    activeInCurrentRole: boolean;
    added: boolean;
  }[];
  hiddenCards: { id: string; title: string }[];
  registerCard: (id: string, title: string) => void;
  getOrderIndex: (id: string) => number | undefined;
  moveCard: (fromId: string, toId: string) => void;
  hideCard: (id: string) => void;
  restoreCard: (id: string) => void;
  pinLibraryCard: (sourceId: string) => void;
  unpinLibraryCard: (sourceId: string) => void;
  resetLayout: () => void;
  deleteCustomCard: (id: string) => void;
  isHidden: (id: string) => boolean;
  isCustom: (id: string) => boolean;
  draggingId: string | null;
  setDraggingId: (id: string | null) => void;
}

const PanelCardContext = createContext<PanelCardContextValue | null>(null);

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const BUILT_IN_CARD_LIBRARY: Array<{ role: Role; title: string; subtitle?: string }> = [
  { role: 'C-Suite', title: 'Executive case brief', subtitle: 'SRD goals and case packet financial context' },
  { role: 'C-Suite', title: 'Portfolio heatmap', subtitle: 'Risk-adjusted opportunity, ranked' },
  { role: 'C-Suite', title: 'Diversification meter', subtitle: 'Therapeutic area mix of risk-adjusted value' },
  { role: 'R&D', title: 'R&D decision fit', subtitle: 'Scenario comparison needs from the SRD' },
  { role: 'R&D', title: 'Pipeline by phase', subtitle: 'Filter active development assets' },
  { role: 'R&D', title: 'Asset inspector', subtitle: 'Pick an asset to review' },
  { role: 'R&D', title: 'Trial endpoint checklist', subtitle: 'Toggle target endpoints (saved locally)' },
  { role: 'Finance', title: 'Operating expense mix', subtitle: '2024 case packet allocation' },
  { role: 'Finance', title: 'Risk-adjusted ROI calculator', subtitle: 'Estimate return under a pricing scenario' },
  { role: 'Finance', title: 'Risk-adjusted snapshot', subtitle: 'All assets at current pressure' },
  { role: 'Marketing', title: 'Marketing focus', subtitle: 'Competition, trust, access' },
  { role: 'Marketing', title: 'Competitor threat browser', subtitle: 'Tap to see overlap and initiatives' },
  { role: 'Marketing', title: 'Positioning differentiators', subtitle: 'Pick the levers Pharmora can lead on' },
  { role: 'Regulatory/Compliance', title: 'Governance requirements', subtitle: 'Must-have controls from the SRD' },
  { role: 'Regulatory/Compliance', title: 'Live audit log', subtitle: 'Session audit records' },
  { role: 'Regulatory/Compliance', title: 'Compliance checklist', subtitle: 'Track readiness for scaled deployment' },
  { role: 'IT', title: 'Implementation readiness', subtitle: 'Sources to clean and ingest before go-live' },
  { role: 'IT', title: 'Data source status', subtitle: 'Live connection mock' },
  { role: 'IT', title: 'System health', subtitle: 'Running mock telemetry' },
  { role: 'IT', title: 'Access control matrix', subtitle: 'Read (R) / Read+Write (RW)' },
];

const RD_ENDPOINTS = [
  'HbA1c reduction from baseline',
  'Body weight loss percentage',
  'LDL cholesterol reduction',
  'Major adverse cardiovascular events',
  'Long-term durability (24+ mo)',
  'Quality of life (PRO)',
];

const MARKETING_DIFFERENTIATORS = [
  'AI-driven trial design',
  'Outcomes-based contracting',
  'Best-in-class CV efficacy',
  'Oral formulation convenience',
  'Real-world evidence program',
  'Specialty + primary care reach',
];

const COMPLIANCE_READINESS = [
  'Use case documented',
  'Human reviewer assigned',
  'RBAC verified for all roles',
  'Audit log retention configured',
  'AI model card on file',
  'Data lineage validated',
  'Bias / drift monitor scheduled',
];

interface Props {
  role: Role;
  open: boolean;
  auditRecords: AuditRecord[];
  onShowTestPanel: () => void;
}

export function DepartmentPanel({ role, open, auditRecords, onShowTestPanel }: Props) {
  const [panelWidth, setPanelWidth] = useState(() => {
    const saved = Number(localStorage.getItem('pharmora-panel-width'));
    return Number.isFinite(saved) ? clampNumber(saved, 280, 620) : 320;
  });
  const [customCards, setCustomCards] = useState<CustomCardData[]>(() =>
    readJson<CustomCardData[]>(CUSTOM_CARDS_KEY, [])
  );
  const [pinnedCardIds, setPinnedCardIds] = useState<string[]>(() =>
    readJson<string[]>(`${PINNED_KEY_PREFIX}-${role}`, [])
  );

  useEffect(() => {
    document.documentElement.style.setProperty('--department-panel-width', `${panelWidth}px`);
    localStorage.setItem('pharmora-panel-width', String(panelWidth));
  }, [panelWidth]);

  useEffect(() => {
    setPinnedCardIds(readJson<string[]>(`${PINNED_KEY_PREFIX}-${role}`, []));
  }, [role]);

  if (!open) return null;

  const handleResizeStart = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = panelWidth;

    const handleMove = (moveEvent: PointerEvent) => {
      const delta = startX - moveEvent.clientX;
      setPanelWidth(clampNumber(startWidth + delta, 280, 620));
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      document.body.classList.remove('is-resizing-panel');
    };

    document.body.classList.add('is-resizing-panel');
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const addCustomCard = (card: Omit<CustomCardData, 'id' | 'updatedAt'>) => {
    setCustomCards((prev) => {
      const next = [
        ...prev,
        {
          ...card,
          id: `custom-${crypto.randomUUID()}`,
          updatedAt: Date.now(),
        },
      ];
      localStorage.setItem(CUSTOM_CARDS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const deleteCustomCard = (id: string) => {
    setCustomCards((prev) => {
      const next = prev.filter((card) => card.id !== id);
      localStorage.setItem(CUSTOM_CARDS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const pinLibraryCard = (sourceId: string) => {
    setPinnedCardIds((prev) => {
      if (prev.includes(sourceId)) return prev;
      const next = [...prev, sourceId];
      localStorage.setItem(`${PINNED_KEY_PREFIX}-${role}`, JSON.stringify(next));
      return next;
    });
  };

  const unpinLibraryCard = (sourceId: string) => {
    setPinnedCardIds((prev) => {
      const next = prev.filter((id) => id !== sourceId);
      localStorage.setItem(`${PINNED_KEY_PREFIX}-${role}`, JSON.stringify(next));
      return next;
    });
  };

  return (
    <aside className="department-panel">
      <button
        type="button"
        className="department-panel-resize-handle"
        onPointerDown={handleResizeStart}
        aria-label="Resize right panel"
        title="Drag to resize panel"
      />
      <div className="department-panel-important-section">
        <div className="department-panel-topbar">
          <div className="department-panel-topbar-icon">
            <AlertTriangle size={14} />
          </div>
          <div className="department-panel-topbar-titles">
            <span className="department-panel-topbar-title">IMPORTANT</span>
          </div>
          <button
            type="button"
            className="department-panel-view-as-toggle"
            onClick={onShowTestPanel}
            aria-label="Open View as panel"
            title="Open View as panel"
          >
            <Eye size={14} />
          </button>
        </div>
        <KeepInMindList />
      </div>

      <div className="department-panel-body">
        <PanelCardProvider
          role={role}
          customCards={customCards}
          pinnedCardIds={pinnedCardIds}
          onPinLibraryCard={pinLibraryCard}
          onUnpinLibraryCard={unpinLibraryCard}
          onResetLayout={() => {
            setPinnedCardIds([]);
            localStorage.removeItem(`${PINNED_KEY_PREFIX}-${role}`);
          }}
          onDeleteCustomCard={deleteCustomCard}
        >
          {role === 'C-Suite' && <CSuiteTools />}
          {role === 'R&D' && <RDTools />}
          {role === 'Finance' && <FinanceTools />}
          {role === 'Marketing' && <MarketingTools />}
          {role === 'Regulatory/Compliance' && <ComplianceTools auditRecords={auditRecords} />}
          {role === 'IT' && <ITTools auditRecords={auditRecords} />}
          {customCards.map((card) => (
            <CustomInfoCard key={card.id} card={card} />
          ))}
          {pinnedCardIds.map((sourceId) => (
            <PinnedBuiltInCard
              key={sourceId}
              sourceId={sourceId}
              onRemove={() => unpinLibraryCard(sourceId)}
              auditRecords={auditRecords}
            />
          ))}
          <PanelCardManager onAddCustomCard={addCustomCard} />
        </PanelCardProvider>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Keep in mind                                                        */
/* ------------------------------------------------------------------ */

function PanelCardProvider({
  role,
  customCards,
  pinnedCardIds,
  onPinLibraryCard,
  onUnpinLibraryCard,
  onResetLayout,
  onDeleteCustomCard,
  children,
}: {
  role: Role;
  customCards: CustomCardData[];
  pinnedCardIds: string[];
  onPinLibraryCard: (sourceId: string) => void;
  onUnpinLibraryCard: (sourceId: string) => void;
  onResetLayout: () => void;
  onDeleteCustomCard: (id: string) => void;
  children: React.ReactNode;
}) {
  const orderKey = `${ORDER_KEY_PREFIX}-${role}`;
  const hiddenKey = `${HIDDEN_KEY_PREFIX}-${role}`;
  const [registeredCards, setRegisteredCards] = useState<Record<string, string>>({});
  const [order, setOrder] = useState<string[]>(() => readJson<string[]>(orderKey, []));
  const [hidden, setHidden] = useState<string[]>(() => readJson<string[]>(hiddenKey, []));
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const customIds = useMemo(() => new Set(customCards.map((card) => card.id)), [customCards]);

  useEffect(() => {
    setOrder(readJson<string[]>(orderKey, []));
    setHidden(readJson<string[]>(hiddenKey, []));
    setRegisteredCards({});
  }, [orderKey, hiddenKey]);

  useEffect(() => {
    localStorage.setItem(orderKey, JSON.stringify(order));
  }, [order, orderKey]);

  useEffect(() => {
    localStorage.setItem(hiddenKey, JSON.stringify(hidden));
  }, [hidden, hiddenKey]);

  const visibleOrder = (ids: string[]) => {
    const registeredIds = Object.keys(registeredCards);
    const contentIds = registeredIds.filter((id) => !id.startsWith('panel-'));
    const managerIds = registeredIds.filter((id) => id.startsWith('panel-'));
    return [
      ...ids.filter((id) => contentIds.includes(id)),
      ...contentIds.filter((id) => !ids.includes(id)),
      ...managerIds,
    ];
  };

  const value: PanelCardContextValue = {
    order,
    hidden,
    role,
    availableCards: [
      ...BUILT_IN_CARD_LIBRARY.map((card) => {
        const id = `card-${slugify(card.title)}`;
        return {
          id,
          title: card.title,
          subtitle: card.subtitle,
          department: card.role,
          hidden: card.role === role && hidden.includes(id),
          custom: false,
          activeInCurrentRole: card.role === role,
          added: card.role === role || pinnedCardIds.includes(id),
        };
      }),
      ...customCards.map((card) => ({
        id: card.id,
        title: card.title,
        subtitle: card.subtitle,
        department: 'All' as const,
        hidden: hidden.includes(card.id),
        custom: true,
        activeInCurrentRole: true,
        added: true,
      })),
    ]
      .sort((a, b) => a.title.localeCompare(b.title)),
    hiddenCards: hidden.map((id) => ({ id, title: registeredCards[id] || id })),
    registerCard: (id, title) => {
      setRegisteredCards((prev) => (prev[id] === title ? prev : { ...prev, [id]: title }));
    },
    getOrderIndex: (id) => {
      const currentOrder = visibleOrder(order);
      const index = currentOrder.indexOf(id);
      return index === -1 ? undefined : index;
    },
    moveCard: (fromId, toId) => {
      if (fromId === toId) return;
      setOrder((prev) => {
        const next = visibleOrder(prev);
        const fromIndex = next.indexOf(fromId);
        const toIndex = next.indexOf(toId);
        if (fromIndex === -1 || toIndex === -1) return prev;
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      });
    },
    hideCard: (id) => {
      if (customIds.has(id)) {
        onDeleteCustomCard(id);
        return;
      }
      const builtIn = BUILT_IN_CARD_LIBRARY.find((card) => `card-${slugify(card.title)}` === id);
      if (builtIn && builtIn.role !== role) return;
      setHidden((prev) => (prev.includes(id) ? prev : [...prev, id]));
    },
    restoreCard: (id) => {
      setHidden((prev) => prev.filter((cardId) => cardId !== id));
    },
    pinLibraryCard: onPinLibraryCard,
    unpinLibraryCard: onUnpinLibraryCard,
    resetLayout: () => {
      setOrder([]);
      setHidden([]);
      localStorage.removeItem(orderKey);
      localStorage.removeItem(hiddenKey);
      onResetLayout();
    },
    deleteCustomCard: onDeleteCustomCard,
    isHidden: (id) => hidden.includes(id),
    isCustom: (id) => customIds.has(id),
    draggingId,
    setDraggingId,
  };

  return <PanelCardContext.Provider value={value}>{children}</PanelCardContext.Provider>;
}

function CustomInfoCard({ card }: { card: CustomCardData }) {
  return (
    <ToolCard
      id={card.id}
      title={card.title}
      subtitle={card.subtitle || 'Custom card'}
      removable
      initialMode="closed"
    >
      <div className="custom-card-body">
        {card.body.trim().length > 0 &&
          card.body.split('\n').map((line, index) => (
            <p key={`${card.id}-${index}`}>{line || ' '}</p>
          ))}
        {card.attachment && <AttachmentPreview attachment={card.attachment} />}
      </div>
    </ToolCard>
  );
}

function AttachmentPreview({ attachment }: { attachment: CardAttachment }) {
  const isImage = attachment.type.startsWith('image/') && attachment.dataUrl;
  const isPdf = attachment.type === 'application/pdf' && attachment.dataUrl;

  return (
    <div className="custom-card-attachment">
      <div className="custom-card-attachment-meta">
        <strong>{attachment.name}</strong>
        <span>{attachment.type || 'Unknown type'} / {(attachment.size / 1024).toFixed(1)} KB</span>
      </div>
      {isImage && <img src={attachment.dataUrl} alt={attachment.name} />}
      {isPdf && (
        <object data={attachment.dataUrl} type="application/pdf" title={attachment.name}>
          <a href={attachment.dataUrl}>Open PDF</a>
        </object>
      )}
      {attachment.text && <pre>{attachment.text}</pre>}
    </div>
  );
}

function PinnedBuiltInCard({
  sourceId,
  onRemove,
  auditRecords,
}: {
  sourceId: string;
  onRemove: () => void;
  auditRecords: AuditRecord[];
}) {
  const card = BUILT_IN_CARD_LIBRARY.find((item) => `card-${slugify(item.title)}` === sourceId);
  if (!card) return null;

  return (
    <ToolCard
      id={`pinned-${sourceId}`}
      title={card.title}
      subtitle={`${card.role} / ${card.subtitle || 'Pinned card'}`}
      initialMode="closed"
      onRemove={onRemove}
    >
      <BuiltInCardPreview title={card.title} auditRecords={auditRecords} />
    </ToolCard>
  );
}

function BuiltInCardPreview({ title, auditRecords }: { title: string; auditRecords: AuditRecord[] }) {
  switch (title) {
    case 'Executive case brief':
      return <ExecutiveCaseBriefBody />;
    case 'Portfolio heatmap':
      return <PortfolioHeatmapBody />;
    case 'Diversification meter':
      return <DiversificationMeterBody />;
    case 'R&D decision fit':
      return <RDDecisionFitBody />;
    case 'Pipeline by phase':
      return <PipelineByPhaseBody />;
    case 'Asset inspector':
      return <AssetInspectorBody />;
    case 'Trial endpoint checklist':
      return (
        <ChecklistEditor
          storageKey="pharmora-rd-endpoints"
          customItemsKey="pharmora-rd-endpoints-custom"
          baseItems={RD_ENDPOINTS}
          countLabel="selected"
          showProgress
        />
      );
    case 'Operating expense mix':
      return <OperatingExpenseMixBody />;
    case 'Risk-adjusted ROI calculator':
      return <RiskAdjustedROICalculatorBody />;
    case 'Risk-adjusted snapshot':
      return <RiskAdjustedSnapshotBody />;
    case 'Marketing focus':
      return <MarketingFocusBody />;
    case 'Competitor threat browser':
      return <CompetitorThreatBrowserBody />;
    case 'Positioning differentiators':
      return (
        <ChecklistEditor
          storageKey="pharmora-mkt-diffs"
          customItemsKey="pharmora-mkt-diffs-custom"
          baseItems={MARKETING_DIFFERENTIATORS}
          countLabel="selected"
        />
      );
    case 'Governance requirements':
      return <GovernanceRequirementsBody />;
    case 'Live audit log':
      return <LiveAuditLogBody auditRecords={auditRecords} />;
    case 'Compliance checklist':
      return (
        <ChecklistEditor
          storageKey="pharmora-compliance-checklist"
          customItemsKey="pharmora-compliance-checklist-custom"
          baseItems={COMPLIANCE_READINESS}
          countLabel="cleared"
          showProgress
        />
      );
    case 'Implementation readiness':
      return <ImplementationReadinessBody />;
    case 'Data source status':
      return <DataSourceStatusBody auditRecords={auditRecords} />;
    case 'System health':
      return <SystemHealthBody auditRecords={auditRecords} />;
    case 'Access control matrix':
      return <AccessControlMatrixBody />;
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* Reusable card body components (used by pinned cards)                */
/* ------------------------------------------------------------------ */

function ExecutiveCaseBriefBody() {
  return (
    <>
      <MetricGrid>
        <MetricCard label="Gross margin" value={financialSnapshot.grossMargin} />
        <MetricCard label="2024 growth" value={financialSnapshot.revenueGrowth2024} />
        <MetricCard label="CV revenue mix" value={financialSnapshot.cardiovascularRevenueMix} />
        <MetricCard label="Target CV mix" value={financialSnapshot.targetCardiovascularMix} />
      </MetricGrid>
      <ul className="dp-brief-list">
        {strategicObjectives.map((item) => (
          <li key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <em>{item.detail}</em>
          </li>
        ))}
      </ul>
    </>
  );
}

function PortfolioHeatmapBody() {
  const ranked = useMemo(
    () =>
      [...pipelineAssets]
        .map((a) => ({
          ...a,
          rav: a.probabilityOfApproval ? (a.probabilityOfApproval / 100) * a.marketOpportunity : 0,
        }))
        .sort((a, b) => b.rav - a.rav),
    [],
  );
  const top = ranked[0];
  return (
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
              <span>/</span>
              <span>{a.stage}</span>
              <span>/</span>
              <span>{a.probabilityOfApproval ? `${a.probabilityOfApproval}% PoA` : 'No PoA data'}</span>
            </div>
            <div className="heatmap-bar-track">
              <div className="heatmap-bar-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DiversificationMeterBody() {
  const ranked = useMemo(
    () =>
      [...pipelineAssets].map((a) => ({
        ...a,
        rav: a.probabilityOfApproval ? (a.probabilityOfApproval / 100) * a.marketOpportunity : 0,
      })),
    [],
  );
  const totalByArea = useMemo(() => {
    const totals: Record<string, number> = {};
    ranked.forEach((a) => {
      totals[a.therapeuticArea] = (totals[a.therapeuticArea] || 0) + a.rav;
    });
    return totals;
  }, [ranked]);
  const totalAll = Object.values(totalByArea).reduce((s, v) => s + v, 0);
  return (
    <>
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
        {totalAll > 0 && Math.max(...Object.values(totalByArea)) / totalAll > 0.7
          ? 'High concentration risk - diversification recommended.'
          : 'Concentration within acceptable range.'}
      </div>
    </>
  );
}

function RDDecisionFitBody() {
  return (
    <>
      <ul className="dp-brief-list">
        {departmentUseCases['R&D'].map((item) => (
          <li key={item}>
            <span>Use case</span>
            <strong>{item}</strong>
          </li>
        ))}
      </ul>
      <div className="dp-callout">
        Prioritize near-term cardiovascular launches while testing endocrinology expansion for
        obesity and diabetes diversification.
      </div>
    </>
  );
}

function PipelineByPhaseBody() {
  const phases = ['All', 'Phase 1', 'Phase 2', 'Phase 3'] as const;
  const [phase, setPhase] = useState<(typeof phases)[number]>('All');
  const filtered = phase === 'All' ? pipelineAssets : pipelineAssets.filter((a) => a.stage === phase);
  return (
    <>
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
              {a.therapeuticArea} / {a.marketOpportunityLabel} /{' '}
              {a.probabilityOfApproval ? `${a.probabilityOfApproval}% PoA` : '- PoA'}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function AssetInspectorBody() {
  const [selectedId, setSelectedId] = useState<number>(pipelineAssets[0].id);
  const selected = pipelineAssets.find((a) => a.id === selectedId)!;
  return (
    <>
      <select
        className="dp-select"
        value={selectedId}
        onChange={(e) => setSelectedId(Number(e.target.value))}
      >
        {pipelineAssets.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} - {a.stage}
          </option>
        ))}
      </select>
      <div className="inspector-body">
        <div className="inspector-row"><span>Area</span><span>{selected.therapeuticArea}</span></div>
        <div className="inspector-row"><span>Launch</span><span>{selected.launchYear}</span></div>
        <div className="inspector-row"><span>Market</span><span>{selected.marketOpportunityLabel}</span></div>
        <div className="inspector-row">
          <span>PoA</span>
          <span>{selected.probabilityOfApproval ? `${selected.probabilityOfApproval}%` : '-'}</span>
        </div>
        <p className="inspector-desc">{selected.description}</p>
      </div>
    </>
  );
}

function OperatingExpenseMixBody() {
  return (
    <>
      <div className="expense-list">
        {operatingExpenseMix.map((item) => (
          <div key={item.segment} className="expense-row">
            <div className="expense-row-top">
              <span>{item.segment}</span>
              <strong>{item.share}%</strong>
            </div>
            <div className="expense-track">
              <div className="expense-fill" style={{ width: `${item.share}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="dp-callout">
        SG&A plus Marketing & Sales total 65%, while R&D is 25%. Finance should test
        whether reallocation can fund diversification without breaking margin discipline.
      </div>
    </>
  );
}

function RiskAdjustedROICalculatorBody() {
  const [assetId, setAssetId] = useState<number>(pipelineAssets[0].id);
  const [investment, setInvestment] = useState<number>(500);
  const [pressure, setPressure] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const asset = pipelineAssets.find((a) => a.id === assetId)!;
  const pressureMultiplier = pressure === 'Low' ? 1 : pressure === 'Medium' ? 0.85 : 0.65;
  const poa = asset.probabilityOfApproval ? asset.probabilityOfApproval / 100 : 0.5;
  const expectedReturnB = asset.marketOpportunity * poa * pressureMultiplier;
  const investmentB = investment / 1000;
  const roiMultiple = investmentB > 0 ? expectedReturnB / investmentB : 0;
  return (
    <>
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
        <div className="roi-stat"><span>Expected return</span><strong>${expectedReturnB.toFixed(2)}B</strong></div>
        <div className="roi-stat"><span>ROI multiple</span><strong>{roiMultiple.toFixed(1)}x</strong></div>
        <div className="roi-stat">
          <span>PoA x pressure</span>
          <strong>{(poa * 100).toFixed(0)}% x {(pressureMultiplier * 100).toFixed(0)}%</strong>
        </div>
      </div>
    </>
  );
}

function RiskAdjustedSnapshotBody() {
  const [pressure, setPressure] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const pressureMultiplier = pressure === 'Low' ? 1 : pressure === 'Medium' ? 0.85 : 0.65;
  return (
    <>
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
    </>
  );
}

function MarketingFocusBody() {
  return (
    <>
      <MetricGrid>
        <MetricCard label="CV mix" value={financialSnapshot.cardiovascularRevenueMix} />
        <MetricCard label="Growth target" value={financialSnapshot.targetRevenueGrowth} />
      </MetricGrid>
      <ul className="dp-brief-list">
        {departmentUseCases.Marketing.map((item) => (
          <li key={item}>
            <span>Need</span>
            <strong>{item}</strong>
          </li>
        ))}
      </ul>
    </>
  );
}

function CompetitorThreatBrowserBody() {
  const [openName, setOpenName] = useState<string | null>(competitors[0]?.name ?? null);
  return (
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
                <div className="competitor-feed-row-line"><span>Focus</span><span>{c.focus}</span></div>
                <div className="competitor-feed-row-line"><span>Overlap</span><span>{c.overlapWithPharmora}</span></div>
                {c.initiatives.length > 0 && (
                  <ul className="competitor-feed-list">
                    {c.initiatives.map((init) => <li key={init}>{init}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GovernanceRequirementsBody() {
  return (
    <ul className="check-list">
      {governanceRequirements.map((label) => (
        <li key={label}>
          <div className="static-check-row">
            <input type="checkbox" checked readOnly aria-label={label} />
            <span className="static-check-icon"><Check size={11} /></span>
            <span>{label}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function LiveAuditLogBody({ auditRecords }: { auditRecords: AuditRecord[] }) {
  if (auditRecords.length === 0) {
    return (
      <div className="dp-empty">
        No audit records yet. Ask the assistant a question to generate one.
      </div>
    );
  }
  return (
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
            <span>/</span>
            <span>{r.role}</span>
            <span>/</span>
            <span>{new Date(r.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ImplementationReadinessBody() {
  return (
    <>
      <div className="source-map">
        {implementationSources.map((source) => (
          <div key={source.name} className="source-map-row">
            <span>{source.name}</span>
            <strong>{source.owner}</strong>
            <em>{source.access}</em>
          </div>
        ))}
      </div>
      <div className="dp-callout">
        Pharmora is a small organization ({pharmoraProfile.size.toLowerCase()}), so IT controls
        should emphasize simple RBAC, source refresh monitoring, and low onboarding overhead.
      </div>
    </>
  );
}

function DataSourceStatusBody({ auditRecords }: { auditRecords: AuditRecord[] }) {
  const [latency, setLatency] = useState(142);
  useEffect(() => {
    const id = setInterval(() => setLatency(110 + Math.floor(Math.random() * 90)), 4000);
    return () => clearInterval(id);
  }, []);
  const sources = [
    { name: 'Pipeline DB', status: 'ok' as const, detail: `${pipelineAssets.length} assets` },
    { name: 'Competitor feed', status: 'ok' as const, detail: `${competitors.length} entries` },
    { name: 'Audit log store', status: 'ok' as const, detail: `${auditRecords.length} records` },
    { name: 'LLM endpoint', status: 'ok' as const, detail: `${latency}ms p50` },
  ];
  return (
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
  );
}

function SystemHealthBody({ auditRecords }: { auditRecords: AuditRecord[] }) {
  const [latency, setLatency] = useState(142);
  useEffect(() => {
    const id = setInterval(() => setLatency(110 + Math.floor(Math.random() * 90)), 4000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="health-grid">
      <div className="health-stat"><span>API latency</span><strong>{latency} ms</strong></div>
      <div className="health-stat"><span>Audit records</span><strong>{auditRecords.length}</strong></div>
      <div className="health-stat"><span>Active sources</span><strong>4</strong></div>
      <div className="health-stat">
        <span>Status</span>
        <strong className="health-ok"><Activity size={11} /> Healthy</strong>
      </div>
    </div>
  );
}

function AccessControlMatrixBody() {
  const matrix: { feature: string; perms: Record<string, 'R' | 'RW' | '-'> }[] = [
    { feature: 'Pipeline data', perms: { 'C-Suite': 'R', 'R&D': 'RW', Finance: 'R', Marketing: 'R', 'Reg/Comp': 'R', IT: 'RW' } },
    { feature: 'Competitor data', perms: { 'C-Suite': 'R', 'R&D': 'R', Finance: 'R', Marketing: 'RW', 'Reg/Comp': 'R', IT: 'RW' } },
    { feature: 'Audit log', perms: { 'C-Suite': 'R', 'R&D': '-', Finance: '-', Marketing: '-', 'Reg/Comp': 'RW', IT: 'RW' } },
    { feature: 'Conversations', perms: { 'C-Suite': 'RW', 'R&D': 'RW', Finance: 'RW', Marketing: 'RW', 'Reg/Comp': 'RW', IT: 'RW' } },
  ];
  return (
    <table className="dp-table dp-table-compact">
      <thead>
        <tr>
          <th>Feature</th>
          {Object.keys(matrix[0].perms).map((r) => <th key={r}>{r}</th>)}
        </tr>
      </thead>
      <tbody>
        {matrix.map((m) => (
          <tr key={m.feature}>
            <td>{m.feature}</td>
            {Object.entries(m.perms).map(([r, p]) => (
              <td key={r} className={`perm perm-${p === '-' ? 'none' : p.toLowerCase()}`}>{p}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PanelCardManager({
  onAddCustomCard,
}: {
  onAddCustomCard: (card: Omit<CustomCardData, 'id' | 'updatedAt'>) => void;
}) {
  return (
    <>
      <PanelCardLibrary />
      <CardFormCard
        id="panel-add-custom-card"
        title="Add custom card"
        subtitle="Your always-available notes"
        defaultTitle="Custom note"
        onAdd={onAddCustomCard}
      />
    </>
  );
}

function PanelCardLibrary() {
  const panel = useContext(PanelCardContext);
  const [query, setQuery] = useState('');
  const cards = panel?.availableCards || [];
  const normalized = query.trim().toLowerCase();
  const filtered = normalized
    ? cards.filter((card) => card.title.toLowerCase().includes(normalized))
    : cards;

  return (
    <ToolCard id="panel-card-library" title="Card library" subtitle="Search cards from every department" removable={false}>
      <input
        className="custom-card-input"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search cards"
      />
      <div className="card-library-list">
        {filtered.length === 0 ? (
          <div className="dp-empty">No cards match that search.</div>
        ) : (
          filtered.map((card) => (
            <div
              key={card.id}
              className={`card-library-row ${!card.added || card.hidden ? 'is-clickable' : ''}`}
              onClick={() => {
                if (card.hidden) {
                  panel?.restoreCard(card.id);
                } else if (!card.added) {
                  panel?.pinLibraryCard(card.id);
                }
              }}
            >
              <div>
                <strong>{card.title}</strong>
                <span>
                  {card.department} / {card.custom ? 'Custom' : 'Built-in'} /{' '}
                  {card.activeInCurrentRole ? (card.hidden ? 'Removed' : 'Active') : 'Different department'}
                </span>
              </div>
              {card.hidden ? (
                <button type="button" onClick={(event) => { event.stopPropagation(); panel?.restoreCard(card.id); }}>
                  <RotateCcw size={11} />
                  Restore
                </button>
              ) : !card.added ? (
                <button type="button" onClick={(event) => { event.stopPropagation(); panel?.pinLibraryCard(card.id); }}>
                  <PlusCircle size={11} />
                  Add
                </button>
              ) : !card.activeInCurrentRole && !card.custom ? (
                <button type="button" onClick={(event) => { event.stopPropagation(); panel?.unpinLibraryCard(card.id); }}>
                  <X size={11} />
                  Remove
                </button>
              ) : (
                <button type="button" onClick={(event) => { event.stopPropagation(); panel?.hideCard(card.id); }}>
                  <X size={11} />
                  Remove
                </button>
              )}
            </div>
          ))
        )}
      </div>
      <button type="button" className="card-library-reset" onClick={() => panel?.resetLayout()}>
        <RotateCcw size={12} />
        Reset Default Department Layout
      </button>
    </ToolCard>
  );
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Compressed document extraction is not supported in this browser.');
  }
  const chunk = new Uint8Array(data.byteLength);
  chunk.set(data);
  const stream = new Blob([chunk.buffer]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readDocxText(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocdOffset = -1;

  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 66000); i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) throw new Error('Could not find the DOCX directory.');

  const centralDirectorySize = view.getUint32(eocdOffset + 12, true);
  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);
  const decoder = new TextDecoder();
  let offset = centralDirectoryOffset;
  const end = centralDirectoryOffset + centralDirectorySize;

  while (offset < end && view.getUint32(offset, true) === 0x02014b50) {
    const compressionMethod = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const fileName = decoder.decode(bytes.slice(offset + 46, offset + 46 + fileNameLength));

    if (fileName === 'word/document.xml') {
      if (view.getUint32(localHeaderOffset, true) !== 0x04034b50) {
        throw new Error('Invalid DOCX local file header.');
      }
      const localNameLength = view.getUint16(localHeaderOffset + 26, true);
      const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
      const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.slice(dataStart, dataStart + compressedSize);
      const xmlBytes = compressionMethod === 0 ? compressed : await inflateRaw(compressed);
      const xml = decoder.decode(xmlBytes);
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      const textNodes = Array.from(doc.getElementsByTagName('w:t'));
      const text = textNodes.map((node) => node.textContent || '').join(' ');
      return text.replace(/\s+/g, ' ').trim();
    }

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  throw new Error('Could not find document text in the DOCX file.');
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });
}

function CardFormCard({
  id,
  title: formTitle,
  subtitle,
  defaultTitle,
  onAdd,
}: {
  id: string;
  title: string;
  subtitle: string;
  defaultTitle: string;
  onAdd: (card: Omit<CustomCardData, 'id' | 'updatedAt'>) => void;
}) {
  const [cardTitle, setCardTitle] = useState('');
  const [source, setSource] = useState('');
  const [body, setBody] = useState('');
  const [attachment, setAttachment] = useState<CardAttachment | undefined>();

  const canAdd = cardTitle.trim().length > 0 || body.trim().length > 0 || Boolean(attachment);

  const addCard = (card: Omit<CustomCardData, 'id' | 'updatedAt'>) => {
    onAdd(card);
    setCardTitle('');
    setSource('');
    setBody('');
    setAttachment(undefined);
  };

  const handleAdd = () => {
    if (!canAdd) return;
    addCard({
      title: cardTitle.trim() || defaultTitle,
      subtitle: source.trim(),
      body: body.trim(),
      attachment,
    });
  };

  const handleDocUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const lowerName = file.name.toLowerCase();
      const isPlainText =
        file.type.startsWith('text/') ||
        lowerName.endsWith('.txt') ||
        lowerName.endsWith('.md') ||
        lowerName.endsWith('.csv');
      let cardBody = '';
      let nextAttachment: CardAttachment = {
        name: file.name,
        type: file.type || 'Unknown type',
        size: file.size,
      };
      if (isPlainText) {
        cardBody = (await file.text()).slice(0, 12000);
        nextAttachment = { ...nextAttachment, text: cardBody };
      } else if (lowerName.endsWith('.docx')) {
        cardBody = (await readDocxText(file)).slice(0, 12000);
        nextAttachment = { ...nextAttachment, text: cardBody };
      } else if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        nextAttachment = { ...nextAttachment, dataUrl: await readFileAsDataUrl(file) };
      } else {
        cardBody = 'This file type is stored as a document reference. Add key takeaways in the note body.';
        nextAttachment = { ...nextAttachment, text: cardBody };
      }
      setAttachment(nextAttachment);
      setCardTitle((current) => current || file.name.replace(/\.[^.]+$/, '') || defaultTitle);
      setSource((current) => current || 'Attached document');
      if (cardBody && !body.trim()) setBody(cardBody);
    } catch (error) {
      setAttachment({
        name: file.name,
        type: file.type || 'Unknown type',
        size: file.size,
        text: `Could not read this file in the browser: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      event.target.value = '';
    }
  };

  return (
    <ToolCard id={id} title={formTitle} subtitle={subtitle} removable={false} initialMode="closed">
      <div className="panel-card-manager-header">
        <PlusCircle size={14} />
        <span>{formTitle}</span>
      </div>
      <input
        className="custom-card-input"
        value={cardTitle}
        onChange={(event) => setCardTitle(event.target.value)}
        placeholder="Card title"
      />
      <input
        className="custom-card-input"
        value={source}
        onChange={(event) => setSource(event.target.value)}
        placeholder="Subtitle"
      />
      <textarea
        className="custom-card-textarea"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Important data, notes, links, or copied document text"
      />
      {attachment && (
        <div className="custom-card-file-chip">
          <span>{attachment.name}</span>
          <button type="button" onClick={() => setAttachment(undefined)} aria-label="Remove attached document">
            <X size={11} />
          </button>
        </div>
      )}
      <div className="custom-card-actions">
        <label className="custom-card-upload">
          <Upload size={12} />
          Add doc
          <input type="file" accept=".txt,.md,.csv,.doc,.docx,.pdf,image/*" onChange={handleDocUpload} />
        </label>
        <button type="button" className="custom-card-add" onClick={handleAdd} disabled={!canAdd}>
          Add card
        </button>
      </div>
    </ToolCard>
  );
}

function KeepInMindList() {
  return (
    <ul className="guardrail-list">
      {KEEP_IN_MIND.map((label) => (
        <li key={label} className="guardrail-row">
          <span className="guardrail-icon" aria-hidden>
            <AlertCircle size={14} />
          </span>
          <div className="guardrail-label">{label}</div>
        </li>
      ))}
    </ul>
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
      <ToolCard title="Executive case brief" subtitle="SRD goals and case packet financial context">
        <MetricGrid>
          <MetricCard label="Gross margin" value={financialSnapshot.grossMargin} />
          <MetricCard label="2024 growth" value={financialSnapshot.revenueGrowth2024} />
          <MetricCard label="CV revenue mix" value={financialSnapshot.cardiovascularRevenueMix} />
          <MetricCard label="Target CV mix" value={financialSnapshot.targetCardiovascularMix} />
        </MetricGrid>
        <ul className="dp-brief-list">
          {strategicObjectives.map((item) => (
            <li key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <em>{item.detail}</em>
            </li>
          ))}
        </ul>
      </ToolCard>

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
                  <span>/</span>
                  <span>{a.stage}</span>
                  <span>/</span>
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
            ? 'High concentration risk - diversification recommended.'
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

  return (
    <>
      <ToolCard title="R&D decision fit" subtitle="Scenario comparison needs from the SRD">
        <ul className="dp-brief-list">
          {departmentUseCases['R&D'].map((item) => (
            <li key={item}>
              <span>Use case</span>
              <strong>{item}</strong>
            </li>
          ))}
        </ul>
        <div className="dp-callout">
          Prioritize near-term cardiovascular launches while testing endocrinology expansion for
          obesity and diabetes diversification.
        </div>
      </ToolCard>

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
                {a.therapeuticArea} / {a.marketOpportunityLabel} /{' '}
                {a.probabilityOfApproval ? `${a.probabilityOfApproval}% PoA` : '- PoA'}
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
              {a.name} - {a.stage}
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
            <span>{selected.probabilityOfApproval ? `${selected.probabilityOfApproval}%` : '-'}</span>
          </div>
          <p className="inspector-desc">{selected.description}</p>
        </div>
      </ToolCard>

      <ToolCard title="Trial endpoint checklist" subtitle="Toggle target endpoints (saved locally)">
        <ChecklistEditor
          storageKey="pharmora-rd-endpoints"
          customItemsKey="pharmora-rd-endpoints-custom"
          baseItems={RD_ENDPOINTS}
          countLabel="selected"
          showProgress
        />
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
      <ToolCard title="Operating expense mix" subtitle="2024 case packet allocation">
        <div className="expense-list">
          {operatingExpenseMix.map((item) => (
            <div key={item.segment} className="expense-row">
              <div className="expense-row-top">
                <span>{item.segment}</span>
                <strong>{item.share}%</strong>
              </div>
              <div className="expense-track">
                <div className="expense-fill" style={{ width: `${item.share}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="dp-callout">
          SG&A plus Marketing & Sales total 65%, while R&D is 25%. Finance should test
          whether reallocation can fund diversification without breaking margin discipline.
        </div>
      </ToolCard>

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
            <strong>{roiMultiple.toFixed(1)}x</strong>
          </div>
          <div className="roi-stat">
            <span>PoA x pressure</span>
            <strong>
              {(poa * 100).toFixed(0)}% x {(pressureMultiplier * 100).toFixed(0)}%
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

  return (
    <>
      <ToolCard title="Marketing focus" subtitle="Competition, trust, access">
        <MetricGrid>
          <MetricCard label="CV mix" value={financialSnapshot.cardiovascularRevenueMix} />
          <MetricCard label="Growth target" value={financialSnapshot.targetRevenueGrowth} />
        </MetricGrid>
        <ul className="dp-brief-list">
          {departmentUseCases.Marketing.map((item) => (
            <li key={item}>
              <span>Need</span>
              <strong>{item}</strong>
            </li>
          ))}
        </ul>
      </ToolCard>

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
        <ChecklistEditor
          storageKey="pharmora-mkt-diffs"
          customItemsKey="pharmora-mkt-diffs-custom"
          baseItems={MARKETING_DIFFERENTIATORS}
          countLabel="selected"
        />
      </ToolCard>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Regulatory / Compliance                                             */
/* ------------------------------------------------------------------ */

function ComplianceTools({ auditRecords }: { auditRecords: AuditRecord[] }) {
  return (
    <>
      <ToolCard title="Governance requirements" subtitle="Must-have controls from the SRD">
        <ul className="check-list">
          {governanceRequirements.map((label) => (
            <li key={label}>
              <div className="static-check-row">
                <input type="checkbox" checked readOnly aria-label={label} />
                <span className="static-check-icon">
                  <Check size={11} />
                </span>
                <span>{label}</span>
              </div>
            </li>
          ))}
        </ul>
      </ToolCard>

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
                  <span>/</span>
                  <span>{r.role}</span>
                  <span>/</span>
                  <span>{new Date(r.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </ToolCard>

      <ToolCard title="Compliance checklist" subtitle="Track readiness for scaled deployment">
        <ChecklistEditor
          storageKey="pharmora-compliance-checklist"
          customItemsKey="pharmora-compliance-checklist-custom"
          baseItems={COMPLIANCE_READINESS}
          countLabel="cleared"
          showProgress
        />
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
    { name: 'Pipeline DB', status: 'ok' as const, detail: `${pipelineAssets.length} assets` },
    { name: 'Competitor feed', status: 'ok' as const, detail: `${competitors.length} entries` },
    { name: 'Audit log store', status: 'ok' as const, detail: `${auditRecords.length} records` },
    { name: 'LLM endpoint', status: 'ok' as const, detail: `${latency}ms p50` },
  ];

  const matrix: { feature: string; perms: Record<string, 'R' | 'RW' | '-'> }[] = [
    { feature: 'Pipeline data', perms: { 'C-Suite': 'R', 'R&D': 'RW', Finance: 'R', Marketing: 'R', 'Reg/Comp': 'R', IT: 'RW' } },
    { feature: 'Competitor data', perms: { 'C-Suite': 'R', 'R&D': 'R', Finance: 'R', Marketing: 'RW', 'Reg/Comp': 'R', IT: 'RW' } },
    { feature: 'Audit log', perms: { 'C-Suite': 'R', 'R&D': '-', Finance: '-', Marketing: '-', 'Reg/Comp': 'RW', IT: 'RW' } },
    { feature: 'Conversations', perms: { 'C-Suite': 'RW', 'R&D': 'RW', Finance: 'RW', Marketing: 'RW', 'Reg/Comp': 'RW', IT: 'RW' } },
  ];

  return (
    <>
      <ToolCard title="Implementation readiness" subtitle="Sources to clean and ingest before go-live">
        <div className="source-map">
          {implementationSources.map((source) => (
            <div key={source.name} className="source-map-row">
              <span>{source.name}</span>
              <strong>{source.owner}</strong>
              <em>{source.access}</em>
            </div>
          ))}
        </div>
        <div className="dp-callout">
          Pharmora is a small organization ({pharmoraProfile.size.toLowerCase()}), so IT controls
          should emphasize simple RBAC, source refresh monitoring, and low onboarding overhead.
        </div>
      </ToolCard>

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

      <ToolCard title="Access control matrix" subtitle="Read (R) / Read+Write (RW)">
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
                  <td key={r} className={`perm perm-${p === '-' ? 'none' : p.toLowerCase()}`}>
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
/* Common                                                              */
/* ------------------------------------------------------------------ */

function ToolCard({
  id,
  title,
  subtitle,
  children,
  removable = true,
  initialMode = 'normal',
  onRemove,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  removable?: boolean;
  initialMode?: 'normal' | 'expanded' | 'closed';
  onRemove?: () => void;
}) {
  const panel = useContext(PanelCardContext);
  const cardId = id || `card-${slugify(title)}`;
  const [mode, setMode] = useState<'normal' | 'expanded' | 'closed'>(initialMode);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragEnterCount = useRef(0);
  const expanded = mode === 'expanded';
  const closed = mode === 'closed';
  const orderIndex = panel?.getOrderIndex(cardId);
  const isDragging = panel?.draggingId === cardId;
  const isAnotherDragging = panel?.draggingId != null && panel.draggingId !== cardId;

  useEffect(() => {
    panel?.registerCard(cardId, title);
  }, [panel, cardId, title]);

  const handleToggle = () => {
    setMode((current) => {
      if (current === 'closed') return 'expanded';
      return 'closed';
    });
  };

  if (panel?.isHidden(cardId)) return null;

  return (
    <section
      className={`dp-card ${expanded ? 'is-expanded' : ''} ${closed ? 'is-closed' : ''} ${isDragging ? 'is-dragging' : ''} ${isDragOver && isAnotherDragging ? 'is-drag-over' : ''}`}
      style={orderIndex === undefined ? undefined : { order: orderIndex }}
      onDragOver={(event) => {
        if (!isAnotherDragging) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      }}
      onDragEnter={(event) => {
        if (!isAnotherDragging) return;
        event.preventDefault();
        dragEnterCount.current += 1;
        setIsDragOver(true);
      }}
      onDragLeave={() => {
        dragEnterCount.current = Math.max(0, dragEnterCount.current - 1);
        if (dragEnterCount.current === 0) setIsDragOver(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        dragEnterCount.current = 0;
        setIsDragOver(false);
        const fromId = event.dataTransfer.getData('text/plain');
        if (fromId) panel?.moveCard(fromId, cardId);
      }}
    >
      <div className="dp-card-header">
        <span
          className="dp-card-drag-grip"
          title="Drag to reorder"
          aria-hidden
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData('text/plain', cardId);
            event.dataTransfer.effectAllowed = 'move';
            panel?.setDraggingId(cardId);
          }}
          onDragEnd={() => {
            panel?.setDraggingId(null);
          }}
        >
          <GripVertical size={13} />
        </span>
        <button
          type="button"
          className="dp-card-toggle"
          onClick={handleToggle}
          aria-expanded={!closed}
          title={closed ? 'Open and expand card' : 'Close card'}
        >
          <div className="dp-card-titles">
            <span className="dp-card-title">{title}</span>
            {subtitle && <span className="dp-card-subtitle">{subtitle}</span>}
          </div>
          <span className="dp-card-expand-icon" aria-hidden>
            {closed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </span>
        </button>
        {panel && removable && (
          <button
            type="button"
            className="dp-card-remove"
            onClick={() => (onRemove ? onRemove() : panel.hideCard(cardId))}
            aria-label={panel.isCustom(cardId) ? `Delete ${title}` : `Remove ${title}`}
            title={panel.isCustom(cardId) ? 'Delete custom card' : 'Remove card'}
          >
            <X size={13} />
          </button>
        )}
      </div>
      <div className="dp-card-body" aria-hidden={closed}>{children}</div>
    </section>
  );
}

function MetricGrid({ children }: { children: React.ReactNode }) {
  return <div className="dp-metric-grid">{children}</div>;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="dp-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ChecklistEditor({
  storageKey,
  customItemsKey,
  baseItems,
  countLabel,
  showProgress = false,
}: {
  storageKey: string;
  customItemsKey: string;
  baseItems: string[];
  countLabel: string;
  showProgress?: boolean;
}) {
  const [customItems, setCustomItems] = useState<string[]>(() => readJson<string[]>(customItemsKey, []));
  const items = useMemo(() => [...baseItems, ...customItems], [baseItems, customItems]);
  const [checked, setChecked] = useChecklist(storageKey, items, []);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    localStorage.setItem(customItemsKey, JSON.stringify(customItems));
  }, [customItems, customItemsKey]);

  const addItem = () => {
    const next = draft.trim();
    if (!next) return;
    setCustomItems((current) => (current.includes(next) ? current : [...current, next]));
    setDraft('');
  };

  return (
    <>
      <ul className="check-list">
        {items.map((label, i) => (
          <li key={`${label}-${i}`}>
            <label className={`check-row ${checked.includes(i) ? 'is-on' : ''}`}>
              <input
                type="checkbox"
                checked={checked.includes(i)}
                onChange={() =>
                  setChecked((current) =>
                    current.includes(i) ? current.filter((x) => x !== i) : [...current, i]
                  )
                }
              />
              <span className="check-box">{checked.includes(i) && <Check size={11} />}</span>
              <span>{label}</span>
            </label>
          </li>
        ))}
      </ul>

      <div className="check-add-row">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') addItem();
          }}
          placeholder="Add checklist item"
        />
        <button type="button" onClick={addItem} disabled={!draft.trim()}>
          Add
        </button>
      </div>

      {showProgress && (
        <div className="dp-progressbar">
          <div
            className="dp-progressbar-fill"
            style={{ width: `${items.length ? (checked.length / items.length) * 100 : 0}%` }}
          />
        </div>
      )}

      <div className="dp-footnote">
        {checked.length} of {items.length} {countLabel}
      </div>
    </>
  );
}

function useChecklist(
  storageKey: string,
  items: string[],
  initial: number[],
): [number[], Dispatch<SetStateAction<number[]>>] {
  const [state, setState] = useState<number[]>(() => {
    try {
      const resetMarker = `${CHECKLIST_DEFAULTS_VERSION}-${storageKey}`;
      if (!localStorage.getItem(resetMarker)) {
        localStorage.removeItem(storageKey);
        localStorage.setItem(resetMarker, '1');
      }
      const raw = localStorage.getItem(storageKey);
      if (!raw) return initial;
      const parsed = JSON.parse(raw) as number[];
      return Array.from(new Set(parsed.filter((i) => i >= 0 && i < items.length)));
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, storageKey]);
  return [state, setState];
}
