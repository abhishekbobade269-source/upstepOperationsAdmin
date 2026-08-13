import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  CalendarDays,
  Clock, 
  Settings, 
  User, 
  UserPlus,
  AlertTriangle, 
  Search, 
  Briefcase, 
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Zap,
  KeyRound
} from 'lucide-react';
import type { Role, AuthUser } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activePortal: 'management' | 'admin';
  setActivePortal: (portal: 'management' | 'admin') => void;
  conflictsCount: number;
  currentRole: Role;
  currentUser: AuthUser | null;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  activePortal,
  setActivePortal,
  conflictsCount,
  currentRole,
  currentUser,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const isSales = currentRole === 'salesperson';
  const isManager = currentRole === 'manager';
  const isAdmin = currentRole === 'admin';

  // Management Portal Menu Items
  const managementItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, visible: !isSales },
    { id: 'grid', label: 'Master Schedule Grid', icon: Calendar, visible: !isSales },
    { id: 'calendar_grid', label: 'Date-Wise Calendar', icon: CalendarDays, visible: !isSales },
    { id: 'daily_demo_slots', label: 'Daily Slots 2.0', icon: Clock, visible: !isSales },
    { id: 'sameday_demo_tracker', label: 'Same-Day Demo Tracker', icon: Zap, visible: true },
    { id: 'profile', label: 'Coach Profiles', icon: User, visible: !isSales },
    { id: 'search', label: 'Multi-Day Finder', icon: Search, visible: !isSales },
    { id: 'trainers', label: 'Trainers Roster', icon: Briefcase, visible: !isSales },
  ];

  // Admin Portal Menu Items
  const adminItems = [
    { id: 'shifts', label: 'Shift Master', icon: Settings, visible: !isSales },
    { id: 'onboard', label: 'Onboard Coach', icon: UserPlus, visible: !isSales && !isManager },
    { id: 'audit', label: 'DST Review', icon: AlertTriangle, badge: conflictsCount, visible: !isSales },
    { id: 'users', label: 'User Management', icon: KeyRound, visible: isAdmin },
  ];

  const handleNavClick = (itemId: string, portal: 'management' | 'admin') => {
    setActiveTab(itemId);
    setActivePortal(portal);
  };

  return (
    <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon">♟️</div>
        {!isCollapsed && (
          <div className="brand-text">
            <h2>Upstep Operations</h2>
            <span>OPERATIONS ADMIN</span>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        {/* MANAGEMENT PORTAL SECTION */}
        {managementItems.some(i => i.visible) && (
          <>
            {!isCollapsed && <div className="nav-section-title">Management Portal</div>}
            {managementItems.filter(item => item.visible).map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id && activePortal === 'management';
              
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id, 'management')}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="nav-icon" />
                  {!isCollapsed && <span className="nav-label">{item.label}</span>}
                </button>
              );
            })}
          </>
        )}

        {/* ADMIN PORTAL SECTION */}
        {adminItems.some(i => i.visible) && (
          <>
            {!isCollapsed && <div className="nav-section-title" style={{ marginTop: '1.25rem' }}>Admin Portal</div>}
            {adminItems.filter(item => item.visible).map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id && activePortal === 'admin';
              
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id, 'admin')}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="nav-icon" />
                  {!isCollapsed && <span className="nav-label">{item.label}</span>}
                  {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                </button>
              );
            })}
          </>
        )}
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        {!isCollapsed && currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.65rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.74rem' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.7rem', color: '#fff' }}>
              {currentUser.name.charAt(0)}
            </div>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{currentUser.name}</div>
              <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>{currentUser.roleTitle}</div>
            </div>
          </div>
        )}

        {!isCollapsed && (
          <div className="support-box">
            <HelpCircle className="support-icon" />
            <div>
              <h4>Need help?</h4>
              <a href="#support" onClick={e => { e.preventDefault(); alert("Upstep Operations Support: support@upstepacademy.com"); }}>Contact Support</a>
            </div>
          </div>
        )}

        {onToggleCollapse && (
          <button 
            type="button" 
            className="sidebar-collapse-pill" 
            onClick={onToggleCollapse}
            title={isCollapsed ? "Expand sidebar (Click to expand)" : "Collapse sidebar (Click to collapse)"}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="icon-sm" />
            ) : (
              <>
                <ChevronLeft className="icon-sm" />
                <span>Collapse Sidebar</span>
              </>
            )}
          </button>
        )}
      </div>
    </aside>
  );
};
