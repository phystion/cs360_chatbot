import { useState, useRef, useEffect, useCallback } from 'react';
import { Briefcase, FlaskConical, DollarSign, Megaphone, ShieldCheck, Server, RotateCcw, GripVertical, Minus, Plus, Eye, ChevronsRight, ChevronRight, LucideProps } from 'lucide-react';
import { Role } from '../types';
import { roleConfigs } from '../data/roleConfig';

type IconComponent = React.ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>>;

const iconMap: Record<string, IconComponent> = {
  Briefcase,
  FlaskConical,
  DollarSign,
  Megaphone,
  ShieldCheck,
  Server,
};

interface Position {
  x: number;
  y: number;
}

interface Props {
  activeRole: Role;
  signedInRole: Role;
  onChange: (role: Role) => void;
}

const STORAGE_KEY = 'pharmora-test-panel-pos';
const PANEL_WIDTH = 240;
const PANEL_HEIGHT_OPEN = 256;
const PANEL_HEIGHT_CLOSED = 44;
const MARGIN = 16;

function getInitialPosition(): Position {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as Position;
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        return parsed;
      }
    } catch {
      // fall through
    }
  }
  return {
    x: window.innerWidth - PANEL_WIDTH - MARGIN,
    y: window.innerHeight - PANEL_HEIGHT_OPEN - MARGIN,
  };
}

function clamp(pos: Position, height: number): Position {
  const maxX = window.innerWidth - PANEL_WIDTH - 4;
  const maxY = window.innerHeight - height - 4;
  return {
    x: Math.max(4, Math.min(pos.x, maxX)),
    y: Math.max(4, Math.min(pos.y, maxY)),
  };
}

export function TestPanel({ activeRole, signedInRole, onChange }: Props) {
  const [open, setOpen] = useState(true);
  const [hidden, setHidden] = useState(true);
  const [pos, setPos] = useState<Position>(getInitialPosition);
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const isTesting = activeRole !== signedInRole;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  }, [pos]);

  useEffect(() => {
    const onResize = () => {
      setPos((p) => clamp(p, open ? PANEL_HEIGHT_OPEN : PANEL_HEIGHT_CLOSED));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, [data-no-drag]')) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    };
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    const next = clamp(
      { x: dragState.current.origX + dx, y: dragState.current.origY + dy },
      open ? PANEL_HEIGHT_OPEN : PANEL_HEIGHT_CLOSED,
    );
    setPos(next);
  }, [open]);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (dragState.current) {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      dragState.current = null;
    }
  }, []);

  if (hidden) {
    const tabTop = Math.max(60, Math.min(pos.y + 10, window.innerHeight - 100));
    return (
      <button
        className="floating-test-tab"
        style={{ top: tabTop }}
        onClick={() => setHidden(false)}
        aria-label="Show View as panel"
      >
        <ChevronRight size={14} />
      </button>
    );
  }

  return (
    <div
      className={`floating-test-panel ${open ? 'is-open' : 'is-closed'}`}
      style={{ left: pos.x, top: pos.y, width: PANEL_WIDTH }}
    >
      <div
        className="floating-test-handle"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <GripVertical size={14} className="floating-test-grip" />
        <Eye size={13} />
        <div className="floating-test-title">
          <span className="floating-test-title-main">View as</span>
          <span className="floating-test-prod-badge">production only</span>
        </div>
        <button
          className="floating-test-collapse"
          data-no-drag
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Collapse' : 'Expand'}
        >
          {open ? <Minus size={12} /> : <Plus size={12} />}
        </button>
        <button
          className="floating-test-dismiss"
          data-no-drag
          onClick={() => setHidden(true)}
          aria-label="Hide panel"
          title="Hide panel to side"
        >
          <ChevronsRight size={12} />
        </button>
      </div>

      {open && (
        <div className="floating-test-body">
          <p className="floating-test-help">
            Switch the department view. Your account remains{' '}
            <strong>{signedInRole}</strong>.
          </p>
          <div className="floating-test-grid">
            {roleConfigs.map((r) => {
              const Icon = iconMap[r.icon];
              const isActive = activeRole === r.role;
              const isHome = signedInRole === r.role;
              return (
                <button
                  key={r.role}
                  className={`floating-test-chip ${isActive ? 'is-active' : ''} ${isHome ? 'is-home' : ''}`}
                  onClick={() => onChange(r.role)}
                  title={`${r.label}${isHome ? ' (your account)' : ''}`}
                >
                  <Icon size={12} />
                  <span>{r.shortLabel}</span>
                </button>
              );
            })}
          </div>
          {isTesting && (
            <button className="floating-test-reset" onClick={() => onChange(signedInRole)}>
              <RotateCcw size={11} />
              Back to {signedInRole}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
