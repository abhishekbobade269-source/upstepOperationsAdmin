import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Slot, Coach, DateSlotOverride } from '../types';
import { Search, Calendar, ChevronLeft, ChevronRight, ShieldCheck, X, User, RotateCcw } from 'lucide-react';
import {
  timeToMinutes,
  formatDateIso,
  formatDateDisplay,
  resolveSlotStatusForDate
} from '../utils/shiftUtils';
import { isEligibleDemoMasterSlot, splitMasterSlotIntoSubSlots } from '../utils/demoSlotsUtils';

interface CalendarScheduleGridProps {
  coaches: Coach[];
  slots: Slot[];
  dateOverrides?: DateSlotOverride[];
  onSelectSlot: (slot: Slot, targetDateStr?: string) => void;
  onOpenBookingModal?: (coach: Coach, day: string, startTime: string, endTime: string, targetDateStr?: string) => void;
  onSaveDateOverride?: (override: DateSlotOverride, startDateRange?: string, endDateRange?: string) => void;
  onSwitchToMasterGrid?: () => void;
}

export const CalendarScheduleGrid: React.FC<CalendarScheduleGridProps> = ({
  coaches,
  slots,
  dateOverrides = [],
  onSelectSlot,
  onSaveDateOverride,
  onSwitchToMasterGrid
}) => {
  // Base Date (determines the week start for the calendar loop)
  const [baseDate, setBaseDate] = useState<Date>(() => new Date());

  // Single coach focus (strict - no ALL view for performance)
  const [selectedCoachId, setSelectedCoachId] = useState<number>(() => {
    return coaches[0]?.id ?? 1;
  });

  // Calendar view span: 7 days | 14 days | weekdays only | weekend only
  const [viewSpanMode, setViewSpanMode] = useState<'7_days' | '14_days' | 'weekdays' | 'weekend'>('7_days');

  // Coach filter fields
  const [searchCoachQuery, setSearchCoachQuery] = useState<string>('');
  const [selectedRmFilter, setSelectedRmFilter] = useState<string>('ALL');

  // Set of expanded date ISO strings (header-click to expand → sub-columns)
  const [expandedDatesSet, setExpandedDatesSet] = useState<Set<string>>(new Set());

  // Allocation modal state
  const [allocatingCell, setAllocatingCell] = useState<{
    coach: Coach;
    slot: Slot;
    targetDateIso: string;
    targetDateDisplay: string;
    resolvedState: ReturnType<typeof resolveSlotStatusForDate>;
  } | null>(null);

  const [overrideForm, setOverrideForm] = useState<{
    allocation_type: 'DEMO' | 'SUBSTITUTE' | 'INACTIVE' | 'TEMPORARY';
    activity_text: string;
    substitute_coach_name: string;
    apply_date_range: boolean;
    end_date_range: string;
    notes: string;
  }>({
    allocation_type: 'DEMO',
    activity_text: 'X Demo',
    substitute_coach_name: '',
    apply_date_range: false,
    end_date_range: '',
    notes: ''
  });

  const daysOrderNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Distinct RMs for filter dropdown
  const rmNames = useMemo(() => {
    const rms = new Set<string>();
    coaches.forEach(c => { if (c.trainer_manager) rms.add(c.trainer_manager); });
    return Array.from(rms).sort();
  }, [coaches]);

  // Filtered coach dropdown options
  const filteredCoachOptions = useMemo(() => {
    return coaches.filter(c => {
      const matchesSearch = !searchCoachQuery ||
        c.name.toLowerCase().includes(searchCoachQuery.toLowerCase()) ||
        c.sf_coach_name.toLowerCase().includes(searchCoachQuery.toLowerCase()) ||
        c.display_name.toLowerCase().includes(searchCoachQuery.toLowerCase());
      const matchesRM = selectedRmFilter === 'ALL' || c.trainer_manager === selectedRmFilter;
      return matchesSearch && matchesRM;
    });
  }, [coaches, searchCoachQuery, selectedRmFilter]);

  // BUG FIX: Auto-select first match when current coach is filtered out
  useEffect(() => {
    if (
      filteredCoachOptions.length > 0 &&
      !filteredCoachOptions.some(c => c.id === selectedCoachId)
    ) {
      setSelectedCoachId(filteredCoachOptions[0].id);
    }
  }, [filteredCoachOptions, selectedCoachId]);

  // Selected coach object
  const selectedCoach = useMemo(() => {
    return coaches.find(c => c.id === selectedCoachId) ?? coaches[0];
  }, [coaches, selectedCoachId]);

  // Get Monday of the week containing baseDate
  const getWeekStartMon = (d: Date): Date => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  // Calendar loop dates derived from baseDate + viewSpanMode
  const calendarDatesLoop = useMemo(() => {
    const mon = getWeekStartMon(baseDate);
    const dates: Date[] = [];
    const daysCount = viewSpanMode === '14_days' ? 14 : 7;

    for (let i = 0; i < daysCount; i++) {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      if (viewSpanMode === 'weekdays' && (d.getDay() === 0 || d.getDay() === 6)) continue;
      if (viewSpanMode === 'weekend' && d.getDay() !== 0 && d.getDay() !== 6) continue;
      dates.push(d);
    }
    return dates;
  }, [baseDate, viewSpanMode]);

  // Slot index for selected coach keyed by `${start_time}_${day_of_week}`
  const coachSlotIndex = useMemo(() => {
    if (!selectedCoach) return new Map<string, Slot>();
    const map = new Map<string, Slot>();
    slots.forEach(s => {
      if (s.coach_id === selectedCoach.id) {
        map.set(`${s.start_time}_${s.day_of_week}`, s);
      }
    });
    return map;
  }, [slots, selectedCoach]);

  // Distinct time rows for selected coach (sorted by time)
  const coachTimeSlots = useMemo(() => {
    if (!selectedCoach) return [];
    const timesMap = new Map<string, { start_time: string; end_time: string }>();
    slots.forEach(s => {
      if (s.coach_id === selectedCoach.id) {
        const key = `${s.start_time}|${s.end_time}`;
        if (!timesMap.has(key)) timesMap.set(key, { start_time: s.start_time, end_time: s.end_time });
      }
    });
    return Array.from(timesMap.values()).sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
  }, [slots, selectedCoach]);

  // Get slot for given start_time and day
  const getSlot = useCallback((startTime: string, dayOfWeek: string): Slot | undefined => {
    return coachSlotIndex.get(`${startTime}_${dayOfWeek}`);
  }, [coachSlotIndex]);

  // Cell CSS class based on resolved status
  const getSlotCellClass = useCallback((resolved?: ReturnType<typeof resolveSlotStatusForDate>): string => {
    if (!resolved) return 'slot-cell status-placeholder-cell';
    const act = (resolved.activity || '').toUpperCase().trim();
    const st = resolved.status_type;
    if (st === 'REST_BREAK' || st === 'OFF_DUTY' || act === 'OFF' || act.includes('MEAL BREAK')) return 'slot-cell status-red-break';
    if (st === 'BATCH_LEVEL_BREAK' || st === 'INACTIVE' || act.includes('INACTIVE') || act.includes('LEVEL BREAK') || act === 'BREAK') return 'slot-cell status-purple-break';
    if (st === 'REQUIREMENT_BLOCK' || act.includes('REQUIREMENT BLOCK') || act.includes('REQ BLOCK') || act.includes('BLOCK')) return 'slot-cell status-yellow-req';
    if (st === 'NEXT_MONTH_BLOCK' || act.includes('NEXT MONTH BLOCK') || act.includes('NEXT MONTH')) return 'slot-cell status-cyan-nextmonth';
    if (st === 'ODD_SLOT' || act.includes('ODD SLOT')) return 'slot-cell status-magenta-odd';
    if (st === 'TRAINING') return 'slot-cell status-mauve-training';
    if (st === 'PERMANENT_SUBSTITUTE' || act.includes('PERMANENT SUBSTITUTE')) return 'slot-cell status-orange-permsub';
    if (st === 'LONG_LEAVE_SUBSTITUTE' || act.includes('LONG LEAVE')) return 'slot-cell status-blue-leavesub';
    if (st === 'NOTICE_PERIOD' || act.includes('NOTICE PERIOD')) return 'slot-cell status-green-notice';
    if (st === 'REPORT_BUILDING' || act.includes('REPORT-BUILDING')) return 'slot-cell status-olive-report';
    if (st === 'CLASSES_NEED_TO_BE_MANAGED' || act.includes('MANAGED')) return 'slot-cell status-teal-managed';
    if (st === 'TEMPORARY_CLASS' || act.includes('TEMPORARY') || act.includes('TEMP CLASS')) return 'slot-cell status-orange-temp';
    if (st === 'DEMO_CLASS' || act.includes('DEMO')) return 'slot-cell status-green-class';
    if (st === 'SCHEDULED_CLASS') return 'slot-cell status-green-class';
    return 'slot-cell status-blue-available';
  }, []);

  // Check whether a resolved slot should show 20-min sub-slots when expanded
  // Uses isEligibleDemoMasterSlot from demoSlotsUtils — single source of truth
  const isSubSlotEligible = useCallback((resolved?: ReturnType<typeof resolveSlotStatusForDate>, masterSlot?: Slot): boolean => {
    if (!resolved || !masterSlot) return false;
    // Build a fake slot object with the resolved state so isEligibleDemoMasterSlot can check it
    const slotProxy = { ...masterSlot, status_type: resolved.status_type, activity: resolved.activity };
    return isEligibleDemoMasterSlot(slotProxy as Slot);
  }, []);

  // Toggle header-click date column expansion (immutable Set update)
  const handleToggleDateExpansion = useCallback((dateIso: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedDatesSet(prev => {
      const next = new Set(prev);
      if (next.has(dateIso)) {
        next.delete(dateIso);
      } else {
        next.add(dateIso);
      }
      return next;
    });
  }, []);

  // Open allocation modal
  const handleOpenAllocationModal = useCallback((
    coach: Coach,
    slot: Slot,
    targetDateIso: string,
    targetDateDisplay: string,
    resolved: ReturnType<typeof resolveSlotStatusForDate>
  ) => {
    onSelectSlot(slot, targetDateIso);
    setAllocatingCell({ coach, slot, targetDateIso, targetDateDisplay, resolvedState: resolved });
    setOverrideForm({
      allocation_type: 'DEMO',
      activity_text: 'X Demo',
      substitute_coach_name: '',
      apply_date_range: false,
      end_date_range: targetDateIso,
      notes: ''
    });
  }, [onSelectSlot]);

  // Submit allocation override
  const handleSaveAllocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocatingCell || !onSaveDateOverride) return;
    const { slot, coach, targetDateIso } = allocatingCell;

    let statusType: any = 'DEMO_CLASS';
    let activityText = overrideForm.activity_text || 'X Demo';
    if (overrideForm.allocation_type === 'SUBSTITUTE') { statusType = 'SUBSTITUTE_CLASS'; activityText = `Sub - ${overrideForm.substitute_coach_name || 'Assigned'}`; }
    if (overrideForm.allocation_type === 'INACTIVE')   { statusType = 'BATCH_LEVEL_BREAK'; activityText = 'Inactive / Leave'; }
    if (overrideForm.allocation_type === 'TEMPORARY')  { statusType = 'TEMPORARY_CLASS'; activityText = overrideForm.activity_text || 'X Temporary'; }

    const newOverride: DateSlotOverride = {
      id: `override-${Date.now()}`,
      slot_id: slot.id,
      coach_id: coach.id,
      target_date: targetDateIso,
      status_type: statusType,
      activity: activityText,
      substitute_coach_name: overrideForm.substitute_coach_name,
      notes: overrideForm.notes
    };

    onSaveDateOverride(
      newOverride,
      targetDateIso,
      overrideForm.apply_date_range ? overrideForm.end_date_range : targetDateIso
    );
    setAllocatingCell(null);
  };

  // Date navigation helpers
  const handleShiftPeriod = (dir: 'prev' | 'next') => {
    const d = new Date(baseDate);
    const days = viewSpanMode === '14_days' ? 14 : 7;
    d.setDate(d.getDate() + (dir === 'prev' ? -days : days));
    setBaseDate(d);
  };

  const todayIso = formatDateIso(new Date());

  // ─────────────────── RENDER ───────────────────
  return (
    <div className="audit-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* ── Top Header ── */}
      <div className="section-header-card shadow-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--accent-gold)' }}>
        <div className="header-icon-box" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid var(--accent-gold)' }}>
          <span style={{ fontSize: '1.7rem' }}>📅</span>
        </div>
        <div className="header-text-box" style={{ flex: 1 }}>
          <h2 style={{ margin: 0 }}>Per-Coach Date-Wise Calendar Schedule Grid</h2>
          <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
            Sticky time columns · Click any <strong>date header</strong> to expand 20-min sub-slots · Shows classes up to their expiry date, then reverts to <strong>X</strong>
          </p>
        </div>
        {onSwitchToMasterGrid && (
          <button type="button" className="btn-switch-view" onClick={onSwitchToMasterGrid}>
            <RotateCcw size={14} /> Back to Master Grid
          </button>
        )}
      </div>

      {/* ── Controls ── */}
      <div className="card-glass shadow-md" style={{ padding: '1rem 1.15rem', borderRadius: '13px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

        {/* Row 1: Coach selector + search + RM filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <User size={16} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--accent-gold)', flexShrink: 0 }}>Coach:</span>
          <select
            value={selectedCoachId}
            onChange={e => setSelectedCoachId(Number(e.target.value))}
            className="select-input font-bold"
            style={{ flex: 1, minWidth: '240px', maxWidth: '420px', border: '2px solid var(--accent-gold)', fontSize: '0.9rem' }}
          >
            {filteredCoachOptions.map(c => (
              <option key={c.id} value={c.id}>
                {c.display_name}  ({c.tier} | FIDE {c.standard_rating} | {c.trainer_manager || 'RM'})
              </option>
            ))}
          </select>

          <div className="search-box" style={{ minWidth: '180px' }}>
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Filter Coach Name..."
              value={searchCoachQuery}
              onChange={e => setSearchCoachQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <select
            value={selectedRmFilter}
            onChange={e => setSelectedRmFilter(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">All RMs / Managers</option>
            {rmNames.map(rm => <option key={rm} value={rm}>{rm}</option>)}
          </select>
        </div>

        {/* Row 2: Coach profile mini-card */}
        {selectedCoach && (
          <div className="cal-coach-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="cal-coach-avatar">{selectedCoach.display_name.charAt(0)}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  {selectedCoach.display_name}
                  {selectedCoach.demo_preference_color && (
                    <span
                      className="cal-demo-pref-dot"
                      style={{ background: selectedCoach.demo_preference_color, color: selectedCoach.demo_preference_color }}
                      title={`Demo: ${selectedCoach.demo_preference}`}
                    />
                  )}
                </div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                  SF: {selectedCoach.sf_coach_name} &nbsp;|&nbsp; {selectedCoach.employee_id || 'EMP-N/A'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.82rem' }}>
              <span><span style={{ color: 'var(--text-muted)' }}>RM:</span> <strong style={{ color: 'var(--accent-gold)' }}>{selectedCoach.trainer_manager || '—'}</strong></span>
              <span><span style={{ color: 'var(--text-muted)' }}>Shift:</span> <strong style={{ color: selectedCoach.shift_days === 2 ? '#a855f7' : '#eab308' }}>{selectedCoach.shift_type}</strong></span>
              <span><span style={{ color: 'var(--text-muted)' }}>FIDE:</span> <strong>{selectedCoach.standard_rating}</strong></span>
              <span><span style={{ color: 'var(--text-muted)' }}>Tier:</span> <span className="badge-pill blue" style={{ fontSize: '0.72rem' }}>{selectedCoach.tier}</span></span>
              {selectedCoach.demo_preference && <span><span style={{ color: 'var(--text-muted)' }}>Demo:</span> <strong style={{ color: selectedCoach.demo_preference_color || '#10b981' }}>{selectedCoach.demo_preference}</strong></span>}
            </div>
          </div>
        )}

        {/* Row 3: Date navigation + span mode tabs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button type="button" className="btn-secondary" onClick={() => handleShiftPeriod('prev')} style={{ padding: '0.38rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <ChevronLeft size={14} /> Prev
            </button>
            <button type="button" className="btn-primary" onClick={() => setBaseDate(new Date())} style={{ padding: '0.38rem 0.75rem', fontSize: '0.8rem' }}>
              Today
            </button>
            <button type="button" className="btn-secondary" onClick={() => handleShiftPeriod('next')} style={{ padding: '0.38rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              Next <ChevronRight size={14} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: '0.5rem', background: 'var(--bg-secondary)', padding: '0.28rem 0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <Calendar size={13} color="var(--accent-gold)" />
              <input
                type="date"
                value={formatDateIso(baseDate)}
                onChange={e => { if (e.target.value) setBaseDate(new Date(e.target.value + 'T00:00:00')); }}
                className="text-input"
                style={{ fontSize: '0.8rem', padding: '0.2rem 0.4rem', fontWeight: 700, minWidth: '110px' }}
              />
            </div>
            {expandedDatesSet.size > 0 && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setExpandedDatesSet(new Set())}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', color: '#60a5fa', borderColor: 'rgba(59,130,246,0.4)' }}
              >
                ✕ Collapse All ({expandedDatesSet.size})
              </button>
            )}
          </div>

          <div className="cal-span-tabs">
            {([['7_days', '📅 7-Day'], ['14_days', '📆 14-Day'], ['weekdays', '☀️ Weekdays'], ['weekend', '🏖️ Weekend']] as const).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                className={`cal-span-tab ${viewSpanMode === mode ? 'active' : ''}`}
                onClick={() => setViewSpanMode(mode)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Calendar Matrix Table ── */}
      <div className="card-glass shadow-lg" style={{ borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', padding: '0' }}>
        <div className="cal-table-wrap">
          <table className="cal-table">
            <thead>
              <tr>
                {/* Sticky: Start Time header */}
                <th className="cal-th-sticky-left" style={{ textAlign: 'center', padding: '0.6rem 0.4rem', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.03em' }}>
                  Start T
                </th>
                {/* Sticky: End Time header */}
                <th className="cal-th-sticky-left2" style={{ textAlign: 'center', padding: '0.6rem 0.4rem', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.03em' }}>
                  End T
                </th>

                {/* Date column headers — click to expand */}
                {calendarDatesLoop.map(d => {
                  const dateIso = formatDateIso(d);
                  const isToday = dateIso === todayIso;
                  const isExpanded = expandedDatesSet.has(dateIso);

                  return isExpanded ? (
                    // Main date header + 3 animated sub-column headers (slide open to the right)
                    <React.Fragment key={dateIso}>
                      {/* Compressed main date header */}
                      <th
                        className={`cal-th cal-expanded-header${isToday ? ' cal-today-header' : ''}`}
                        onClick={e => handleToggleDateExpansion(dateIso, e)}
                        title="Click to collapse sub-slots"
                        style={{ minWidth: '90px', width: '90px' }}
                      >
                        <div style={{ fontWeight: 800, fontSize: '0.82rem' }}>{formatDateDisplay(d)} ▼</div>
                        {isToday && <span style={{ fontSize: '0.63rem', fontWeight: 700 }}>● TODAY</span>}
                        <span className="cal-expand-hint">click to collapse</span>
                      </th>
                      {/* 1st 20 Min animated header — NO inline position override, CSS sticky applies */}
                      <th className={`cal-th-sub sub-open`}>
                        <div className="cal-subslot-slide open" style={{ padding: '0.35rem 0.3rem', flexDirection: 'column', alignItems: 'center' }}>
                          <span>⚡ 1st 20 Min</span>
                        </div>
                      </th>
                      {/* 5 Min Break animated header — explicit inline sticky + opaque background so rows don't bleed through */}
                      <th
                        className="cal-th-sub sub-open cal-break-cell"
                        style={{ position: 'sticky', top: 0, zIndex: 15, background: '#1e1040', pointerEvents: 'none' }}
                      >
                        <div className="cal-subslot-slide open" style={{ padding: '0.35rem 0.3rem', flexDirection: 'column', alignItems: 'center' }}>
                          <span className="cal-break-label">🟣 5 Min Break</span>
                        </div>
                      </th>
                      {/* 2nd 20 Min animated header */}
                      <th className={`cal-th-sub sub-open`}>
                        <div className="cal-subslot-slide open" style={{ padding: '0.35rem 0.3rem', flexDirection: 'column', alignItems: 'center' }}>
                          <span>⚡ 2nd 20 Min</span>
                        </div>
                      </th>
                    </React.Fragment>
                  ) : (
                    <th
                      key={dateIso}
                      className={`cal-th${isToday ? ' cal-today-header' : ''}`}
                      onClick={e => handleToggleDateExpansion(dateIso, e)}
                      title="Click to expand 20-min sub-slots"
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{formatDateDisplay(d)}</div>
                      {isToday && <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>● TODAY</span>}
                      <span className="cal-expand-hint">▶ Expand sub-slots</span>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {coachTimeSlots.length === 0 ? (
                <tr>
                  <td colSpan={2 + calendarDatesLoop.length + expandedDatesSet.size} className="no-data-cell" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No working time slots assigned to {selectedCoach?.display_name || 'this coach'}.
                  </td>
                </tr>
              ) : (
                coachTimeSlots.map((timeSpan, tIdx) => (
                  <tr key={`${selectedCoach?.id}-${timeSpan.start_time}-${tIdx}`}>
                    {/* Sticky: Start Time cell */}
                    <td className="cal-td-sticky-left" style={{ padding: '0.55rem 0.4rem', textAlign: 'center', fontWeight: 700, fontSize: '0.8rem', color: '#3b82f6', fontFamily: 'monospace' }}>
                      {timeSpan.start_time}
                    </td>
                    {/* Sticky: End Time cell */}
                    <td className="cal-td-sticky-left2" style={{ padding: '0.55rem 0.4rem', textAlign: 'center', fontWeight: 700, fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>
                      {timeSpan.end_time}
                    </td>

                    {/* Date cells (or 3 sub-slot cells when expanded) */}
                    {calendarDatesLoop.map(colDate => {
                      const dateIso = formatDateIso(colDate);
                      const dateDisplay = formatDateDisplay(colDate);
                      const dayOfWeek = daysOrderNames[colDate.getDay()];
                      const masterSlot = getSlot(timeSpan.start_time, dayOfWeek);
                      const resolved = masterSlot ? resolveSlotStatusForDate(masterSlot, dateIso, dateOverrides) : undefined;
                      const isExpanded = expandedDatesSet.has(dateIso);
                      const eligible = masterSlot ? isSubSlotEligible(resolved, masterSlot) : false;

                      // Is this slot expired (past end_date)?
                      const isExpired = resolved?.activity === 'X (Expired)';

                      const cellContent = (
                        <div className="cal-cell-inner">
                          {isExpired ? (
                            <span className="cal-expired-badge">⬜ Expired</span>
                          ) : (
                            <span style={{ fontWeight: 700 }}>{resolved ? resolved.activity : '—'}</span>
                          )}
                          {resolved?.is_override && !isExpired && (
                            <span className="cal-override-badge">
                              ⚡ {resolved.substitute_coach_name ? `Sub: ${resolved.substitute_coach_name}` : 'Override'}
                            </span>
                          )}
                          {masterSlot?.end_date && !isExpired && masterSlot.status_type === 'SCHEDULED_CLASS' && (
                            <span className="cal-slot-expiry-tag">until {masterSlot.end_date}</span>
                          )}
                        </div>
                      );

                      if (isExpanded) {
                        // ── Expanded: render MAIN cell + 3 animated sub-slot cells ──
                        const { sub1, restBreakTime, sub2 } = splitMasterSlotIntoSubSlots(timeSpan.start_time);
                        const [breakStart, breakEnd] = restBreakTime.split(' - ');
                        const isBreak = resolved?.status_type === 'BATCH_LEVEL_BREAK' || resolved?.status_type === 'INACTIVE';

                        const renderSubContent = (isFirst: boolean) => {
                          if (!eligible) return <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>;
                          if (isBreak) return <span className="cal-break-label">🟣 Level Break</span>;
                          const subSlotData = isFirst ? resolved?.sub_slot_1 : resolved?.sub_slot_2;
                          if (subSlotData?.status === 'BOOKED') {
                            return <span className="cal-booked-pill">{(subSlotData as any).student_name || 'Booked'}</span>;
                          }
                          return <span className="cal-free-slot-pill">⚡ Free Slot</span>;
                        };

                        return (
                          <React.Fragment key={dateIso}>
                            {/* Main compressed cell */}
                            <td
                              className={`cal-td ${getSlotCellClass(resolved)}`}
                              onClick={() => {
                                if (masterSlot && resolved) handleOpenAllocationModal(selectedCoach, masterSlot, dateIso, dateDisplay, resolved);
                              }}
                              style={{ cursor: masterSlot ? 'pointer' : 'default', minWidth: '90px', width: '90px' }}
                              title={masterSlot ? `${dateDisplay} | ${resolved?.activity}` : 'No slot'}
                            >
                              {cellContent}
                            </td>

                            {/* 1st 20 Min cell — slides open */}
                            <td className={`cal-td-sub sub-open ${eligible ? getSlotCellClass(resolved) : ''}`}
                              onClick={() => {
                                if (masterSlot && resolved && eligible) handleOpenAllocationModal(selectedCoach, masterSlot, dateIso, dateDisplay, resolved);
                              }}
                              style={{ cursor: eligible ? 'pointer' : 'default' }}
                            >
                              <div className="cal-subslot-slide open">
                                <span className="cal-sub-time-label">{sub1.start_time} – {sub1.end_time}</span>
                                {renderSubContent(true)}
                              </div>
                            </td>

                            {/* 5 Min Rest Break cell — fixed, non-interactive */}
                            <td className="cal-td-sub sub-open cal-break-cell">
                              <div className="cal-subslot-slide open">
                                <span className="cal-sub-time-label">{breakStart} – {breakEnd}</span>
                                <span className="cal-break-label">🟣 Rest</span>
                              </div>
                            </td>

                            {/* 2nd 20 Min cell — slides open */}
                            <td className={`cal-td-sub sub-open ${eligible ? getSlotCellClass(resolved) : ''}`}
                              onClick={() => {
                                if (masterSlot && resolved && eligible) handleOpenAllocationModal(selectedCoach, masterSlot, dateIso, dateDisplay, resolved);
                              }}
                              style={{ cursor: eligible ? 'pointer' : 'default' }}
                            >
                              <div className="cal-subslot-slide open">
                                <span className="cal-sub-time-label">{sub2.start_time} – {sub2.end_time}</span>
                                {renderSubContent(false)}
                              </div>
                            </td>
                          </React.Fragment>
                        );
                      }

                      // ── Normal single cell ──
                      return (
                        <td
                          key={dateIso}
                          className={`cal-td ${getSlotCellClass(resolved)}`}
                          onClick={() => {
                            if (masterSlot && resolved) handleOpenAllocationModal(selectedCoach, masterSlot, dateIso, dateDisplay, resolved);
                          }}
                          style={{ cursor: masterSlot ? 'pointer' : 'default' }}
                          title={masterSlot ? `${dateDisplay} | ${resolved?.activity}` : 'No slot on this day'}
                        >
                          {cellContent}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Allocation Override Modal ── */}
      {allocatingCell && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-card shadow-2xl" style={{ maxWidth: '520px', background: 'var(--bg-card)', border: '1px solid var(--accent-gold)', borderRadius: '14px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>⚡ Date Allocation & Override</h3>
              <button type="button" onClick={() => setAllocatingCell(null)} className="btn-secondary" style={{ padding: '0.2rem 0.45rem' }}>
                <X size={14} />
              </button>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.83rem' }}>
              <div>Coach: <strong>{allocatingCell.coach.display_name}</strong></div>
              <div>Date: <strong style={{ color: 'var(--accent-gold)' }}>{allocatingCell.targetDateDisplay} ({allocatingCell.targetDateIso})</strong></div>
              <div>Time: <strong>{allocatingCell.slot.start_time} – {allocatingCell.slot.end_time}</strong></div>
              <div>Current: <span className="badge-pill blue">{allocatingCell.resolvedState.activity}</span></div>
            </div>

            <form onSubmit={handleSaveAllocationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div className="form-group">
                <label className="form-label font-bold">Allocation Type:</label>
                <select
                  value={overrideForm.allocation_type}
                  onChange={e => setOverrideForm({ ...overrideForm, allocation_type: e.target.value as any })}
                  className="select-input"
                >
                  <option value="DEMO">🟨 Allocate Demo Session (X Demo)</option>
                  <option value="SUBSTITUTE">🟧 Assign Temporary Substitute Coach</option>
                  <option value="INACTIVE">🟪 Mark Inactive / Level Break</option>
                  <option value="TEMPORARY">🟧 Temporary Class Cover-up</option>
                </select>
              </div>

              {(overrideForm.allocation_type === 'DEMO' || overrideForm.allocation_type === 'TEMPORARY') && (
                <div className="form-group">
                  <label className="form-label font-bold">Activity Tag / Demo ID:</label>
                  <input type="text" required placeholder="e.g. X Demo, Demo-71559" value={overrideForm.activity_text} onChange={e => setOverrideForm({ ...overrideForm, activity_text: e.target.value })} className="text-input" />
                </div>
              )}

              {overrideForm.allocation_type === 'SUBSTITUTE' && (
                <div className="form-group">
                  <label className="form-label font-bold">Substitute Coach Name:</label>
                  <select
                    value={overrideForm.substitute_coach_name}
                    onChange={e => setOverrideForm({ ...overrideForm, substitute_coach_name: e.target.value })}
                    required
                    className="select-input"
                  >
                    <option value="">-- Choose Substitute Coach --</option>
                    {coaches.filter(c => c.id !== allocatingCell.coach.id).map(c => (
                      <option key={c.id} value={c.display_name}>{c.display_name} ({c.tier})</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ background: 'rgba(59,130,246,0.08)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.25)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.83rem', color: '#60a5fa' }}>
                  <input type="checkbox" checked={overrideForm.apply_date_range} onChange={e => setOverrideForm({ ...overrideForm, apply_date_range: e.target.checked })} />
                  Apply override across a multi-day range?
                </label>
                {overrideForm.apply_date_range && (
                  <div style={{ marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.81rem' }}>
                    <span>Start: <strong>{allocatingCell.targetDateIso}</strong></span>
                    <span>Until:</span>
                    <input type="date" value={overrideForm.end_date_range} onChange={e => setOverrideForm({ ...overrideForm, end_date_range: e.target.value })} className="text-input" style={{ fontSize: '0.8rem', padding: '0.28rem 0.4rem' }} />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label font-bold">Notes / Reason:</label>
                <input type="text" placeholder="Reason for override..." value={overrideForm.notes} onChange={e => setOverrideForm({ ...overrideForm, notes: e.target.value })} className="text-input" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.35rem' }}>
                <button type="button" onClick={() => setAllocatingCell(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldCheck size={14} /> Save Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
