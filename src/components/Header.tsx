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
  ShieldCheck, 
  Briefcase,
  Menu,
  X
} from 'lucide-react';
import type { Role, AuthUser } from '../types';
import { LogOut } from 'lucide-react';

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
  onResetDatabase
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
            <button 
              type="button" 
              className="mobile-menu-toggle"
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              aria-label="Toggle Mobile Menu"
            >
              {isDrawerOpen ? <X className="icon" /> : <Menu className="icon" />}
            </button>
            <div className="brand-logo">
              <span>♟️</span>
            </div>
            <div>
              <h1 className="app-title">Upstep Coach Scheduler</h1>
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
              <div className="metric-pill red badge-pulse">
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

        {/* Main Portal Switcher Tabs */}
        <div className="header-nav-container">
          <div className="portal-switcher">
            <button
              type="button"
              className={`portal-btn ${activePortal === 'management' ? 'active' : ''}`}
              onClick={() => {
                setActivePortal('management');
                setActiveTab(currentRole === 'salesperson' ? 'sameday_demo_tracker' : 'grid');
              }}
            >
              <Briefcase className="icon-sm" />
              {currentRole === 'salesperson' ? 'Sales Portal' : 'Management Portal'}
            </button>

            {currentRole !== 'salesperson' && (
              <button
                type="button"
                className={`portal-btn ${activePortal === 'admin' ? 'active' : ''}`}
                onClick={() => {
                  setActivePortal('admin');
                  setActiveTab('shifts');
                }}
              >
                <ShieldCheck className="icon-sm" />
                Admin Portal
              </button>
            )}
          </div>

          {/* Sub Navigation */}
          <nav className="sub-nav">
            {currentRole === 'salesperson' ? (
              /* Salesperson view — ONLY Same Day Demo & Demo Slots */
              <>
                <button
                  type="button"
                  className={`sub-nav-btn ${activeTab === 'sameday_demo_tracker' ? 'active' : ''}`}
                  onClick={() => setActiveTab('sameday_demo_tracker')}
                >
                  <AlertTriangle className="icon-sm text-amber" />
                  ⚡ Same-Day Demo Tracker & Requests
                </button>
                <button
                  type="button"
                  className={`sub-nav-btn ${activeTab === 'daily_demo_slots' ? 'active' : ''}`}
                  onClick={() => setActiveTab('daily_demo_slots')}
                >
                  <Clock className="icon-sm text-gold" />
                  🔁 Daily Demo Slots 2.0
                </button>
              </>
            ) : activePortal === 'management' ? (
              <>
                <button
                  type="button"
                  className={`sub-nav-btn ${activeTab === 'grid' ? 'active' : ''}`}
                  onClick={() => setActiveTab('grid')}
                >
                  <Calendar className="icon-sm" />
                  Master Schedule Grid
                </button>
                <button
                  type="button"
                  className={`sub-nav-btn ${activeTab === 'calendar_grid' ? 'active' : ''}`}
                  onClick={() => setActiveTab('calendar_grid')}
                >
                  <Calendar className="icon-sm text-gold" />
                  📅 Date-Wise Calendar Grid
                </button>
                <button
                  type="button"
                  className={`sub-nav-btn ${activeTab === 'search' ? 'active' : ''}`}
                  onClick={() => setActiveTab('search')}
                >
                  <Search className="icon-sm" />
                  Multi-Day Availability Finder
                </button>
                <button
                  type="button"
                  className={`sub-nav-btn ${activeTab === 'daily_demo_slots' ? 'active' : ''}`}
                  onClick={() => setActiveTab('daily_demo_slots')}
                >
                  <Clock className="icon-sm text-gold" />
                  🔁 Daily Slots 2.0 (Demo Slots)
                </button>
                <button
                  type="button"
                  className={`sub-nav-btn ${activeTab === 'sameday_demo_tracker' ? 'active' : ''}`}
                  onClick={() => setActiveTab('sameday_demo_tracker')}
                >
                  <AlertTriangle className="icon-sm text-amber" />
                  ⚡ Same-Day Demo Tracker
                </button>
                <button
                  type="button"
                  className={`sub-nav-btn ${activeTab === 'trainers' ? 'active' : ''}`}
                  onClick={() => setActiveTab('trainers')}
                >
                  <Briefcase className="icon-sm text-amber" />
                  👑 Trainers Roster
                </button>

                <button
                  type="button"
                  className={`sub-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <User className="icon-sm" />
                  Coach Profiles & Schedules
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={`sub-nav-btn ${activeTab === 'shifts' ? 'active' : ''}`}
                  onClick={() => setActiveTab('shifts')}
                >
                  <Settings className="icon-sm" />
                  Custom Shift Template Builder
                </button>
                <button
                  type="button"
                  className={`sub-nav-btn ${activeTab === 'onboard' ? 'active' : ''}`}
                  onClick={() => setActiveTab('onboard')}
                >
                  <PlusCircle className="icon-sm" />
                  Onboard New Coach
                </button>
                <button
                  type="button"
                  className={`sub-nav-btn ${activeTab === 'audit' ? 'active' : ''}`}
                  onClick={() => setActiveTab('audit')}
                >
                  <AlertTriangle className="icon-sm" />
                  Conflict Diagnostic Audit
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Mobile Slide-Out Navigation Drawer */}
      <div 
        className={`mobile-drawer-overlay ${isDrawerOpen ? 'open' : ''}`}
        onClick={() => setIsDrawerOpen(false)}
      >
        <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
          <div className="mobile-drawer-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>♟️</span>
              <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Upstep Operations</span>
            </div>
            <button 
              type="button" 
              className="icon-button"
              onClick={() => setIsDrawerOpen(false)}
            >
              <X className="icon" />
            </button>
          </div>

          <div className="mobile-drawer-body">
            {/* System Preferences */}
            <div className="mobile-drawer-section">
              <div className="mobile-drawer-section-title">Preferences & Role</div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select 
                  value={currentRole} 
                  onChange={(e) => setCurrentRole(e.target.value as Role)}
                  className="select-input"
                  style={{ flex: 1 }}
                >
                  <option value="admin">System Admin</option>
                  <option value="manager">Ops Manager</option>
                  <option value="rm">Relationship Manager</option>
                </select>
                <button 
                  type="button" 
                  onClick={() => setDarkMode(!darkMode)} 
                  className="icon-button"
                >
                  {darkMode ? <Sun className="icon text-amber" /> : <Moon className="icon" />}
                </button>
              </div>
            </div>

            {/* Management Portal */}
            <div className="mobile-drawer-section">
              <div className="mobile-drawer-section-title">Management Portal</div>
              <button
                type="button"
                className={`mobile-nav-btn ${activePortal === 'management' && activeTab === 'grid' ? 'active' : ''}`}
                onClick={() => handleNavClick('management', 'grid')}
              >
                <Calendar className="icon-sm" />
                Master Schedule Grid
              </button>
              <button
                type="button"
                className={`mobile-nav-btn ${activePortal === 'management' && activeTab === 'calendar_grid' ? 'active' : ''}`}
                onClick={() => handleNavClick('management', 'calendar_grid')}
              >
                <Calendar className="icon-sm text-gold" />
                📅 Date-Wise Calendar
              </button>
              <button
                type="button"
                className={`mobile-nav-btn ${activePortal === 'management' && activeTab === 'search' ? 'active' : ''}`}
                onClick={() => handleNavClick('management', 'search')}
              >
                <Search className="icon-sm" />
                Multi-Day Search
              </button>
              <button
                type="button"
                className={`mobile-nav-btn ${activePortal === 'management' && activeTab === 'daily_demo_slots' ? 'active' : ''}`}
                onClick={() => handleNavClick('management', 'daily_demo_slots')}
              >
                <Clock className="icon-sm text-gold" />
                🔁 Daily Slots 2.0
              </button>
              <button
                type="button"
                className={`mobile-nav-btn ${activePortal === 'management' && activeTab === 'sameday_demo_tracker' ? 'active' : ''}`}
                onClick={() => handleNavClick('management', 'sameday_demo_tracker')}
              >
                <AlertTriangle className="icon-sm text-amber" />
                ⚡ Same-Day Tracker
              </button>
              <button
                type="button"
                className={`mobile-nav-btn ${activePortal === 'management' && activeTab === 'trainers' ? 'active' : ''}`}
                onClick={() => handleNavClick('management', 'trainers')}
              >
                <Briefcase className="icon-sm text-amber" />
                👑 Trainers Roster
              </button>
              <button
                type="button"
                className={`mobile-nav-btn ${activePortal === 'management' && activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => handleNavClick('management', 'profile')}
              >
                <User className="icon-sm" />
                Coach Profiles
              </button>
            </div>

            {/* Admin Portal */}
            <div className="mobile-drawer-section">
              <div className="mobile-drawer-section-title">Admin Portal</div>
              <button
                type="button"
                className={`mobile-nav-btn ${activePortal === 'admin' && activeTab === 'shifts' ? 'active' : ''}`}
                onClick={() => handleNavClick('admin', 'shifts')}
              >
                <Settings className="icon-sm" />
                Custom Shift Builder
              </button>
              <button
                type="button"
                className={`mobile-nav-btn ${activePortal === 'admin' && activeTab === 'onboard' ? 'active' : ''}`}
                onClick={() => handleNavClick('admin', 'onboard')}
              >
                <PlusCircle className="icon-sm" />
                Onboard New Coach
              </button>
              <button
                type="button"
                className={`mobile-nav-btn ${activePortal === 'admin' && activeTab === 'audit' ? 'active' : ''}`}
                onClick={() => handleNavClick('admin', 'audit')}
              >
                <AlertTriangle className="icon-sm" />
                Conflict Diagnostic Audit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="bottom-nav-bar">
        <button
          type="button"
          className={`bottom-nav-item ${activePortal === 'management' && activeTab === 'grid' ? 'active' : ''}`}
          onClick={() => {
            setActivePortal('management');
            setActiveTab('grid');
          }}
        >
          <Calendar className="icon" />
          <span>Grid</span>
        </button>
        <button
          type="button"
          className={`bottom-nav-item ${activePortal === 'management' && activeTab === 'daily_demo_slots' ? 'active' : ''}`}
          onClick={() => {
            setActivePortal('management');
            setActiveTab('daily_demo_slots');
          }}
        >
          <Clock className="icon" />
          <span>Daily Demos</span>
        </button>
        <button
          type="button"
          className={`bottom-nav-item ${activePortal === 'management' && activeTab === 'trainers' ? 'active' : ''}`}
          onClick={() => {
            setActivePortal('management');
            setActiveTab('trainers');
          }}
        >
          <Briefcase className="icon" />
          <span>Trainers</span>
        </button>
        <button
          type="button"
          className={`bottom-nav-item ${activePortal === 'management' && activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => {
            setActivePortal('management');
            setActiveTab('profile');
          }}
        >
          <User className="icon" />
          <span>Profiles</span>
        </button>
        <button
          type="button"
          className={`bottom-nav-item ${activePortal === 'admin' && activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => {
            setActivePortal('admin');
            setActiveTab('audit');
          }}
        >
          <AlertTriangle className="icon" />
          <span>Audit</span>
        </button>
      </div>
    </>
  );
};

