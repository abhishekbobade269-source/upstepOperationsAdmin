import React, { useState, useMemo, useEffect } from 'react';
import type { Slot, Coach, ConflictReport } from '../types';
import { Search, AlertTriangle } from 'lucide-react';
import { timeToMinutes } from '../utils/shiftUtils';
import { isTrainerOrHeadTrainer } from '../utils/trainerUtils';

interface ScheduleGridProps {
  coaches: Coach[];
  slots: Slot[];
  conflicts?: ConflictReport[];
  highlightedCoachTarget?: { coachName: string; day?: string } | null;
  onSelectSlot: (slot: Slot) => void;
  onOpenBookingModal: (coach: Coach, day: string, startTime: string, endTime: string) => void;
  onSwitchToCalendarView?: () => void;
}

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  coaches,
  slots,
  conflicts = [],
  highlightedCoachTarget = null,
  onSelectSlot,
  onOpenBookingModal,
  onSwitchToCalendarView
}) => {
  const [viewMode, setViewMode] = useState<'weekdays' | 'weekend'>(() => {
    const saved = localStorage.getItem('upstep_grid_view_mode');
    return (saved as 'weekdays' | 'weekend') || 'weekdays';
  });
  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem('upstep_grid_search') || '');
  const [selectedRm, setSelectedRm] = useState(() => localStorage.getItem('upstep_grid_rm') || 'ALL');
  const [selectedShift, setSelectedShift] = useState(() => localStorage.getItem('upstep_grid_shift') || 'ALL');
  const [selectedShiftType, setSelectedShiftType] = useState(() => localStorage.getItem('upstep_grid_shifttype') || 'ALL');
  const [selectedTier, setSelectedTier] = useState(() => localStorage.getItem('upstep_grid_tier') || 'ALL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'ALL' | 'COACHES' | 'TRAINERS'>('ALL');
  const [highlightConflicts, setHighlightConflicts] = useState<boolean>(true);

  // Spreadsheet Pagination States (Ported from Next.js project pagination flow)
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = localStorage.getItem('upstep_grid_page');
    return saved ? parseInt(saved, 10) : 1;
  });
  const coachesPerPage = 20;

  useEffect(() => {
    if (highlightedCoachTarget?.coachName) {
      setSearchQuery(highlightedCoachTarget.coachName);
      setCurrentPage(1);
    }
  }, [highlightedCoachTarget]);

  useEffect(() => { localStorage.setItem('upstep_grid_view_mode', viewMode); }, [viewMode]);
  useEffect(() => { localStorage.setItem('upstep_grid_search', searchQuery); }, [searchQuery]);
  useEffect(() => { localStorage.setItem('upstep_grid_rm', selectedRm); }, [selectedRm]);
  useEffect(() => { localStorage.setItem('upstep_grid_shift', selectedShift); }, [selectedShift]);
  useEffect(() => { localStorage.setItem('upstep_grid_shifttype', selectedShiftType); }, [selectedShiftType]);
  useEffect(() => { localStorage.setItem('upstep_grid_tier', selectedTier); }, [selectedTier]);
  useEffect(() => { localStorage.setItem('upstep_grid_page', currentPage.toString()); }, [currentPage]);

  const daysToDisplay = useMemo(() => {
    return viewMode === 'weekdays' 
      ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      : ['Saturday', 'Sunday'];
  }, [viewMode]);

  // Extract distinct RM Names & Shift Names for dropdowns
  const rmNames = useMemo(() => {
    const rms = new Set<string>();
    slots.forEach(s => { if (s.rm_name) rms.add(s.rm_name); });
    return Array.from(rms).sort();
  }, [slots]);

  const shiftNames = useMemo(() => {
    const shifts = new Set<string>();
    slots.forEach(s => { if (s.shift_name) shifts.add(s.shift_name); });
    return Array.from(shifts).sort();
  }, [slots]);

  // Filter coaches
  const filteredCoaches = useMemo(() => {
    return coaches.filter(c => {
      const isTrn = isTrainerOrHeadTrainer(c);
      
      let matchesRole = true;
      if (selectedRoleFilter === 'COACHES') matchesRole = !isTrn;
      if (selectedRoleFilter === 'TRAINERS') matchesRole = isTrn;

      const matchesName = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.sf_coach_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTier = selectedTier === 'ALL' || c.tier === selectedTier;
      const matchesRM = selectedRm === 'ALL' || c.trainer_manager === selectedRm;
      
      const matchesShiftType = selectedShiftType === 'ALL' ||
        (selectedShiftType === '2' && (c.shift_days === 2 || c.shift_type === 'Night Shift')) ||
        (selectedShiftType === '1' && (c.shift_days === 1 || c.shift_type === 'Day Shift' || !c.shift_days));

      // If a specific shift is selected, verify the coach has slots assigned to that shift
      let matchesShift = true;
      if (selectedShift !== 'ALL') {
        matchesShift = slots.some(s => s.coach_id === c.id && s.shift_name === selectedShift);
      }

      return matchesRole && matchesName && matchesTier && matchesRM && matchesShift && matchesShiftType;
    });
  }, [coaches, slots, searchQuery, selectedRoleFilter, selectedTier, selectedRm, selectedShift, selectedShiftType]);

  // Calculate paginated subset
  const totalPages = Math.max(1, Math.ceil(filteredCoaches.length / coachesPerPage));
  const paginatedCoaches = useMemo(() => {
    const startIdx = (currentPage - 1) * coachesPerPage;
    return filteredCoaches.slice(startIdx, startIdx + coachesPerPage);
  }, [filteredCoaches, currentPage]);

  // Group slots by coach and start time
  const getCoachSlotsForTime = (coachId: number, startTime: string, day: string): Slot | undefined => {
    return slots.find(s => s.coach_id === coachId && s.start_time === startTime && s.day_of_week === day);
  };

  // Cell Styling & Class helper based on Slot Status & Activity text
  const getSlotCellClass = (slot?: Slot) => {
    if (!slot) return 'slot-cell status-placeholder-cell';

    const act = (slot.activity || '').toUpperCase().trim();
    const st = slot.status_type;

    let baseClass = 'slot-cell status-blue-available';

    // 1. Check specific operational categories by status_type OR activity text matching
    if (st === 'REST_BREAK' || st === 'OFF_DUTY' || act === 'OFF' || act.includes('MEAL BREAK')) {
      baseClass = 'slot-cell status-red-break';
    } else if (st === 'BATCH_LEVEL_BREAK' || st === 'INACTIVE' || act.includes('INACTIVE') || act.includes('LEVEL BREAK') || act === 'BREAK') {
      baseClass = 'slot-cell status-purple-break';
    } else if (st === 'REQUIREMENT_BLOCK' || act.includes('REQUIREMENT BLOCK') || act.includes('REQ BLOCK') || act.includes('BLOCK')) {
      baseClass = 'slot-cell status-yellow-req';
    } else if (st === 'NEXT_MONTH_BLOCK' || act.includes('NEXT MONTH BLOCK') || act.includes('NEXT MONTH')) {
      baseClass = 'slot-cell status-cyan-nextmonth';
    } else if (st === 'ODD_SLOT' || act.includes('ODD SLOT') || act.includes('ODD')) {
      baseClass = 'slot-cell status-magenta-odd';
    } else if (st === 'TRAINING' || act.includes('TRAINING')) {
      baseClass = 'slot-cell status-mauve-training';
    } else if (st === 'PERMANENT_SUBSTITUTE' || act.includes('PERMANENT SUBSTITUTE') || act.includes('PERM SUB')) {
      baseClass = 'slot-cell status-orange-permsub';
    } else if (st === 'LONG_LEAVE_SUBSTITUTE' || act.includes('LONG LEAVE SUBSTITUTE') || act.includes('LONG LEAVE')) {
      baseClass = 'slot-cell status-blue-leavesub';
    } else if (st === 'NOTICE_PERIOD' || act.includes('NOTICE PERIOD')) {
      baseClass = 'slot-cell status-green-notice';
    } else if (st === 'REPORT_BUILDING' || act.includes('REPORT-BUILDING') || act.includes('REPORT BUILDING')) {
      baseClass = 'slot-cell status-olive-report';
    } else if (st === 'CLASSES_NEED_TO_BE_MANAGED' || act.includes('CLASSES NEED TO BE MANAGED') || act.includes('NEED TO BE MANAGED') || act.includes('MANAGED')) {
      baseClass = 'slot-cell status-teal-managed';
    } else if (st === 'TEMPORARY_CLASS' || act.includes('TEMPORARY') || act.includes('TEMP CLASS')) {
      baseClass = 'slot-cell status-orange-temp';
    } else if (st === 'DEMO_CLASS' || act.includes('DEMO')) {
      baseClass = 'slot-cell status-green-class';
    } else if (st === 'SCHEDULED_CLASS') {
      baseClass = 'slot-cell status-green-class';
    }

    // Highlight cell if coach has an active conflict or matches highlighted target
    if (highlightConflicts && slot) {
      const isTarget = highlightedCoachTarget?.coachName.toLowerCase() === slot.coach_name.toLowerCase();
      const hasConflict = conflicts.some(c => c.coach_name.toLowerCase() === slot.coach_name.toLowerCase());
      if (isTarget || hasConflict) {
        baseClass += ' conflict-highlight-pulse';
      }
    }

    return baseClass;
  };

  return (
    <div className="schedule-grid-container">
      {/* Grid Toolbar & Filters */}
      <div className="grid-toolbar">
        {/* Weekdays / Weekend View Switcher */}
        <div className="view-mode-tabs">
          <button
            type="button"
            className={`tab-btn ${viewMode === 'weekdays' ? 'active' : ''}`}
            onClick={() => setViewMode('weekdays')}
          >
            📅 Weekdays (Mon - Fri)
          </button>
          <button
            type="button"
            className={`tab-btn ${viewMode === 'weekend' ? 'active' : ''}`}
            onClick={() => setViewMode('weekend')}
          >
            🏖️ Weekend (Sat - Sun)
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid-filters">
          <div className="search-box">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search coach name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <select
            value={selectedRm}
            onChange={e => setSelectedRm(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">All RMs / Managers</option>
            {rmNames.map(rm => (
              <option key={rm} value={rm}>{rm}</option>
            ))}
          </select>

          <select
            value={selectedShift}
            onChange={e => setSelectedShift(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">All Shifts</option>
            {shiftNames.map(shift => (
              <option key={shift} value={shift}>{shift}</option>
            ))}
          </select>

          <select
            value={selectedShiftType}
            onChange={e => setSelectedShiftType(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">All Shift Types (Day & Night)</option>
            <option value="1">☀️ Day Shift (1)</option>
            <option value="2">🌙 Night Shift (2)</option>
          </select>

          <select
            value={selectedTier}
            onChange={e => setSelectedTier(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">All Tiers</option>
            <option value="Tier 1">Tier 1 (1400-1599)</option>
            <option value="Tier 2">Tier 2 (1600-1799)</option>
            <option value="Tier 3">Tier 3 (1800-1999)</option>
            <option value="Tier 4">Tier 4 (2000-2199)</option>
            <option value="Tier 5">Tier 5 (2200+)</option>
          </select>

          <select
            value={selectedRoleFilter}
            onChange={e => setSelectedRoleFilter(e.target.value as any)}
            className="filter-select font-bold"
            style={{ color: selectedRoleFilter === 'TRAINERS' ? 'var(--accent-gold)' : 'var(--text-main)', border: selectedRoleFilter === 'TRAINERS' ? '1px solid var(--accent-gold)' : '1px solid var(--border-color)' }}
          >
            <option value="ALL">👥 All Personnel (Coaches & Trainers)</option>
            <option value="COACHES">♟️ Coaches Only (Regular Schedule)</option>
            <option value="TRAINERS">👑 Lead Trainers Only (Backup Schedule)</option>
          </select>

          <button
            type="button"
            onClick={() => setHighlightConflicts(!highlightConflicts)}
            className="btn-secondary"
            style={{
              background: highlightConflicts ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-card)',
              borderColor: highlightConflicts ? '#ef4444' : 'var(--border-color)',
              color: highlightConflicts ? '#fca5a5' : 'var(--text-muted)',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer'
            }}
          >
            <AlertTriangle className="icon-sm" />
            {highlightConflicts ? 'Highlight Conflicts (ON)' : 'Highlight Conflicts (OFF)'}
          </button>

          {onSwitchToCalendarView && (
            <button
              type="button"
              className="btn-switch-view"
              onClick={onSwitchToCalendarView}
              title="Switch to Date-Wise Calendar Grid View"
            >
              📅 Switch to Calendar View
            </button>
          )}
        </div>
      </div>

      {/* Operational Color Legend Bar (Matching Master Screenshot Spec) */}
      <div className="color-legend-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', alignItems: 'center', padding: '0.65rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '1.25rem' }}>
        <span className="legend-title font-bold" style={{ fontSize: '0.8rem', color: 'var(--accent-gold)' }}>Operational Batch Categories:</span>
        <div className="legend-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
          <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#8b00ff', display: 'inline-block' }}></span>
          <span>BREAK/Inactive</span>
        </div>
        <div className="legend-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
          <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#ff0000', display: 'inline-block' }}></span>
          <span>Off/Meal BREAK</span>
        </div>
        <div className="legend-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
          <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#ffff00', display: 'inline-block' }}></span>
          <span style={{ color: '#fef08a' }}>Requirement Block</span>
        </div>
        <div className="legend-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
          <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#00ffff', display: 'inline-block' }}></span>
          <span>Next Month Block</span>
        </div>
        <div className="legend-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
          <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#ff00ff', display: 'inline-block' }}></span>
          <span>Odd Slot</span>
        </div>
        <div className="legend-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
          <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#d8b4e2', display: 'inline-block' }}></span>
          <span>Training</span>
        </div>
        <div className="legend-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
          <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#ff8c00', display: 'inline-block' }}></span>
          <span>Permanent Substitute</span>
        </div>
        <div className="legend-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
          <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#2563eb', display: 'inline-block' }}></span>
          <span>Long Leave Substitute</span>
        </div>
        <div className="legend-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
          <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#00ff00', display: 'inline-block' }}></span>
          <span style={{ color: '#86efac' }}>Notice Period</span>
        </div>
        <div className="legend-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
          <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#b8860b', display: 'inline-block' }}></span>
          <span>Report-building time</span>
        </div>
        <div className="legend-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
          <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#2e8b57', display: 'inline-block' }}></span>
          <span>Classes need to be managed</span>
        </div>
      </div>

      {/* Main Grid Table */}
      <div className="table-responsive">
        <table className="master-grid-table">
          <thead>
            <tr>
              <th className="sticky-col first-col">Sr.</th>
              <th className="sticky-col second-col">RM Name</th>
              <th className="sticky-col third-col">Shift / Type</th>
              <th className="sticky-col fourth-col">Coach Name</th>
              <th className="sticky-col fifth-col">SF Coach Name</th>
              <th className="col-time">Start T</th>
              <th className="col-time">End T</th>
              {daysToDisplay.map(day => (
                <th key={day} className="col-day">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedCoaches.length === 0 ? (
              <tr>
                <td colSpan={7 + daysToDisplay.length} className="no-data-cell">
                  No coaches found matching search criteria.
                </td>
              </tr>
            ) : (
              paginatedCoaches.map((coach, cIdx) => {
                const globalIndex = (currentPage - 1) * coachesPerPage + cIdx + 1;
                // Get time spans for this coach's slots
                const coachSlots = slots.filter(s => s.coach_id === coach.id && daysToDisplay.includes(s.day_of_week));
                const coachTimesMap = new Map<string, { start: string; end: string }>();
                coachSlots.forEach(s => {
                  const key = `${s.start_time}-${s.end_time}`;
                  if (!coachTimesMap.has(key)) {
                    coachTimesMap.set(key, { start: s.start_time, end: s.end_time });
                  }
                });
                const times = Array.from(coachTimesMap.values()).sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

                if (times.length === 0) return null;

                return times.map((timeSpan, tIdx) => (
                  <tr key={`${coach.id}-${timeSpan.start}-${tIdx}`} className={tIdx === 0 ? 'coach-row-start' : ''}>
                    {tIdx === 0 && (
                      <>
                        <td rowSpan={times.length} className="sticky-col first-col col-center">
                          {globalIndex}
                        </td>
                        <td rowSpan={times.length} className="sticky-col second-col">
                          <span className="badge-rm">{coach.rm_name || coach.trainer_manager || 'Vedant Kamble'}</span>
                        </td>
                        <td rowSpan={times.length} className="sticky-col third-col">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center' }}>
                            <span className="badge-shift">{slots.find(s => s.coach_id === coach.id)?.shift_name || 'Shift5-FT'}</span>
                            <span 
                              className={`badge-shift-type ${coach.shift_days === 2 ? 'badge-night-shift' : 'badge-day-shift'}`}
                              title={`Shift Days: ${coach.shift_days || 1} (${coach.shift_type || 'Day Shift'})`}
                            >
                              {coach.shift_days === 2 ? '🌙 Night (2)' : '☀️ Day (1)'}
                            </span>
                          </div>
                        </td>
                        <td rowSpan={times.length} className="sticky-col fourth-col font-medium">
                          <div className="coach-cell-name">
                            <div>
                              <div className="font-bold" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                {coach.role_type === 'Head Trainer' ? (
                                  <span className="badge-pill gold font-bold" style={{ fontSize: '0.62rem', padding: '0.08rem 0.35rem', borderRadius: '4px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff' }}>
                                    👑 HEAD TRAINER
                                  </span>
                                ) : isTrainerOrHeadTrainer(coach) ? (
                                  <span className="badge-pill gold font-bold" style={{ fontSize: '0.62rem', padding: '0.08rem 0.35rem', borderRadius: '4px' }}>
                                    ⭐ TRAINER
                                  </span>
                                ) : null}
                                {coach.display_name}
                              </div>
                              <span className="badge-tier">{coach.tier}</span>
                            </div>
                          </div>
                        </td>
                        <td rowSpan={times.length} className="sticky-col fifth-col text-muted text-sm">
                          {coach.sf_coach_name}
                        </td>
                      </>
                    )}
                    <td className="col-time font-mono">{timeSpan.start}</td>
                    <td className="col-time font-mono">{timeSpan.end}</td>
                    {daysToDisplay.map(day => {
                      const slot = getCoachSlotsForTime(coach.id, timeSpan.start, day);
                      return (
                        <td 
                          key={day} 
                          className={getSlotCellClass(slot)}
                          onClick={() => {
                            if (slot) {
                              onSelectSlot(slot);
                            } else {
                              onOpenBookingModal(coach, day, timeSpan.start, timeSpan.end);
                            }
                          }}
                          title={slot ? `Click to manage slot: ${slot.activity}` : `Click to book slot for ${coach.name}`}
                        >
                          <div className="slot-cell-content">
                            <span className="activity-text">
                              {slot ? slot.activity : '-'}
                            </span>
                            {slot && slot.status_type === 'BATCH_LEVEL_BREAK' && (
                              <span className="badge-micro purple">Level Break</span>
                            )}
                            {slot && slot.status_type === 'INACTIVE' && (
                              <span className="badge-micro purple">Inactive</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ));
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Spreadsheet Pagination Controls (Ported from Next.js project pagination view) */}
      {totalPages > 1 && (
        <div 
          className="pagination-controls" 
          style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '1.25rem', 
            marginTop: '1.5rem', 
            padding: '0.75rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px'
          }}
        >
          <button
            type="button"
            className="btn-preset"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            style={{ 
              padding: '0.5rem 1.1rem', 
              opacity: currentPage === 1 ? 0.5 : 1, 
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              background: '#1e293b',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.8rem'
            }}
          >
            ◀ Previous
          </button>
          
          <span className="font-bold text-sm" style={{ color: 'var(--text-main)', fontSize: '0.88rem' }}>
            Page {currentPage} of {totalPages} <span className="text-muted" style={{ fontWeight: 'normal', marginLeft: '0.4rem' }}>({filteredCoaches.length} Coaches total)</span>
          </span>

          <button
            type="button"
            className="btn-preset"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            style={{ 
              padding: '0.5rem 1.1rem', 
              opacity: currentPage === totalPages ? 0.5 : 1, 
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              background: '#1e293b',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.8rem'
            }}
          >
            Next ▶
          </button>
        </div>
      )}
    </div>
  );
};
