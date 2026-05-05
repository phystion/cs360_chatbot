import { useState } from 'react';
import { ShieldCheck, Lock, User, Building2, AlertTriangle } from 'lucide-react';
import { Role } from '../types';
import { PharmoraLogo } from './PharmoraLogo';
import { TEST_USER_EMAIL, normalizeEmail } from '../lib/shareStore';

interface Props {
  onLogin: (role: Role, username: string) => void;
}

const DEPARTMENT_ROLES: Record<string, Role> = {
  'C-Suite': 'C-Suite',
  'R&D': 'R&D',
  'Finance': 'Finance',
  'Marketing': 'Marketing',
  'Regulatory': 'Regulatory/Compliance',
  'IT': 'IT',
};

export function LoginScreen({ onLogin }: Props) {
  const [department, setDepartment] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;

    if (!department || !username || !password) {
      setError('All fields are required.');
      return;
    }

    if (normalizeEmail(username) === TEST_USER_EMAIL && password === 'test') {
      onLogin(DEPARTMENT_ROLES[department], TEST_USER_EMAIL);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        setLocked(true);
        setError('Account locked after 3 failed attempts. Contact your administrator.');
      } else {
        setError(`Invalid credentials. ${3 - newAttempts} attempt(s) remaining.`);
      }
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-header">
          <div className="login-brand">
            <PharmoraLogo size={48} />
            <div>
              <div className="brand-title">Pharmora Co-Assist</div>
              <div className="brand-subtitle">AI Decision Support System</div>
            </div>
          </div>
          <div className="login-secure-badge">
            <ShieldCheck size={14} />
            <span>Secure Access Portal</span>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-test-creds-banner">
            <strong>Test credentials:</strong> Email <code>{TEST_USER_EMAIL}</code> · Password <code>test</code>
          </div>

          <div className="login-field">
            <label className="login-label">
              <Building2 size={14} />
              Department
            </label>
            <select
              className="login-select"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={locked}
            >
              <option value="">Select your department...</option>
              <option value="C-Suite">C-Suite / Executive</option>
              <option value="R&D">Research & Development</option>
              <option value="Finance">Finance</option>
              <option value="Marketing">Marketing</option>
              <option value="Regulatory">Regulatory / Compliance</option>
              <option value="IT">Information Technology</option>
            </select>
          </div>

          <div className="login-field">
            <label className="login-label">
              <User size={14} />
              Email
            </label>
            <input
              type="email"
              className="login-input"
              placeholder="Enter your email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={locked}
            />
          </div>

          <div className="login-field">
            <label className="login-label">
              <Lock size={14} />
              Password
            </label>
            <input
              type="password"
              className="login-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={locked}
            />
          </div>

          {error && (
            <div className={`login-error ${locked ? 'login-error-locked' : ''}`}>
              <AlertTriangle size={14} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="login-submit" disabled={locked}>
            {locked ? 'Account Locked' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>Authorized personnel only. All access is logged and audited.</p>
          <p>Role-based access controls ensure you see only data relevant to your department.</p>
        </div>
      </div>
    </div>
  );
}
