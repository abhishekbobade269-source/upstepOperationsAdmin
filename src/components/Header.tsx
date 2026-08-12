import React from 'react';
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
  Briefcase 
} from 'lucide-react';
import type { Role } from '../types';

interface HeaderProps {
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
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
  activePortal,
  setActivePortal,
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  metrics,
  onResetDatabase
}) => {
  return (
    <header className="app-header">
      {/* Top Bar */}
      <div className="header-top">
        <div className="brand-section">
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
          {onResetDatabase && (
            <button
              type="button"
              onClick={() => {
                if (confirm("Are you sure you want to reset the scheduler database back to the default initial mock data? This deletes all your custom shifts, edits, and bookings.")) {
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
              setActiveTab('grid');
            }}
          >
            <Briefcase className="icon-sm" />
            Management Portal
          </button>
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
        </div>

        {/* Sub Navigation */}
        <nav className="sub-nav">
          {activePortal === 'management' ? (
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
  );
};
