import React, { useMemo } from 'react';
import { 
  Users, 
  Briefcase, 
  Calendar, 
  CalendarDays,
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  ChevronRight
} from 'lucide-react';
import type { Coach, Slot, ConflictReport } from '../types';
import { timeToMinutes } from '../utils/shiftUtils';

interface DashboardProps {
  coaches: Coach[];
  slots: Slot[];
  conflicts: ConflictReport[];
  setActiveTab: (tab: string) => void;
  setActivePortal: (portal: 'management' | 'admin') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  coaches,
  slots,
  conflicts,
  setActiveTab,
  setActivePortal
}) => {
  // 1. Calculate Live KPIs
  const activeCoachesCount = coaches.filter(c => c.is_active !== false).length;
  
  const coachesOnShift = useMemo(() => {
    const onShiftIds = new Set<number>();
    slots.forEach(s => {
      if (s.status_type === 'SCHEDULED_CLASS' || s.status_type === 'DEMO_CLASS' || s.status_type === 'TEMPORARY_CLASS') {
        onShiftIds.add(s.coach_id);
      }
    });
    return onShiftIds.size || coaches.length;
  }, [slots, coaches]);

  const availableSlotsCount = useMemo(() => {
    return slots.filter(s => s.status_type === 'AVAILABLE').length;
  }, [slots]);

  const demoSlotsAvailable = useMemo(() => {
    return slots.filter(s => s.status_type === 'DEMO_CLASS').length;
  }, [slots]);

  // 2. Health score gauge calculation (0-100%)
  const healthPercentage = useMemo(() => {
    const totalSlots = slots.length;
    if (totalSlots === 0) return 100;
    const conflictRatio = conflicts.length / (coaches.length || 10);
    const pct = Math.max(65, Math.round(100 - (conflictRatio * 100)));
    return Math.min(100, pct);
  }, [slots, conflicts, coaches]);

  // 3. Shift distribution counts
  const shiftDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    coaches.forEach(c => {
      const coachSlots = slots.filter(s => s.coach_id === c.id);
      const shiftName = coachSlots.length > 0 ? coachSlots[0].shift_name : (c.shift_type || 'Shift5-FT');
      counts[shiftName] = (counts[shiftName] || 0) + 1;
    });
    
    const total = coaches.length || 1;
    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        pct: Math.round((value / total) * 100)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [coaches, slots]);

  // 4. Heatmap Availability Engine (Mon-Fri vs 6 Time Blocks)
  const heatmapData = useMemo(() => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeBlocks = [
      { label: '12 AM - 4 AM', minMins: 0, maxMins: 4 * 60 },
      { label: '4 AM - 8 AM', minMins: 4 * 60, maxMins: 8 * 60 },
      { label: '8 AM - 12 PM', minMins: 8 * 60, maxMins: 12 * 60 },
      { label: '12 PM - 4 PM', minMins: 12 * 60, maxMins: 16 * 60 },
      { label: '4 PM - 8 PM', minMins: 16 * 60, maxMins: 20 * 60 },
      { label: '8 PM - 12 AM', minMins: 20 * 60, maxMins: 24 * 60 }
    ];

    const grid = timeBlocks.map(block => {
      const row: Record<string, { count: number; pct: number; level: 'high' | 'good' | 'medium' | 'low' }> = {};
      
      days.forEach(day => {
        const daySlots = slots.filter(s => s.day_of_week === day);
        const slotsInBlock = daySlots.filter(s => {
          const m = timeToMinutes(s.start_time);
          return m >= block.minMins && m < block.maxMins;
        });

        const totalSlotsInBlock = slotsInBlock.length || 1;
        const availableInBlock = slotsInBlock.filter(s => s.status_type === 'AVAILABLE').length;
        const pct = Math.round((availableInBlock / totalSlotsInBlock) * 100);

        let level: 'high' | 'good' | 'medium' | 'low' = 'low';
        if (pct >= 75) level = 'high';
        else if (pct >= 50) level = 'good';
        else if (pct >= 25) level = 'medium';

        row[day] = { count: availableInBlock, pct, level };
      });

      return {
        timeLabel: block.label,
        days: row
      };
    });

    return grid;
  }, [slots]);

  const handleConflictClick = () => {
    setActivePortal('admin');
    setActiveTab('audit');
  };

  return (
    <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. Metrics Grid */}
      <div className="dashboard-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        
        {/* Metric 1 */}
        <div className="metric-card-premium" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', padding: '1.15rem', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="metric-label-premium" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Coaches</span>
            <Users className="icon-sm" style={{ color: 'var(--accent-blue)' }} />
          </div>
          <span className="metric-value-premium font-bold" style={{ fontSize: '1.6rem', lineHeight: 1.2 }}>{activeCoachesCount}</span>
          <span className="metric-trend" style={{ fontSize: '0.72rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <TrendingUp className="icon-xs" style={{ width: '12px', height: '12px' }} /> 100% Operational Roster
          </span>
        </div>

        {/* Metric 2 */}
        <div className="metric-card-premium" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', padding: '1.15rem', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="metric-label-premium" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Shifts</span>
            <Briefcase className="icon-sm" style={{ color: 'var(--accent-purple)' }} />
          </div>
          <span className="metric-value-premium font-bold" style={{ fontSize: '1.6rem', lineHeight: 1.2 }}>{coachesOnShift}</span>
          <span className="metric-trend" style={{ fontSize: '0.72rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <TrendingUp className="icon-xs" style={{ width: '12px', height: '12px' }} /> 7 Standard Regimes
          </span>
        </div>

        {/* Metric 3 */}
        <div className="metric-card-premium" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', padding: '1.15rem', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="metric-label-premium" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Available Slots</span>
            <Calendar className="icon-sm" style={{ color: 'var(--accent-green)' }} />
          </div>
          <span className="metric-value-premium font-bold" style={{ fontSize: '1.6rem', lineHeight: 1.2 }}>{availableSlotsCount}</span>
          <span className="metric-trend" style={{ fontSize: '0.72rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <TrendingUp className="icon-xs" style={{ width: '12px', height: '12px' }} /> Ready for Bookings
          </span>
        </div>

        {/* Metric 4 */}
        <div className="metric-card-premium" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', padding: '1.15rem', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="metric-label-premium" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>DST Conflicts</span>
            <AlertTriangle className="icon-sm" style={{ color: 'var(--accent-red)' }} />
          </div>
          <span className="metric-value-premium font-bold" style={{ fontSize: '1.6rem', lineHeight: 1.2, color: conflicts.length > 0 ? 'var(--accent-red)' : 'inherit' }}>{conflicts.length}</span>
          <span className="metric-trend" style={{ fontSize: '0.72rem', color: conflicts.length > 0 ? 'var(--accent-red)' : '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            {conflicts.length > 0 ? '⚠️ Action Required' : '✅ Healthy'}
          </span>
        </div>

        {/* Metric 5 */}
        <div className="metric-card-premium" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', padding: '1.15rem', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="metric-label-premium" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Demo Slots (20m)</span>
            <Clock className="icon-sm" style={{ color: 'var(--accent-gold)' }} />
          </div>
          <span className="metric-value-premium font-bold" style={{ fontSize: '1.6rem', lineHeight: 1.2 }}>{demoSlotsAvailable}</span>
          <span className="metric-trend" style={{ fontSize: '0.72rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            ⚡ Split Sub-slots Ready
          </span>
        </div>

        {/* Metric 6: Quick Link to Date-Wise Calendar Grid */}
        <div 
          className="metric-card-premium" 
          onClick={() => { setActivePortal('management'); setActiveTab('calendar_grid'); }}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', padding: '1.15rem', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(147, 51, 234, 0.15))', border: '1px solid var(--accent-blue)', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="metric-label-premium" style={{ fontSize: '0.8rem', color: '#93c5fd', fontWeight: 700 }}>Calendar View</span>
            <CalendarDays className="icon-sm" style={{ color: '#60a5fa' }} />
          </div>
          <span className="metric-value-premium font-bold" style={{ fontSize: '1.15rem', lineHeight: 1.3, color: '#ffffff' }}>Slide-Expand Grid →</span>
          <span className="metric-trend" style={{ fontSize: '0.72rem', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            📅 7/14/Day Interactive View
          </span>
        </div>
      </div>

      {/* 2. Visual Analytics Row */}
      <div className="dashboard-charts-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Health Gauge */}
        <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', borderRadius: '14px' }}>
          <h3 style={{ fontFamily: 'var(--heading-font)', fontSize: '1.05rem', fontWeight: 700 }}>Schedule Health</h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '1rem 0' }}>
            <div style={{ position: 'relative', width: '130px', height: '130px' }}>
              <svg width="100%" height="100%" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  stroke="var(--accent-green)" 
                  strokeWidth="8" 
                  fill="transparent" 
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - healthPercentage / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--heading-font)' }}>{healthPercentage}%</span>
                <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>Healthy</span>
              </div>
            </div>
            <p className="text-center" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1.25rem', maxWidth: '240px' }}>
              Great! Your operations and master shift schedule is healthy and operational.
            </p>
          </div>
        </div>

        {/* Shift Distribution Donut */}
        <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', borderRadius: '14px' }}>
          <h3 style={{ fontFamily: 'var(--heading-font)', fontSize: '1.05rem', fontWeight: 700 }}>Shift-wise Coach Distribution</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
            
            {/* Donut Chart visual */}
            <div style={{ position: 'relative', width: '110px', height: '110px', borderRadius: '50%', background: 'conic-gradient(var(--accent-blue) 0% 30%, var(--accent-purple) 30% 60%, var(--accent-gold) 60% 80%, var(--accent-green) 80% 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: '65px', height: '65px', borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--heading-font)' }}>{coaches.length}</span>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Coaches</span>
              </div>
            </div>

            {/* Distribution Legend List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', flex: 1, fontSize: '0.76rem' }}>
              {shiftDistribution.map((s, idx) => {
                const colors = ['var(--accent-blue)', 'var(--accent-purple)', 'var(--accent-gold)', 'var(--accent-green)', 'var(--accent-orange)', 'var(--accent-red)'];
                const itemColor = colors[idx % colors.length];
                return (
                  <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: itemColor }}></span>
                      <span className="font-medium" style={{ color: 'var(--text-muted)' }}>{s.name}</span>
                    </div>
                    <span className="font-bold" style={{ color: 'var(--text-main)' }}>{s.value} ({s.pct}%)</span>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

      </div>

      {/* 3. Availability Heatmap */}
      <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', borderRadius: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ fontFamily: 'var(--heading-font)', fontSize: '1.05rem', fontWeight: 700 }}>Weekly Availability Heatmap (All Shifts)</h3>
          
          {/* Heatmap Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.72rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'rgba(16, 185, 129, 0.4)' }}></span>
              <span>High (75%+)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'rgba(59, 130, 246, 0.3)' }}></span>
              <span>Good (50%-75%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'rgba(245, 158, 11, 0.25)' }}></span>
              <span>Medium (25%-50%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'rgba(244, 63, 94, 0.2)' }}></span>
              <span>Low (&lt;25%)</span>
            </div>
          </div>
        </div>

        {/* Heatmap Table Grid */}
        <div className="table-responsive" style={{ border: '1px solid var(--border-color)', borderRadius: '10px' }}>
          <table className="master-grid-table" style={{ tableLayout: 'auto' }}>
            <thead>
              <tr style={{ background: 'rgba(9, 14, 26, 0.3)' }}>
                <th style={{ padding: '0.65rem 1rem', width: '150px' }}>Time Block</th>
                <th className="col-center">Mon</th>
                <th className="col-center">Tue</th>
                <th className="col-center">Wed</th>
                <th className="col-center">Thu</th>
                <th className="col-center">Fri</th>
              </tr>
            </thead>
            <tbody>
              {heatmapData.map((row) => (
                <tr key={row.timeLabel} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td className="font-medium" style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', background: 'rgba(9, 14, 26, 0.15)' }}>{row.timeLabel}</td>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                    const cell = row.days[day];
                    let cellBg = 'rgba(244, 63, 94, 0.08)';
                    let cellColor = '#fda4af';
                    
                    if (cell.level === 'high') {
                      cellBg = 'rgba(16, 185, 129, 0.15)';
                      cellColor = '#34d399';
                    } else if (cell.level === 'good') {
                      cellBg = 'rgba(59, 130, 246, 0.15)';
                      cellColor = '#60a5fa';
                    } else if (cell.level === 'medium') {
                      cellBg = 'rgba(245, 158, 11, 0.12)';
                      cellColor = '#fbbf24';
                    }

                    return (
                      <td 
                        key={day} 
                        className="col-center" 
                        style={{ 
                          padding: '0.6rem', 
                          background: cellBg, 
                          color: cellColor, 
                          fontWeight: 700, 
                          fontSize: '0.76rem',
                          borderRight: '1px solid var(--border-color)',
                          borderBottom: '1px solid var(--border-color)'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span>{cell.pct}%</span>
                          <span style={{ fontSize: '0.6rem', opacity: 0.7, fontWeight: 'normal' }}>({cell.count} free)</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* 4. Conflict Diagnostic Queue */}
      <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', borderRadius: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: 'var(--heading-font)', fontSize: '1.05rem', fontWeight: 700 }}>Schedule Conflict Diagnostics (Top Active)</h3>
          {conflicts.length > 0 && (
            <button 
              type="button" 
              onClick={handleConflictClick}
              className="btn-secondary-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--accent-blue)' }}
            >
              View all {conflicts.length} <ChevronRight className="icon-sm" />
            </button>
          )}
        </div>

        <div className="table-responsive" style={{ border: '1px solid var(--border-color)', borderRadius: '10px' }}>
          <table className="master-grid-table" style={{ tableLayout: 'auto' }}>
            <thead>
              <tr style={{ background: 'rgba(9, 14, 26, 0.3)' }}>
                <th style={{ padding: '0.65rem 1rem' }}>Conflict ID</th>
                <th>Coach</th>
                <th>Day</th>
                <th>Issue Description</th>
                <th className="col-center">Severity</th>
                <th className="col-center">Conflicting Slot</th>
                <th className="col-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {conflicts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="no-data-cell" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    ✅ Great news! No active conflicts detected across the schedule.
                  </td>
                </tr>
              ) : (
                conflicts.slice(0, 5).map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="font-medium font-mono" style={{ padding: '0.75rem 1rem', color: 'var(--accent-blue)', fontSize: '0.76rem' }}>
                      {c.id}
                    </td>
                    <td className="font-bold">{c.coach_name}</td>
                    <td className="font-bold">{c.day}</td>
                    <td style={{ fontSize: '0.76rem', color: 'var(--text-muted)', maxWidth: '280px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={c.description}>
                      {c.description}
                    </td>
                    <td className="col-center">
                      <span className={`badge-pill ${c.type === 'OVERLAP' ? 'red' : 'orange'}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>
                        {c.type === 'OVERLAP' ? 'HIGH' : 'MEDIUM'}
                      </span>
                    </td>
                    <td className="col-center" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {c.slot1 || 'N/A'}
                    </td>
                    <td className="col-center">
                      <span className="status-pill-badge" style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.25)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem' }}>
                        Action Required
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
