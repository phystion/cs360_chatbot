import { Role } from '../types';

const roles: { role: Role; label: string; icon: string }[] = [
  { role: 'C-Suite', label: 'C-Suite', icon: 'CS' },
  { role: 'R&D', label: 'R&D', icon: 'RD' },
  { role: 'Finance', label: 'Finance', icon: 'FN' },
  { role: 'Marketing', label: 'Marketing', icon: 'MK' },
  { role: 'Regulatory/Compliance', label: 'Reg/Comp', icon: 'RC' },
  { role: 'IT', label: 'IT', icon: 'IT' },
];

interface Props {
  selected: Role;
  onChange: (role: Role) => void;
}

export function RoleSelector({ selected, onChange }: Props) {
  return (
    <div className="role-selector">
      <label className="role-label">Active Role</label>
      <div className="role-grid">
        {roles.map((r) => (
          <button
            key={r.role}
            className={`role-chip ${selected === r.role ? 'role-chip-active' : ''}`}
            onClick={() => onChange(r.role)}
            title={r.role}
          >
            <span className="role-chip-icon">{r.icon}</span>
            <span className="role-chip-label">{r.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
