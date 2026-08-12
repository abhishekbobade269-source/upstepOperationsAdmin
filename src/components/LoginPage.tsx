import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Briefcase, 
  TrendingUp, 
  Lock, 
  User, 
  ArrowRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import type { Role, AuthUser } from '../types';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<Role>('admin');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rolePresets: Record<Role, { title: string; defaultUser: string; desc: string; color: string; icon: React.ReactNode; permissions: string[] }> = {
    admin: {
      title: 'System Admin',
      defaultUser: 'admin',
      desc: 'Full administrative access across all portals, coach profiles, shift builders & grid row modifications.',
      color: '#f59e0b',
      icon: <ShieldCheck className="icon-lg" style={{ color: '#f59e0b' }} />,
      permissions: [
        'Full Access to Management & Admin Portals',
        'Add & Remove Grid Rows & Time Slots',
        'Edit & Onboard Coach Profiles',
        'Custom Shift Builder & Audit Diagnostics'
      ]
    },
    manager: {
      title: 'Ops Manager',
      defaultUser: 'manager',
      desc: 'Operational management access to view & book slots, assign substitutes, and manage schedules.',
      color: '#3b82f6',
      icon: <Briefcase className="icon-lg" style={{ color: '#3b82f6' }} />,
      permissions: [
        'Management & Admin Portals Access',
        'Slot Booking & Substitute Assignment',
        'Cannot Add/Remove Time Slot Rows',
        'Cannot Edit Coach Profile Details or Add Coaches'
      ]
    },
    salesperson: {
      title: 'Salesperson',
      defaultUser: 'sales',
      desc: 'Dedicated portal to view same-day demo availability and submit demo requirement requests.',
      color: '#10b981',
      icon: <TrendingUp className="icon-lg" style={{ color: '#10b981' }} />,
      permissions: [
        'Access ONLY to Same-Day Demo Tracker',
        'View Real-time Free Demo Slots',
        'Submit Demo Booking Requirements',
        'Restricted from Master Schedule & Admin'
      ]
    },
    rm: {
      title: 'Relationship Manager',
      defaultUser: 'rm',
      desc: 'View relationship manager schedules and assigned coach allocations.',
      color: '#a855f7',
      icon: <User className="icon-lg" style={{ color: '#a855f7' }} />,
      permissions: ['View Coach Schedules & Slot Allocations']
    }
  };

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setError('');
    if (role === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else if (role === 'manager') {
      setUsername('manager');
      setPassword('manager123');
    } else if (role === 'salesperson') {
      setUsername('sales');
      setPassword('sales123');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      let roleTitle = 'System Admin';
      if (selectedRole === 'manager') roleTitle = 'Ops Manager';
      if (selectedRole === 'salesperson') roleTitle = 'Sales Executive';

      const user: AuthUser = {
        username: username.trim(),
        name: username.charAt(0).toUpperCase() + username.slice(1),
        role: selectedRole,
        roleTitle
      };

      setIsSubmitting(false);
      onLogin(user);
    }, 600);
  };

  const handleQuickLogin = (role: Role) => {
    setSelectedRole(role);
    setIsSubmitting(true);

    setTimeout(() => {
      let roleTitle = 'System Admin';
      let name = 'Administrator';
      if (role === 'manager') { roleTitle = 'Ops Manager'; name = 'Operations Manager'; }
      if (role === 'salesperson') { roleTitle = 'Sales Executive'; name = 'Sales Representative'; }

      const user: AuthUser = {
        username: rolePresets[role].defaultUser,
        name,
        role,
        roleTitle
      };

      setIsSubmitting(false);
      onLogin(user);
    }, 500);
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        
        {/* Left Branding Panel */}
        <div className="login-brand-panel">
          <div className="login-brand-header">
            <div className="login-brand-logo">
              <span>♟️</span>
            </div>
            <div>
              <h2>Upstep Coach Scheduler</h2>
              <p>Operations & Master Slot Management Portal</p>
            </div>
          </div>

          <div className="login-role-cards">
            <div className="login-cards-title">
              <Sparkles size={14} color="#f59e0b" /> Select Login Role or Quick Connect
            </div>

            <div className="role-preset-grid">
              {(['admin', 'manager', 'salesperson'] as const).map(roleKey => {
                const preset = rolePresets[roleKey];
                const isSelected = selectedRole === roleKey;
                return (
                  <div
                    key={roleKey}
                    className={`role-preset-card ${isSelected ? 'active' : ''}`}
                    onClick={() => handleRoleSelect(roleKey)}
                    style={{ borderColor: isSelected ? preset.color : 'transparent' }}
                  >
                    <div className="role-preset-header">
                      <div className="role-preset-icon-box" style={{ background: `${preset.color}15` }}>
                        {preset.icon}
                      </div>
                      <div>
                        <div className="role-preset-title" style={{ color: isSelected ? preset.color : 'var(--text-main)' }}>
                          {preset.title}
                        </div>
                        <div className="role-preset-user">User: @{preset.defaultUser}</div>
                      </div>
                    </div>

                    <p className="role-preset-desc">{preset.desc}</p>

                    <div className="role-preset-footer">
                      <button
                        type="button"
                        className="btn-quick-login"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickLogin(roleKey);
                        }}
                        style={{ background: preset.color, color: '#fff' }}
                      >
                        Quick Login as {preset.title} <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="login-form-panel">
          <div className="login-form-header">
            <h3>Account Sign In</h3>
            <p>Access the Upstep operations workspace based on your assigned role.</p>
          </div>

          {/* Active Role Info Box */}
          <div 
            className="login-active-role-box"
            style={{ borderLeftColor: rolePresets[selectedRole].color }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: rolePresets[selectedRole].color, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {rolePresets[selectedRole].icon}
              Signing in as {rolePresets[selectedRole].title}
            </div>
            <ul className="role-perm-list">
              {rolePresets[selectedRole].permissions.map((perm, idx) => (
                <li key={idx}>
                  <CheckCircle2 size={12} color={rolePresets[selectedRole].color} />
                  <span>{perm}</span>
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <div className="login-error-banner">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label font-bold">Username / Email ID:</label>
              <div className="input-with-icon">
                <User className="input-icon" />
                <input
                  type="text"
                  required
                  placeholder="Enter username..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="text-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label font-bold">Password:</label>
              <div className="input-with-icon">
                <Lock className="input-icon" />
                <input
                  type="password"
                  required
                  placeholder="Enter password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-login-submit"
              style={{ background: rolePresets[selectedRole].color }}
            >
              {isSubmitting ? 'Authenticating...' : `Sign In as ${rolePresets[selectedRole].title}`}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="login-footer">
            <span>🛡️ Protected Portal · Upstep Chess Academy</span>
          </div>
        </div>

      </div>
    </div>
  );
};
