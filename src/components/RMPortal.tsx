import React, { useState, useMemo } from 'react';
import type { Coach, Slot, RelationshipManager } from '../types';
import { Users, BookOpen, Clock, Search, UserCheck, Mail, Phone, ExternalLink } from 'lucide-react';
import { isActiveClassSlot, getSlotDurationMinutes } from '../utils/conflictDetector';
import './CoachProfile.css';

interface RMPortalProps {
  coaches: Coach[];
  slots: Slot[];
  rmsList: RelationshipManager[];
  onSelectCoachForProfile: (coachId: number) => void;
}

export const RMPortal: React.FC<RMPortalProps> = ({
  coaches,
  slots,
  rmsList,
  onSelectCoachForProfile
}) => {
  const [selectedRmId, setSelectedRmId] = useState<number>(() => rmsList[0]?.id || 1);
  const [rmSearchQuery, setRmSearchQuery] = useState<string>('');
  const [coachSearchQuery, setCoachSearchQuery] = useState<string>('');

  // Selected RM object
  const currentRm = useMemo(() => {
    return rmsList.find(rm => rm.id === selectedRmId) || rmsList[0];
  }, [rmsList, selectedRmId]);

  // Coaches assigned to this RM (where coach.rm_name === currentRm.name or matches)
  const currentRmCoaches = useMemo(() => {
    if (!currentRm) return [];
    return coaches.filter(c => {
      const cRm = (c.rm_name || '').toLowerCase().trim();
      const rmName = currentRm.name.toLowerCase().trim();
      return cRm === rmName || cRm.includes(rmName) || rmName.includes(cRm);
    });
  }, [coaches, currentRm]);

  // Metrics for current selected RM
  const currentRmMetrics = useMemo(() => {
    let totalBatches = 0;
    let totalMins = 0;

    currentRmCoaches.forEach(c => {
      slots.filter(s => s.coach_id === c.id).forEach(s => {
        if (isActiveClassSlot(s)) {
          totalBatches++;
          totalMins += getSlotDurationMinutes(s.start_time, s.end_time);
        }
      });
    });

    return {
      totalCoaches: currentRmCoaches.length,
      totalBatches,
      totalWeeklyHours: +(totalMins / 60).toFixed(1)
    };
  }, [currentRmCoaches, slots]);

  // Filtered RMs directory
  const filteredRms = useMemo(() => {
    if (!rmSearchQuery.trim()) return rmsList;
    const q = rmSearchQuery.toLowerCase().trim();
    return rmsList.filter(rm => rm.name.toLowerCase().includes(q) || rm.employee_id.toLowerCase().includes(q));
  }, [rmsList, rmSearchQuery]);

  // Filtered coaches under selected RM
  const filteredCoachRoster = useMemo(() => {
    if (!coachSearchQuery.trim()) return currentRmCoaches;
    const q = coachSearchQuery.toLowerCase().trim();
    return currentRmCoaches.filter(
      c => c.display_name.toLowerCase().includes(q) || c.employee_id.toLowerCase().includes(q) || c.tier.toLowerCase().includes(q)
    );
  }, [currentRmCoaches, coachSearchQuery]);

  return (
    <div className="audit-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="section-header-card shadow-lg" style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))', border: '1px solid #3b82f6' }}>
        <div className="header-icon-box" style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6' }}>
          <span style={{ fontSize: '1.8rem' }}>🤝</span>
        </div>
        <div className="header-text-box" style={{ flex: 1 }}>
          <h2>Relationship Managers (RM) Directory & Profiles Hub</h2>
          <p>
            Dedicated portal for Relationship Managers who handle parent communications, client relations, and student retention.
            Inspect RM profiles and view all coaches assigned to each RM.
          </p>
        </div>
      </div>

      {/* RMs Directory Cards Row */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🤝 Relationship Managers Directory ({filteredRms.length} Active RMs):
          </h3>

          <div style={{ position: 'relative', minWidth: '260px' }}>
            <Search className="icon-sm text-muted" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search RM name or ID..."
              value={rmSearchQuery}
              onChange={e => setRmSearchQuery(e.target.value)}
              className="text-input"
              style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {/* RMs Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', maxHeight: '340px', overflowY: 'auto', paddingRight: '0.25rem' }}>
          {filteredRms.map(rm => {
            const isSelected = selectedRmId === rm.id;
            const coachCount = coaches.filter(c => {
              const cRm = (c.rm_name || '').toLowerCase().trim();
              const rmName = rm.name.toLowerCase().trim();
              return cRm === rmName || cRm.includes(rmName) || rmName.includes(cRm);
            }).length;

            return (
              <div
                key={rm.id}
                onClick={() => setSelectedRmId(rm.id)}
                className="card-glass"
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  border: isSelected ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                  background: isSelected ? 'rgba(59, 130, 246, 0.14)' : 'rgba(11, 19, 43, 0.6)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 0 16px rgba(59, 130, 246, 0.35)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>🤝</span>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: isSelected ? '#60a5fa' : 'var(--text-main)' }}>
                      {rm.display_name}
                    </h4>
                    <span className="badge-pill blue" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                      {rm.employee_id}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Coaches Managed:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{coachCount} Coaches</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Selected RM Overview & Coaches Roster Panel */}
      {currentRm && (
        <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          {/* Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 'bold', color: '#fff', border: '2px solid #60a5fa' }}>
                🤝
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{currentRm.display_name}</h3>
                  <span className="badge-pill blue font-bold" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                    Relationship Manager ({currentRm.employee_id})
                  </span>
                </div>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span><Mail className="icon-sm text-muted" /> {currentRm.email}</span>
                  <span><Phone className="icon-sm text-muted" /> {currentRm.phone}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Executive Summary Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="summary-metric-box shadow-sm" style={{ padding: '1rem', borderColor: '#3b82f6' }}>
              <div className="metric-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                <Users className="icon" style={{ color: '#60a5fa' }} />
              </div>
              <div>
                <span className="metric-count" style={{ color: '#60a5fa' }}>{currentRmMetrics.totalCoaches}</span>
                <span className="metric-desc">Coaches under {currentRm.display_name}</span>
              </div>
            </div>

            <div className="summary-metric-box green-border shadow-sm" style={{ padding: '1rem' }}>
              <div className="metric-icon-wrap green-bg">
                <BookOpen className="icon text-green" />
              </div>
              <div>
                <span className="metric-count text-green">{currentRmMetrics.totalBatches}</span>
                <span className="metric-desc">Active Batches under RM</span>
              </div>
            </div>

            <div className="summary-metric-box shadow-sm" style={{ padding: '1rem', borderColor: '#a855f7' }}>
              <div className="metric-icon-wrap" style={{ background: 'rgba(168, 85, 247, 0.2)' }}>
                <Clock className="icon" style={{ color: '#c084fc' }} />
              </div>
              <div>
                <span className="metric-count" style={{ color: '#c084fc' }}>{currentRmMetrics.totalWeeklyHours}h</span>
                <span className="metric-desc">Weekly Active Class Hours</span>
              </div>
            </div>
          </div>

          {/* Coaches List under this RM */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck className="icon-blue" /> Coaches Managed by {currentRm.display_name} ({filteredCoachRoster.length} Coaches):
            </h4>

            <div style={{ position: 'relative', minWidth: '280px' }}>
              <Search className="icon-sm text-muted" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search coach name, ID, or tier..."
                value={coachSearchQuery}
                onChange={e => setCoachSearchQuery(e.target.value)}
                className="text-input"
                style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(11, 19, 43, 0.9)', color: '#60a5fa', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Coach Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Emp ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Classification</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Tier</th>
                  <th style={{ padding: '0.75rem 1rem' }}>FIDE Rating</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Assigned Trainer</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Shift Type</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Weekly Working Load</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoachRoster.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No coaches matching query under {currentRm.display_name}.
                    </td>
                  </tr>
                ) : (
                  filteredCoachRoster.map(coach => {
                    let activeMins = 0;
                    slots.filter(s => s.coach_id === coach.id).forEach(s => {
                      if (isActiveClassSlot(s)) {
                        activeMins += getSlotDurationMinutes(s.start_time, s.end_time);
                      }
                    });
                    const activeHours = +(activeMins / 60).toFixed(1);
                    const limit = coach.emp_type === 'Part Time' ? 18 : 36;
                    const isExceeded = activeHours > limit;

                    return (
                      <tr key={coach.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15, 23, 42, 0.4)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {coach.display_name}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{coach.employee_id}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{coach.emp_type} ({coach.employment_model})</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className="badge-tier">{coach.tier}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>⭐ {coach.standard_rating}</td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
                          👑 {coach.trainer_manager || 'Sujay Mondal'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className={`badge-shift-type ${coach.shift_days === 2 ? 'badge-night-shift' : 'badge-day-shift'}`} style={{ fontSize: '0.7rem' }}>
                            {coach.shift_days === 2 ? '🌙 Night Shift' : '☀️ Day Shift'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className="font-bold" style={{ color: isExceeded ? '#ef4444' : '#10b981' }}>
                            {activeHours} / {limit} hrs {isExceeded && '⚠️'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => onSelectCoachForProfile(coach.id)}
                            className="btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderColor: '#3b82f6', color: '#60a5fa' }}
                          >
                            <ExternalLink className="icon-sm" /> View Profile
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
