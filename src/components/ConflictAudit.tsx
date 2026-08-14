import React, { useState } from 'react';
import type { Coach, Slot, ConflictReport, AuditRuleConfig } from '../types';
import { AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck, Zap, Eye, Settings, Filter, X, Ban, Clock } from 'lucide-react';
import { ScheduleGrid } from './ScheduleGrid';
import './AdminPortal.css';

interface ConflictAuditProps {
  conflicts: ConflictReport[];
  coaches: Coach[];
  slots: Slot[];
  onResolveConflict: (conflictId: string) => void;
  onIgnoreConflict: (conflictId: string) => void;
  ruleConfig: AuditRuleConfig;
  onToggleRule: (ruleKey: keyof AuditRuleConfig) => void;
  onGrantCoachException?: (coachName: string) => void;
  onUpdateCoach?: (updatedCoach: Coach) => void;
  onSelectSlot: (slot: Slot) => void;
  onOpenBookingModal: (coach: Coach, day: string, startTime: string, endTime: string) => void;
}

export const ConflictAudit: React.FC<ConflictAuditProps> = ({
  conflicts,
  coaches,
  slots,
  onResolveConflict,
  onIgnoreConflict,
  ruleConfig,
  onToggleRule,
  onGrantCoachException,
  onUpdateCoach,
  onSelectSlot,
  onOpenBookingModal
}) => {
  const [gridOverlayTarget, setGridOverlayTarget] = useState<{ coachName: string; day?: string } | null>(null);
  const [editingCoachWorkingHours, setEditingCoachWorkingHours] = useState<Coach | null>(null);
  const activeRuleCount = Object.values(ruleConfig).filter(Boolean).length;

  return (
    <div className="audit-container">
      {/* Header */}
      <div className="section-header-card shadow-lg">
        <div className="header-icon-box">
          <AlertTriangle className="icon-gold" />
        </div>
        <div className="header-text-box">
          <h2>Schedule Validation & Diagnostic Conflict Audit Engine</h2>
          <p>Real-time system diagnostics scanning for batch overlaps, working capacity limits, daily limits, consecutive session breaches, and rest break violations.</p>
        </div>
      </div>

      {/* Rules & Metrics Summary Bar */}
      <div className="audit-summary-bar card-glass">
        <div className="summary-card-row" style={{ flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', width: '100%' }}>
            {/* Card 1: Active Conflicts */}
            <div className="summary-metric-box red-border shadow-sm">
              <div className="metric-icon-wrap red-bg">
                <ShieldAlert className="icon text-red" />
              </div>
              <div>
                <span className="metric-count text-red">{conflicts.length}</span>
                <span className="metric-desc">Active Diagnostic Conflicts</span>
              </div>
            </div>

            {/* Card 2: Active Validation Rules */}
            <div className="summary-metric-box green-border shadow-sm">
              <div className="metric-icon-wrap green-bg">
                <ShieldCheck className="icon text-green" />
              </div>
              <div>
                <span className="metric-title font-bold">{activeRuleCount} / 7 Validation Rules Active</span>
                <span className="metric-desc">Click rule chips below to toggle ON / OFF</span>
              </div>
            </div>
          </div>

          {/* Interactive Configurable Rule Toggle Chips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Filter className="icon-sm" /> Configure Active Validation Rules (Click to Enable / Disable):
            </span>
            <div className="rule-chips-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => onToggleRule('enableOverlapCheck')}
                className={`chip-btn ${ruleConfig.enableOverlapCheck ? 'active' : ''}`}
                style={{ background: ruleConfig.enableOverlapCheck ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-card)', border: `1px solid ${ruleConfig.enableOverlapCheck ? '#ef4444' : 'var(--border-color)'}`, color: ruleConfig.enableOverlapCheck ? '#fca5a5' : 'var(--text-muted)', cursor: 'pointer' }}
              >
                {ruleConfig.enableOverlapCheck ? '⚡ Overlap Guard (ON)' : '⚡ Overlap Guard (OFF)'}
              </button>

              <button
                type="button"
                onClick={() => onToggleRule('enableWeeklyCapacityCheck')}
                className={`chip-btn ${ruleConfig.enableWeeklyCapacityCheck ? 'active' : ''}`}
                style={{ background: ruleConfig.enableWeeklyCapacityCheck ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-card)', border: `1px solid ${ruleConfig.enableWeeklyCapacityCheck ? '#f59e0b' : 'var(--border-color)'}`, color: ruleConfig.enableWeeklyCapacityCheck ? '#fcd34d' : 'var(--text-muted)', cursor: 'pointer' }}
              >
                {ruleConfig.enableWeeklyCapacityCheck ? '⏱️ Weekly Capacity Limit (ON)' : '⏱️ Weekly Capacity Limit (OFF)'}
              </button>

              <button
                type="button"
                onClick={() => onToggleRule('enableDailyCapacityCheck')}
                className={`chip-btn ${ruleConfig.enableDailyCapacityCheck !== false ? 'active' : ''}`}
                style={{ background: ruleConfig.enableDailyCapacityCheck !== false ? 'rgba(234, 179, 8, 0.2)' : 'var(--bg-card)', border: `1px solid ${ruleConfig.enableDailyCapacityCheck !== false ? '#eab308' : 'var(--border-color)'}`, color: ruleConfig.enableDailyCapacityCheck !== false ? '#fef08a' : 'var(--text-muted)', cursor: 'pointer' }}
              >
                {ruleConfig.enableDailyCapacityCheck !== false ? '📅 Daily Hours Limit (ON)' : '📅 Daily Hours Limit (OFF)'}
              </button>

              <button
                type="button"
                onClick={() => onToggleRule('enableConsecutiveSessionsCheck')}
                className={`chip-btn ${ruleConfig.enableConsecutiveSessionsCheck ? 'active' : ''}`}
                style={{ background: ruleConfig.enableConsecutiveSessionsCheck ? 'rgba(236, 72, 153, 0.2)' : 'var(--bg-card)', border: `1px solid ${ruleConfig.enableConsecutiveSessionsCheck ? '#ec4899' : 'var(--border-color)'}`, color: ruleConfig.enableConsecutiveSessionsCheck ? '#f472b6' : 'var(--text-muted)', cursor: 'pointer' }}
              >
                {ruleConfig.enableConsecutiveSessionsCheck ? '🛑 Max 4 Consecutive Rule (ON)' : '🛑 Max 4 Consecutive Rule (OFF)'}
              </button>

              <button
                type="button"
                onClick={() => onToggleRule('enableRestBreakCheck')}
                className={`chip-btn ${ruleConfig.enableRestBreakCheck ? 'active' : ''}`}
                style={{ background: ruleConfig.enableRestBreakCheck ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-card)', border: `1px solid ${ruleConfig.enableRestBreakCheck ? '#3b82f6' : 'var(--border-color)'}`, color: ruleConfig.enableRestBreakCheck ? '#93c5fd' : 'var(--text-muted)', cursor: 'pointer' }}
              >
                {ruleConfig.enableRestBreakCheck ? '☕ 3h Rest Break Guard (ON)' : '☕ 3h Rest Break Guard (OFF)'}
              </button>

              <button
                type="button"
                onClick={() => onToggleRule('enableMidnightCrossoverCheck')}
                className={`chip-btn ${ruleConfig.enableMidnightCrossoverCheck ? 'active' : ''}`}
                style={{ background: ruleConfig.enableMidnightCrossoverCheck ? 'rgba(168, 85, 247, 0.2)' : 'var(--bg-card)', border: `1px solid ${ruleConfig.enableMidnightCrossoverCheck ? '#a855f7' : 'var(--border-color)'}`, color: ruleConfig.enableMidnightCrossoverCheck ? '#c084fc' : 'var(--text-muted)', cursor: 'pointer' }}
              >
                {ruleConfig.enableMidnightCrossoverCheck ? '🌙 Midnight Rule (ON)' : '🌙 Midnight Rule (OFF)'}
              </button>

              <button
                type="button"
                onClick={() => onToggleRule('enableTierMatchCheck')}
                className={`chip-btn ${ruleConfig.enableTierMatchCheck ? 'active' : ''}`}
                style={{ background: ruleConfig.enableTierMatchCheck ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-card)', border: `1px solid ${ruleConfig.enableTierMatchCheck ? '#10b981' : 'var(--border-color)'}`, color: ruleConfig.enableTierMatchCheck ? '#6ee7b7' : 'var(--text-muted)', cursor: 'pointer' }}
              >
                {ruleConfig.enableTierMatchCheck ? '⭐ Tier Match (ON)' : '⭐ Tier Match (OFF)'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conflicts List */}
      <div className="conflicts-list">
        {conflicts.length === 0 ? (
          <div className="no-conflicts-card card-glass text-center" style={{ padding: '3rem 1.5rem' }}>
            <CheckCircle2 className="icon-lg text-green" style={{ margin: '0 auto 1rem auto', width: '48px', height: '48px' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>All Systems Operational — 0 Conflicts Flagged</h3>
            <p className="text-muted" style={{ fontSize: '0.88rem', maxWidth: '500px', margin: '0 auto' }}>
              All coach schedules satisfy active validation rules. You can edit coach working hours or toggle validation rules anytime.
            </p>
          </div>
        ) : (
          conflicts.map(conf => (
            <div key={conf.id} className="conflict-card card-glass shadow-md" style={{ borderLeft: conf.type === 'OVERLAP' ? '4px solid var(--accent-red)' : '4px solid var(--accent-orange)', marginBottom: '1.25rem' }}>
              <div className="conflict-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div className="conflict-title-row" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <ShieldAlert className={conf.type === 'OVERLAP' ? 'icon text-red' : 'icon text-amber'} />
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '700' }}>{conf.type.replace(/_/g, ' ')}</h4>
                  <span className={`badge-pill ${conf.type === 'OVERLAP' ? 'red' : 'orange'}`}>
                    {conf.type === 'OVERLAP' ? 'HIGH SEVERITY' : 'MEDIUM SEVERITY'}
                  </span>
                </div>
                <span className="badge-day font-bold">{conf.day}</span>
              </div>

              <div className="conflict-body">
                <p className="coach-affected" style={{ fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                  Affected Coach: <strong style={{ color: 'var(--accent-gold)' }}>{conf.coach_name}</strong>
                </p>
                <p className="description text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>{conf.description}</p>
                
                <div className="conflict-details" style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {conf.slot1 && <span className="detail-tag">Conflicting Slot 1: <strong>{conf.slot1}</strong></span>}
                  {conf.slot2 && <span className="detail-tag alt">Conflicting Slot 2: <strong>{conf.slot2}</strong></span>}
                </div>
              </div>

              <div className="conflict-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setGridOverlayTarget({ coachName: conf.coach_name, day: conf.day })}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', borderColor: '#3b82f6', color: '#60a5fa' }}
                  >
                    <Eye className="icon-sm" /> View & Highlight in Grid Overlay
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const coachObj = coaches.find(c => c.name.toLowerCase() === conf.coach_name.toLowerCase() || c.display_name.toLowerCase() === conf.coach_name.toLowerCase());
                      if (coachObj) {
                        setEditingCoachWorkingHours({ ...coachObj });
                      } else if (onGrantCoachException) {
                        onGrantCoachException(conf.coach_name);
                      }
                    }}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', borderColor: '#10b981', color: '#6ee7b7' }}
                  >
                    <Clock className="icon-sm" /> ⚡ Set Working Hours Limits
                  </button>

                  {onGrantCoachException && (
                    <button
                      type="button"
                      onClick={() => onGrantCoachException(conf.coach_name)}
                      className="btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', borderColor: '#f59e0b', color: '#fcd34d' }}
                    >
                      <Settings className="icon-sm" /> Grant Special Coach Override
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button 
                    type="button" 
                    onClick={() => onIgnoreConflict(conf.id)}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                  >
                    <Ban className="icon-sm" /> Ignore Conflict
                  </button>
                  <button 
                    type="button" 
                    onClick={() => onResolveConflict(conf.id)}
                    className="btn-primary"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', fontSize: '0.82rem', padding: '0.45rem 1rem' }}
                  >
                    <Zap className="icon-sm" /> Auto-Resolve Conflict
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* QUICK EDIT MODAL: Working Hours & Capacity Limits Settings */}
      {editingCoachWorkingHours && (
        <div className="modal-overlay" style={{ zIndex: 11000, padding: '1rem' }}>
          <div 
            className="card-glass shadow-2xl" 
            style={{ 
              width: '92vw', 
              maxWidth: '620px', 
              background: 'var(--bg-card)', 
              border: '1px solid var(--accent-gold)', 
              borderRadius: '16px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Clock className="icon-gold" />
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                    Configure Working Hours: <span style={{ color: 'var(--accent-gold)' }}>{editingCoachWorkingHours.display_name}</span>
                  </h3>
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                    {editingCoachWorkingHours.emp_type} ({editingCoachWorkingHours.shift_type || 'Day Shift'}) — Limits apply to capacity conflicts & Multi-Day Finder in real-time.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCoachWorkingHours(null)}
                className="btn-secondary"
                style={{ padding: '0.35rem 0.65rem', borderColor: '#ef4444', color: '#fca5a5' }}
              >
                <X className="icon-sm" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (onUpdateCoach) {
                  onUpdateCoach(editingCoachWorkingHours);
                }
                setEditingCoachWorkingHours(null);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label font-bold">
                    Weekly Hours Limit (hrs/week):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="80"
                    value={editingCoachWorkingHours.custom_weekly_hours_limit ?? (editingCoachWorkingHours.emp_type === 'Part Time' ? 18 : 36)}
                    onChange={e => setEditingCoachWorkingHours({
                      ...editingCoachWorkingHours,
                      custom_weekly_hours_limit: parseFloat(e.target.value) || 0
                    })}
                    className="text-input"
                    required
                  />
                  <span className="text-muted" style={{ fontSize: '0.73rem' }}>
                    Default: {editingCoachWorkingHours.emp_type === 'Part Time' ? '18 hrs' : '36 hrs'}
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label font-bold">
                    Daily Hours Limit (hrs/day):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={editingCoachWorkingHours.custom_daily_hours_limit ?? (editingCoachWorkingHours.class_hours_per_day || (editingCoachWorkingHours.emp_type === 'Part Time' ? 4.5 : 6.0))}
                    onChange={e => setEditingCoachWorkingHours({
                      ...editingCoachWorkingHours,
                      custom_daily_hours_limit: parseFloat(e.target.value) || 0,
                      class_hours_per_day: parseFloat(e.target.value) || 0
                    })}
                    className="text-input"
                    required
                  />
                  <span className="text-muted" style={{ fontSize: '0.73rem' }}>
                    Default: {editingCoachWorkingHours.emp_type === 'Part Time' ? '4.5 hrs' : '6.0 hrs'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label font-bold">
                    Max Daily Classes:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={editingCoachWorkingHours.max_daily_classes || (editingCoachWorkingHours.emp_type === 'Part Time' ? 6 : 8)}
                    onChange={e => setEditingCoachWorkingHours({
                      ...editingCoachWorkingHours,
                      max_daily_classes: parseInt(e.target.value, 10) || 8
                    })}
                    className="text-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label font-bold">
                    Employment Type:
                  </label>
                  <select
                    value={editingCoachWorkingHours.emp_type}
                    onChange={e => setEditingCoachWorkingHours({
                      ...editingCoachWorkingHours,
                      emp_type: e.target.value as any
                    })}
                    className="select-input"
                  >
                    <option value="Part Time">Part Time</option>
                    <option value="Full Time">Full Time</option>
                  </select>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span className="font-bold" style={{ fontSize: '0.82rem', color: 'var(--accent-gold)' }}>Operational Exceptions:</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!!editingCoachWorkingHours.exempt_capacity_limit}
                    onChange={e => setEditingCoachWorkingHours({
                      ...editingCoachWorkingHours,
                      exempt_capacity_limit: e.target.checked
                    })}
                  />
                  <span>Exempt from Weekly & Daily Capacity Limit checks</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!!editingCoachWorkingHours.exempt_consecutive_limit}
                    onChange={e => setEditingCoachWorkingHours({
                      ...editingCoachWorkingHours,
                      exempt_consecutive_limit: e.target.checked
                    })}
                  />
                  <span>Exempt from Max 4 Consecutive Classes rule</span>
                </label>
              </div>

              <div className="form-group">
                <label className="form-label font-bold">Special Notes / Reason for Custom Hours:</label>
                <input
                  type="text"
                  placeholder="e.g. Approved overtime agreement, special contract..."
                  value={editingCoachWorkingHours.special_exception_notes || ''}
                  onChange={e => setEditingCoachWorkingHours({
                    ...editingCoachWorkingHours,
                    special_exception_notes: e.target.value
                  })}
                  className="text-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingCoachWorkingHours(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  <Zap className="icon-sm" /> Save Working Hours & Recalculate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OVERLAY MODAL: Highlighted Schedule Grid pop-up within Conflict Audit */}
      {gridOverlayTarget && (
        <div className="modal-overlay" style={{ zIndex: 10000, padding: '1rem' }}>
          <div 
            className="card-glass shadow-2xl" 
            style={{ 
              width: '96vw', 
              maxWidth: '1500px', 
              maxHeight: '92vh', 
              display: 'flex', 
              flexDirection: 'column', 
              background: 'var(--bg-card)', 
              border: '1px solid var(--accent-gold)', 
              borderRadius: '16px',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Eye className="icon-gold" />
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                    Schedule Grid Inspection: <span style={{ color: 'var(--accent-gold)' }}>{gridOverlayTarget.coachName}</span>
                  </h3>
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                    Conflicting slots are highlighted in pulsing red. You can inspect or edit slots directly below.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGridOverlayTarget(null)}
                className="btn-secondary"
                style={{ padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: '#ef4444', color: '#fca5a5' }}
              >
                <X className="icon-sm" /> Close Grid Overlay
              </button>
            </div>

            {/* Modal Body: Embedded ScheduleGrid */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
              <ScheduleGrid
                coaches={coaches}
                slots={slots}
                conflicts={conflicts}
                highlightedCoachTarget={gridOverlayTarget}
                onSelectSlot={onSelectSlot}
                onOpenBookingModal={onOpenBookingModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
