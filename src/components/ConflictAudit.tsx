import React, { useState } from 'react';
import type { Coach, Slot, ConflictReport, AuditRuleConfig } from '../types';
import { AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck, Zap, Eye, Settings, Filter, X, Ban } from 'lucide-react';
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
  onSelectSlot,
  onOpenBookingModal
}) => {
  const [gridOverlayTarget, setGridOverlayTarget] = useState<{ coachName: string; day?: string } | null>(null);
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
          <p>Real-time system diagnostics scanning for batch overlaps, working capacity limits, consecutive session breaches, and rest break violations.</p>
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
                <span className="metric-title font-bold">{activeRuleCount} / 6 Validation Rules Active</span>
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
              All coach schedules satisfy active validation rules. You can toggle validation rules or grant special trainer overrides anytime.
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
