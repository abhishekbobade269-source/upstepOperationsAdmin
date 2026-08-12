import React, { useState } from 'react';
import { authenticateUser, getRoleTitle } from '../utils/userStorage';
import type { AuthUser } from '../types';
import { User, Lock, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const userAccount = authenticateUser(username, password);

      if (!userAccount) {
        setIsSubmitting(false);
        setError('Invalid username or password. Please try again.');
        return;
      }

      const authUser: AuthUser = {
        username: userAccount.username,
        name: userAccount.name,
        role: userAccount.role,
        roleTitle: getRoleTitle(userAccount.role)
      };

      setIsSubmitting(false);
      onLogin(authUser);
    }, 450);
  };

  return (
    <div className="login-wrapper">
      <div className="login-single-card">
        {/* Glow Effects */}
        <div className="login-card-glow-bg"></div>

        <div className="login-card-content">
          {/* Header */}
          <div className="login-card-header">
            <div className="login-brand-logo-large">
              <span>♟️</span>
            </div>
            <h2>Upstep Operations Hub</h2>
            <p>Master Coach Scheduling & Operational Management</p>
          </div>

          {/* Quick Info Chip */}
          <div className="login-info-chip">
            <Sparkles size={14} color="#f59e0b" />
            <span>Default Admin Login: <strong>admin</strong> / <strong>admin123</strong></span>
          </div>

          {error && (
            <div className="login-error-banner">
              ⚠️ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label font-bold" style={{ fontSize: '0.84rem' }}>Username:</label>
              <div className="input-with-icon">
                <User className="input-icon" />
                <input
                  type="text"
                  required
                  placeholder="Enter username..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="text-input"
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label font-bold" style={{ fontSize: '0.84rem' }}>Password:</label>
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
              className="btn-login-submit-primary"
            >
              {isSubmitting ? (
                'Authenticating Credentials...'
              ) : (
                <>
                  Sign In to Upstep Hub <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Footer Note */}
          <div className="login-card-footer">
            <ShieldCheck size={14} color="#60a5fa" />
            <span>Protected Enterprise System · Upstep Academy</span>
          </div>
        </div>
      </div>
    </div>
  );
};
