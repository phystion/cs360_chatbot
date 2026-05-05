import { useState } from 'react';
import {
  Briefcase,
  FlaskConical,
  DollarSign,
  Megaphone,
  ShieldCheck,
  Server,
  LucideProps,
  UserCircle2,
  ChevronDown,
  Mail,
  LogOut,
} from 'lucide-react';
import { Role } from '../types';
import { getRoleConfig } from '../data/roleConfig';

type IconComponent = React.ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>>;

const iconMap: Record<string, IconComponent> = {
  Briefcase,
  FlaskConical,
  DollarSign,
  Megaphone,
  ShieldCheck,
  Server,
};

interface Props {
  username: string;
  signedInRole: Role;
  onLogout?: () => void;
}

export function UserProfile({ username, signedInRole, onLogout }: Props) {
  const [expanded, setExpanded] = useState(false);
  const config = getRoleConfig(signedInRole);
  const Icon = iconMap[config.icon];
  const userEmail = username.includes('@') ? username : `${username || 'user'}@pharmora.local`;
  const accountName = username.includes('@') ? username.split('@')[0] : username;
  const displayName = accountName ? accountName.charAt(0).toUpperCase() + accountName.slice(1) : 'User';
  const initials = displayName.slice(0, 1).toUpperCase();

  return (
    <div className={`user-profile ${expanded ? 'is-expanded' : ''}`}>
      <button
        className="user-profile-header"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div className="user-profile-avatar" aria-hidden>
          <span className="user-profile-initials">{initials}</span>
          <UserCircle2 size={28} className="user-profile-avatar-icon" />
        </div>
        <div className="user-profile-body">
          <div className="user-profile-name">{displayName}</div>
          <div className="user-profile-role">
            <Icon size={11} />
            <span>{config.label}</span>
          </div>
        </div>
        <ChevronDown size={15} className="user-profile-chevron" />
      </button>

      {expanded && (
        <div className="user-profile-details">
          <div className="user-profile-detail-row">
            <Mail size={12} />
            <span>{userEmail}</span>
          </div>
          <div className="user-profile-detail-row">
            <Icon size={12} />
            <span>{config.description}</span>
          </div>
          {onLogout && (
            <button
              className="user-profile-logout"
              onClick={onLogout}
              aria-label="Sign out"
            >
              <LogOut size={13} />
              <span>Sign out</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
