import React, { useState, useMemo } from 'react';
import type { Coach, Slot, DailyDemoSlotBlock, DemoSubSlot } from '../types';
import { generateDailyDemoSlotBlocks } from '../utils/demoSlotsUtils';
import { Calendar, Search, Filter, CheckCircle, Clock, User, X, UserX } from 'lucide-react';
import './CoachProfile.css';

interface DailyDemoSlotsHubProps {
  coaches: Coach[];
  slots: Slot[];
  onUpdateCoach?: (updatedCoach: Coach) => void;
}

export const DailyDemoSlotsHub: React.FC<DailyDemoSlotsHubProps> = ({
  coaches,
  slots
}) => {
  // Selected date state (defaults to today's date)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [prefFilter, setPrefFilter] = useState<string>('ALL');
  const [eligibilityFilter, setEligibilityFilter] = useState<string>('ALL');
  const [subSlotStatusFilter, setSubSlotStatusFilter] = useState<string>('ALL');

  // Modal editing state for 20-min demo sub-slot booking
  const [editingSubSlotTarget, setEditingSubSlotTarget] = useState<{
    blockId: string;
    subSlotNumber: 1 | 2;
    block: DailyDemoSlotBlock;
  } | null>(null);

  const [bookingForm, setBookingForm] = useState<{
    status: 'FREE' | 'BOOKED' | 'CANCELLED';
    student_name: string;
    student_level: string;
    demo_topic: string;
    notes: string;
  }>({
    status: 'FREE',
    student_name: '',
    student_level: 'Foundation',
    demo_topic: '',
    notes: ''
  });

  // Custom demo blocks local state (to persist user bookings in session)
  const [customBookings, setCustomBookings] = useState<Record<string, { sub1?: DemoSubSlot; sub2?: DemoSubSlot }>>({});

  // Compute date details (Date String & Day of Week)
  const { formattedDateStr, dayOfWeek } = useMemo(() => {
    const d = new Date(selectedDate);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayStr = dayNames[d.getDay()];
    const dateNum = String(d.getDate()).padStart(2, '0');
    const monthStr = monthNames[d.getMonth()];
    const yearNum = d.getFullYear();

    return {
      formattedDateStr: `${dateNum}-${monthStr}-${yearNum}`,
      dayOfWeek: dayStr
    };
  }, [selectedDate]);

  // Generate Daily Demo Slot Blocks for the selected date
  const rawDemoBlocks = useMemo(() => {
    return generateDailyDemoSlotBlocks(formattedDateStr, dayOfWeek, coaches, slots);
  }, [formattedDateStr, dayOfWeek, coaches, slots]);

  // Merge custom sub-slot bookings
  const demoBlocks = useMemo(() => {
    return rawDemoBlocks.map(block => {
      const custom = customBookings[block.id];
      if (!custom) return block;
      return {
        ...block,
        sub_slot_1: custom.sub1 || block.sub_slot_1,
        sub_slot_2: custom.sub2 || block.sub_slot_2
      };
    });
  }, [rawDemoBlocks, customBookings]);

  // Filtered Demo Blocks
  const filteredBlocks = useMemo(() => {
    return demoBlocks.filter(block => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = block.coach_name.toLowerCase().includes(q);
        const matchRm = block.rm_name.toLowerCase().includes(q);
        const matchTime = block.master_start_time.toLowerCase().includes(q);
        const matchRemark = block.remarks.toLowerCase().includes(q);
        if (!matchName && !matchRm && !matchTime && !matchRemark) return false;
      }

      // 2. Demo Preference Filter
      if (prefFilter !== 'ALL') {
        if (prefFilter === 'PREF1' && !block.demo_preference.toLowerCase().includes('1')) return false;
        if (prefFilter === 'PREF2' && !block.demo_preference.toLowerCase().includes('2')) return false;
        if (prefFilter === 'PREF3' && !block.demo_preference.toLowerCase().includes('3')) return false;
        if (prefFilter === 'NOT_ALLOWED' && !block.demo_preference.toLowerCase().includes('not to be given')) return false;
      }

      // 3. Eligibility Filter
      if (eligibilityFilter === 'ELIGIBLE' && block.is_no_demo_highlighted) return false;
      if (eligibilityFilter === 'INELIGIBLE' && !block.is_no_demo_highlighted) return false;

      // 4. Sub-slot Status Filter
      if (subSlotStatusFilter === 'FREE_ONLY') {
        if (block.sub_slot_1.status !== 'FREE' && block.sub_slot_2.status !== 'FREE') return false;
      }
      if (subSlotStatusFilter === 'BOOKED_ONLY') {
        if (block.sub_slot_1.status !== 'BOOKED' && block.sub_slot_2.status !== 'BOOKED') return false;
      }

      return true;
    });
  }, [demoBlocks, searchQuery, prefFilter, eligibilityFilter, subSlotStatusFilter]);

  // Overall Statistics
  const stats = useMemo(() => {
    let totalBlocks = demoBlocks.length;
    let total20mSubSlots = totalBlocks * 2;
    let free20mSubSlots = 0;
    let booked20mSubSlots = 0;
    let ineligibleCoaches = 0;

    demoBlocks.forEach(b => {
      if (b.sub_slot_1.status === 'FREE') free20mSubSlots++;
      else if (b.sub_slot_1.status === 'BOOKED') booked20mSubSlots++;

      if (b.sub_slot_2.status === 'FREE') free20mSubSlots++;
      else if (b.sub_slot_2.status === 'BOOKED') booked20mSubSlots++;

      if (b.is_no_demo_highlighted) ineligibleCoaches++;
    });

    return {
      totalBlocks,
      total20mSubSlots,
      free20mSubSlots,
      booked20mSubSlots,
      ineligibleCoaches
    };
  }, [demoBlocks]);

  // Open booking modal
  const handleOpenBookingModal = (block: DailyDemoSlotBlock, subSlotNumber: 1 | 2) => {
    const sub = subSlotNumber === 1 ? block.sub_slot_1 : block.sub_slot_2;
    setEditingSubSlotTarget({ blockId: block.id, subSlotNumber, block });
    setBookingForm({
      status: sub.status,
      student_name: sub.student_name || '',
      student_level: sub.student_level || 'Foundation',
      demo_topic: sub.demo_topic || '',
      notes: sub.notes || ''
    });
  };

  // Save sub-slot booking
  const handleSaveSubSlotBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubSlotTarget) return;

    const { blockId, subSlotNumber, block } = editingSubSlotTarget;
    const currentSub = subSlotNumber === 1 ? block.sub_slot_1 : block.sub_slot_2;

    const updatedSub: DemoSubSlot = {
      ...currentSub,
      status: bookingForm.status,
      student_name: bookingForm.status === 'BOOKED' ? bookingForm.student_name : undefined,
      student_level: bookingForm.status === 'BOOKED' ? bookingForm.student_level : undefined,
      demo_topic: bookingForm.status === 'BOOKED' ? bookingForm.demo_topic : undefined,
      notes: bookingForm.notes
    };

    setCustomBookings(prev => {
      const existing = prev[blockId] || {};
      return {
        ...prev,
        [blockId]: {
          ...existing,
          [subSlotNumber === 1 ? 'sub1' : 'sub2']: updatedSub
        }
      };
    });

    setEditingSubSlotTarget(null);
  };

  return (
    <div className="audit-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header Banner */}
      <div className="section-header-card shadow-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--accent-gold)' }}>
        <div className="header-icon-box" style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b' }}>
          <span style={{ fontSize: '1.8rem' }}>🔁</span>
        </div>
        <div className="header-text-box" style={{ flex: 1 }}>
          <h2>Daily Slots 2.0 (Demo Slots Management Hub)</h2>
          <p>
            Date-wise Demo Slot Automation matching Google Sheets Daily Slots 2.0 specs.
            Fetches <strong>X slots</strong> &amp; <strong>purple inactive slots</strong> from Master Schedule, splits each 45-min master slot into <strong>two 20-min demo sub-slots</strong> (with 5-min rest break), displays coach demo preferences, and flags no-demo ineligible coaches.
          </p>
        </div>
      </div>

      {/* Date Picker & Quick Actions Bar */}
      <div className="card-glass" style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar className="icon-gold icon-sm" />
              <label className="font-bold" style={{ fontSize: '0.9rem' }}>Select Target Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="text-input"
                style={{ fontSize: '0.88rem', fontWeight: 'bold' }}
              />
            </div>

            {/* Quick Date Chips */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="chip-btn"
                style={{ fontSize: '0.78rem' }}
              >
                Today ({new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })})
              </button>
              <button
                type="button"
                onClick={() => {
                  const tm = new Date();
                  tm.setDate(tm.getDate() + 1);
                  setSelectedDate(tm.toISOString().split('T')[0]);
                }}
                className="chip-btn"
                style={{ fontSize: '0.78rem' }}
              >
                Tomorrow
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="badge-pill blue font-bold" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
              📅 {formattedDateStr} ({dayOfWeek})
            </span>
          </div>
        </div>
      </div>

      {/* Summary Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="summary-metric-box shadow-sm" style={{ borderColor: 'var(--accent-gold)' }}>
          <div className="metric-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.2)' }}>
            <Clock className="icon-gold" />
          </div>
          <div>
            <span className="metric-count" style={{ color: 'var(--accent-gold)' }}>{stats.totalBlocks}</span>
            <span className="metric-desc">Master 45m Demo Blocks</span>
          </div>
        </div>

        <div className="summary-metric-box green-border shadow-sm">
          <div className="metric-icon-wrap green-bg">
            <CheckCircle className="icon text-green" />
          </div>
          <div>
            <span className="metric-count text-green">{stats.free20mSubSlots} / {stats.total20mSubSlots}</span>
            <span className="metric-desc">Free 20-Min Demo Sub-Slots</span>
          </div>
        </div>

        <div className="summary-metric-box shadow-sm" style={{ borderColor: '#3b82f6' }}>
          <div className="metric-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
            <User className="icon" style={{ color: '#60a5fa' }} />
          </div>
          <div>
            <span className="metric-count" style={{ color: '#60a5fa' }}>{stats.booked20mSubSlots}</span>
            <span className="metric-desc">Booked Student Demos</span>
          </div>
        </div>

        <div className="summary-metric-box red-border shadow-sm">
          <div className="metric-icon-wrap red-bg">
            <UserX className="icon text-red" />
          </div>
          <div>
            <span className="metric-count text-red">{stats.ineligibleCoaches}</span>
            <span className="metric-desc">Pink Flagged (No-Demo Ineligible)</span>
          </div>
        </div>
      </div>

      {/* Interactive Filters Bar */}
      <div className="card-glass" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search */}
          <div style={{ position: 'relative', minWidth: '260px', flex: 1 }}>
            <Search className="icon-sm text-muted" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search coach, RM, start time, or remark..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="text-input"
              style={{ paddingLeft: '2.2rem', fontSize: '0.85rem', width: '100%' }}
            />
          </div>

          {/* Preference Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter className="icon-xs text-muted" />
            <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Demo Pref:</span>
            <select
              value={prefFilter}
              onChange={e => setPrefFilter(e.target.value)}
              className="select-input-sm"
            >
              <option value="ALL">All Preferences</option>
              <option value="PREF1">🟢 Preference 1 (Green)</option>
              <option value="PREF2">🟢 Preference 2 (Light Green)</option>
              <option value="PREF3">🟡 Preference 3 (Yellow)</option>
              <option value="NOT_ALLOWED">🔴 Not To Be Given (Red)</option>
            </select>
          </div>

          {/* Eligibility Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Eligibility:</span>
            <select
              value={eligibilityFilter}
              onChange={e => setEligibilityFilter(e.target.value)}
              className="select-input-sm"
            >
              <option value="ALL">All Coaches</option>
              <option value="ELIGIBLE">✅ Demo Eligible Only</option>
              <option value="INELIGIBLE">🔴 Pink Flagged (No-Demo) Only</option>
            </select>
          </div>

          {/* Sub-Slot Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>20m Sub-Slots:</span>
            <select
              value={subSlotStatusFilter}
              onChange={e => setSubSlotStatusFilter(e.target.value)}
              className="select-input-sm"
            >
              <option value="ALL">All Sub-Slots</option>
              <option value="FREE_ONLY">⚡ Has Free 20m Slots</option>
              <option value="BOOKED_ONLY">📋 Has Booked 20m Slots</option>
            </select>
          </div>
        </div>
      </div>

      {/* Daily Slots 6-Column Matrix Table (Matching Google Sheets Daily Slots 2.0 Spec) */}
      <div className="card-glass" style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              {/* Row 1: Merged Date & Day Banner (Cyan #00ffff) */}
              <tr style={{ background: '#00ffff', color: '#0f172a', fontWeight: 'bold' }}>
                <th colSpan={3} style={{ padding: '0.6rem', textAlign: 'center', fontSize: '0.95rem', borderRight: '2px solid #0f172a' }}>
                  📅 {formattedDateStr}
                </th>
                <th colSpan={3} style={{ padding: '0.6rem', textAlign: 'center', fontSize: '0.95rem' }}>
                  🗓️ {dayOfWeek}
                </th>
              </tr>
              {/* Row 2: 6 Working Headings (Yellow #ffff00) */}
              <tr style={{ background: '#ffff00', color: '#0f172a', fontWeight: 'bold', fontSize: '0.82rem' }}>
                <th style={{ padding: '0.65rem', borderRight: '1px solid #cbd5e1', width: '18%' }}>Coach Name</th>
                <th style={{ padding: '0.65rem', borderRight: '1px solid #cbd5e1', width: '12%' }}>Start Time</th>
                <th style={{ padding: '0.65rem', borderRight: '1px solid #cbd5e1', width: '22%' }}>1st 20 Mins</th>
                <th style={{ padding: '0.65rem', borderRight: '1px solid #cbd5e1', width: '22%' }}>2nd 20 Mins</th>
                <th style={{ padding: '0.65rem', borderRight: '1px solid #cbd5e1', width: '13%' }}>Remarks</th>
                <th style={{ padding: '0.65rem', width: '13%' }}>Demo Preference</th>
              </tr>
            </thead>
            <tbody>
              {filteredBlocks.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No eligible X / demo slots found for {formattedDateStr} ({dayOfWeek}) matching active filters.
                  </td>
                </tr>
              ) : (
                filteredBlocks.map((block, idx) => {
                  return (
                    <tr
                      key={block.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        background: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)'
                      }}
                    >
                      {/* Col 1: Coach Name (Pink #EA9999 if Ineligible) */}
                      <td
                        style={{
                          padding: '0.65rem 0.85rem',
                          fontWeight: 700,
                          background: block.is_no_demo_highlighted ? '#EA9999' : 'transparent',
                          color: block.is_no_demo_highlighted ? '#7f1d1d' : 'var(--text-main)',
                          borderRight: '1px solid var(--border-color)'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>{block.coach_name}</span>
                          <span style={{ fontSize: '0.72rem', opacity: 0.8, fontWeight: 'normal' }}>
                            RM: {block.rm_name}
                          </span>
                        </div>
                      </td>

                      {/* Col 2: Start Time (45-min master slot time) */}
                      <td className="font-mono font-bold" style={{ padding: '0.65rem 0.85rem', textAlign: 'center', borderRight: '1px solid var(--border-color)' }}>
                        {block.master_start_time} - {block.master_end_time}
                      </td>

                      {/* Col 3: 1st 20 Mins Sub-Slot */}
                      <td style={{ padding: '0.4rem 0.65rem', borderRight: '1px solid var(--border-color)' }}>
                        <div
                          onClick={() => handleOpenBookingModal(block, 1)}
                          style={{
                            padding: '0.45rem 0.65rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            border: block.sub_slot_1.status === 'BOOKED' ? '1px solid #3b82f6' : '1px dashed var(--border-color)',
                            background: block.sub_slot_1.status === 'BOOKED' ? 'rgba(59, 130, 246, 0.18)' : 'rgba(16, 185, 129, 0.08)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                            <span className="font-mono font-bold" style={{ color: 'var(--text-muted)' }}>
                              ⏱️ {block.sub_slot_1.start_time} - {block.sub_slot_1.end_time}
                            </span>
                            <span
                              className="font-bold"
                              style={{
                                color: block.sub_slot_1.status === 'BOOKED' ? '#3b82f6' : '#10b981',
                                fontSize: '0.72rem'
                              }}
                            >
                              {block.sub_slot_1.status === 'BOOKED' ? '📋 BOOKED' : '⚡ FREE 20m'}
                            </span>
                          </div>
                          {block.sub_slot_1.status === 'BOOKED' && (
                            <div style={{ marginTop: '0.25rem', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                              👤 {block.sub_slot_1.student_name || 'Student Demo'} ({block.sub_slot_1.student_level})
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Col 4: 2nd 20 Mins Sub-Slot */}
                      <td style={{ padding: '0.4rem 0.65rem', borderRight: '1px solid var(--border-color)' }}>
                        <div
                          onClick={() => handleOpenBookingModal(block, 2)}
                          style={{
                            padding: '0.45rem 0.65rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            border: block.sub_slot_2.status === 'BOOKED' ? '1px solid #3b82f6' : '1px dashed var(--border-color)',
                            background: block.sub_slot_2.status === 'BOOKED' ? 'rgba(59, 130, 246, 0.18)' : 'rgba(16, 185, 129, 0.08)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                            <span className="font-mono font-bold" style={{ color: 'var(--text-muted)' }}>
                              ⏱️ {block.sub_slot_2.start_time} - {block.sub_slot_2.end_time}
                            </span>
                            <span
                              className="font-bold"
                              style={{
                                color: block.sub_slot_2.status === 'BOOKED' ? '#3b82f6' : '#10b981',
                                fontSize: '0.72rem'
                              }}
                            >
                              {block.sub_slot_2.status === 'BOOKED' ? '📋 BOOKED' : '⚡ FREE 20m'}
                            </span>
                          </div>
                          {block.sub_slot_2.status === 'BOOKED' && (
                            <div style={{ marginTop: '0.25rem', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                              👤 {block.sub_slot_2.student_name || 'Student Demo'} ({block.sub_slot_2.student_level})
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Col 5: Remarks */}
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center', borderRight: '1px solid var(--border-color)' }}>
                        <span
                          className="badge-pill"
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.2rem 0.5rem',
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: 'var(--accent-gold)',
                            border: '1px solid rgba(245, 158, 11, 0.4)'
                          }}
                        >
                          {block.remarks}
                        </span>
                      </td>

                      {/* Col 6: Demo Preference */}
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            background: block.demo_preference_color,
                            color: '#ffffff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                          }}
                        >
                          {block.demo_preference}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Edit / Book 20-Min Demo Sub-Slot */}
      {editingSubSlotTarget && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-card shadow-2xl" style={{ maxWidth: '480px', background: 'var(--bg-card)', border: '1px solid var(--accent-gold)', borderRadius: '14px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                📋 Book 20-Min Demo Sub-Slot #{editingSubSlotTarget.subSlotNumber}
              </h3>
              <button type="button" onClick={() => setEditingSubSlotTarget(null)} className="btn-secondary" style={{ padding: '0.2rem 0.5rem' }}>
                <X className="icon-sm" />
              </button>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div>Coach: <strong style={{ color: 'var(--text-main)' }}>{editingSubSlotTarget.block.coach_name}</strong></div>
              <div>Master Slot: <strong>{editingSubSlotTarget.block.master_start_time} - {editingSubSlotTarget.block.master_end_time}</strong></div>
              <div>Sub-Slot Time: <strong style={{ color: '#3b82f6' }}>{editingSubSlotTarget.subSlotNumber === 1 ? editingSubSlotTarget.block.sub_slot_1.start_time + ' - ' + editingSubSlotTarget.block.sub_slot_1.end_time : editingSubSlotTarget.block.sub_slot_2.start_time + ' - ' + editingSubSlotTarget.block.sub_slot_2.end_time}</strong></div>
            </div>

            <form onSubmit={handleSaveSubSlotBooking} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label font-bold">Sub-Slot Status:</label>
                <select
                  value={bookingForm.status}
                  onChange={e => setBookingForm({ ...bookingForm, status: e.target.value as any })}
                  className="select-input"
                >
                  <option value="FREE">⚡ FREE 20m Demo Sub-Slot</option>
                  <option value="BOOKED">📋 BOOKED Student Demo</option>
                  <option value="CANCELLED">🚫 CANCELLED</option>
                </select>
              </div>

              {bookingForm.status === 'BOOKED' && (
                <>
                  <div className="form-group">
                    <label className="form-label font-bold">Student Full Name:</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Verma"
                      value={bookingForm.student_name}
                      onChange={e => setBookingForm({ ...bookingForm, student_name: e.target.value })}
                      className="text-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label font-bold">Demo Teaching Level:</label>
                    <select
                      value={bookingForm.student_level}
                      onChange={e => setBookingForm({ ...bookingForm, student_level: e.target.value })}
                      className="select-input"
                    >
                      <option value="Foundation">Foundation Demo</option>
                      <option value="Master">Master Demo</option>
                      <option value="Advanced Part 1">Advanced Part 1</option>
                      <option value="Senior Part 1">Senior Part 1</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label font-bold">Demo Topic / Notes:</label>
                    <input
                      type="text"
                      placeholder="e.g. Opening Principles & Tactical Puzzles"
                      value={bookingForm.demo_topic}
                      onChange={e => setBookingForm({ ...bookingForm, demo_topic: e.target.value })}
                      className="text-input"
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setEditingSubSlotTarget(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Sub-Slot Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
