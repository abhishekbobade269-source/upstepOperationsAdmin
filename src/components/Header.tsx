import React, { useState } from 'react';
import { 
  Calendar, 
  Clock,
  Search, 
  User,
  Settings, 
  AlertTriangle, 
  PlusCircle, 
  Sun, 
  Moon, 
  Briefcase,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Zap,
  KeyRound
} from 'lucide-react';
import type { Role, AuthUser } from '../types';

interface HeaderProps {
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  activePortal: 'management' | 'admin';
  setActivePortal: (portal: 'management' | 'admin') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  metrics: {
    totalCoaches: number;
    activeClasses: number;
    freeSlots: number;
    conflicts: number;
  };
  onResetDatabase?: () => void;
  isSidebarCollapsed?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  setCurrentRole,
  currentUser,
  onLogout,
  activePortal,
  setActivePortal,
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  metrics,
  onResetDatabase,
  isSidebarCollapsed = false
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleNavClick = (portal: 'management' | 'admin', tab: string) => {
    setActivePortal(portal);
    setActiveTab(tab);
    setIsDrawerOpen(false);
  };

  return (
    <>
      <header className="app-header">
        {/* Top Bar */}
        <div className="header-top">
          <div className="brand-section">
            {/* Mobile Menu Toggle */}
            <button 
              type="button" 
              className="mobile-menu-toggle"
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              aria-label="Toggle Mobile Menu"
            >
              {isDrawerOpen ? <X className="icon" /> : <Menu className="icon" />}
            </button>
            
            {/* Mobile-only logo (on desktop, logo is always in the sidebar) */}
            <div className="brand-logo mobile-only-logo">
              <span>♟️</span>
            </div>

            {/* Title Block: Rendered on the right of the closed sidebar bar, or always on mobile */}
            <div className={`header-title-block ${isSidebarCollapsed ? 'show-desktop' : 'hide-desktop'}`}>
              <h1 className="app-title">Upstep Operations</h1>
              <p className="app-subtitle">Operations & Master Slot Management System</p>
            </div>
          </div>

          {/* System Quick Metrics */}
          <div className="header-metrics">
            <div className="metric-pill">
              <User className="icon" />
              <span>Coaches: <strong>{metrics.totalCoaches}</strong></span>
            </div>
            <div className="metric-pill green">
              <Briefcase className="icon" />
              <span>Active Batches: <strong>{metrics.activeClasses}</strong></span>
            </div>
            <div className="metric-pill blue">
              <Calendar className="icon" />
              <span>Free Slots: <strong>{metrics.freeSlots}</strong></span>
            </div>
            {metrics.conflicts > 0 && (
              <div 
                className="metric-pill red badge-pulse" 
                onClick={() => { setActivePortal('admin'); setActiveTab('audit'); }}
                style={{ cursor: 'pointer' }}
                title="Click to view conflict diagnostics"
              >
                <AlertTriangle className="icon" />
                <span>Conflicts: <strong>{metrics.conflicts}</strong></span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="header-controls">
            {/* User Badge */}
            {currentUser && (
              <div className="user-badge-pill" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.35rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                <User size={14} color={currentRole === 'admin' ? '#f59e0b' : currentRole === 'manager' ? '#3b82f6' : '#10b981'} />
                <span>
                  <strong>{currentUser.name}</strong> ({currentUser.roleTitle})
                </span>
              </div>
            )}

            {/* Role selector */}
            <div className="role-selector">
              <label>Role:</label>
              <select 
                value={currentRole} 
                onChange={(e) => setCurrentRole(e.target.value as Role)}
                className="select-input"
              >
                <option value="admin">System Admin</option>
                <option value="manager">Ops Manager</option>
                <option value="salesperson">Salesperson</option>
                <option value="rm">Relationship Manager</option>
              </select>
            </div>

            {/* Theme Toggle */}
            <button 
              type="button" 
              onClick={() => setDarkMode(!darkMode)} 
              className="icon-button"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="icon text-amber" /> : <Moon className="icon" />}
            </button>

            {/* Reset Database Button */}
            {onResetDatabase && currentRole === 'admin' && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("Are you sure you want to reset the scheduler database back to baseline mock data?")) {
                    onResetDatabase();
                  }
                }}
                className="icon-button"
                style={{ color: 'var(--accent-red)' }}
                title="Reset Database to Baseline"
              >
                🔄
              </button>
            )}

            {/* Logout Button */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="icon-button"
                style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.4)' }}
                title="Log Out of System"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer (Only for small screens) */}
      <div 
        className={`mobile-drawer-overlay ${isDrawerOpen ? 'open' : ''}`}
        onClick={() => setIsDrawerOpen(false)}
      >
        <div 
          className="mobile-drawer-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mobile-drawer-header">
            <div className="brand-section">
              <div className="brand-logo">
                <span>♟️</span>
              </div>
              <div>
                <h3 className="app-title">Upstep Navigation</h3>
                <p className="app-subtitle">{activePortal.toUpperCase()} PORTAL • {currentRole.toUpperCase()}</p>
              </div>
            </div>
            <button 
              type="button" 
              className="close-drawer-btn"
              onClick={() => setIsDrawerOpen(false)}
            >
              <X className="icon" />
            </button>
          </div>

          <div className="mobile-drawer-body">
            {/* User Info */}
            {currentUser && (
              <div className="mobile-user-card" style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{currentUser.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{currentUser.roleTitle}</div>
              </div>
            )}

            {/* Management Portal */}
            <div className="mobile-drawer-section">
              <div className="mobile-drawer-section-title">Management Portal</div>
              <button
                type="button"
                className={`mobile-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleNavClick('management', 'dashboard')}
              >
                <LayoutDashboard className="icon-sm text-gold" />
                📊 Dashboard
              </button>
              <button
                type="button"
                className={`mobile-nav-btn ${activeTab === 'grid' ? 'active' : ''}`}
                onClick={() => handleNavClick('management', 'grid')}
              >
                <Calendar className="icon-sm" />
                Master Schedule Grid
              </button>
              <button
                type="button"
                className={`mobile-nav-btn ${activeTab === 'calendar_grid' ? 'active' : ''}`}
                onClick={() => handleNavClick('management', 'calendar_grid')}
              >
                <Calendar className="icon-sm text-gold" />
                📅 Date-Wise Calendar
              </button>
              <button
                type="button"
                className={`mobile-nav-btn ${activeTab === 'search' ? 'active' : ''}`}
                onClick={() => handleNavClick('management', 'search')}
              >
                <Search className="icon-sm" />
                Multi-Day Search
              </button>
              <button
                type="button"
                className={`mobile-nav-btn ${activeTab === 'daily_demo_slots' ? 'active' : ''}`}
                onClick={() => handleNavClick('management', 'daily_demo_slots')}
              >
                <Clock className="icon-sm text-gold" />
                🔁 Daily Slots 2.0
              </button>
              <button
                type="button"
                className={`mobile-nav-btn ${activeTab === 'sameday_demo_tracker' ? 'active' : ''}`}
                onClick={() => handleNavClick('management', 'sameday_demo_tracker')}
              >
                <Zap className="icon-sm text-amber" />
                ⚡ Same-Day Tracker
              </button>
              <button
                type="button"
                className={`mobile-nav-btn ${activeTab === 'trainers' ? 'active' : ''}`}
                onClick={() => handleNavClick('management', 'trainers')}
              >
                <Briefcase className="icon-sm text-amber" />
                👑 Trainers Roster
              </button>
              <button
                type="button"
                className={`mobile-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => handleNavClick('management', 'profile')}
              >
                <User className="icon-sm" />
                Coach Profiles
              </button>
            </div>

            {/* Admin Portal */}
            {currentRole !== 'salesperson' && (
              <div className="mobile-drawer-section">
                <div className="mobile-drawer-section-title">Admin Portal</div>
                <button
                  type="button"
                  className={`mobile-nav-btn ${activeTab === 'shifts' ? 'active' : ''}`}
                  onClick={() => handleNavClick('admin', 'shifts')}
                >
                  <Settings className="icon-sm" />
                  Shift Master
                </button>
                {currentRole === 'admin' && (
                  <>
                    <button
                      type="button"
                      className={`mobile-nav-btn ${activeTab === 'onboard' ? 'active' : ''}`}
                      onClick={() => handleNavClick('admin', 'onboard')}
                    >
                      <PlusCircle className="icon-sm" />
                      Onboard New Coach
                    </button>
                    <button
                      type="button"
                      className={`mobile-nav-btn ${activeTab === 'users' ? 'active' : ''}`}
                      onClick={() => handleNavClick('admin', 'users')}
                    >
                      <KeyRound className="icon-sm text-gold" />
                      User Management
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className={`mobile-nav-btn ${activeTab === 'audit' ? 'active' : ''}`}
                  onClick={() => handleNavClick('admin', 'audit')}
                >
                  <AlertTriangle className="icon-sm text-red" />
                  Conflict Diagnostics
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
