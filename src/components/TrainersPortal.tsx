import React, { useState, useMemo } from 'react';
import type { Coach, Slot } from '../types';
import { isTrainerOrHeadTrainer } from '../utils/trainerUtils';
import { Users, ShieldAlert, BookOpen, Clock, Search, PlusCircle, UserPlus, X } from 'lucide-react';
import { isActiveClassSlot, getSlotDurationMinutes } from '../utils/conflictDetector';
import { ScheduleGrid } from './ScheduleGrid';
import './CoachProfile.css';

interface TrainersPortalProps {
  coaches: Coach[];
  slots: Slot[];
  onOpenBookingModal: (coach: Coach, day: string, startTime: string, endTime: string) => void;
  onSelectCoachForProfile: (coachId: number) => void;
  onUpdateCoach: (updatedCoach: Coach) => void;
  onAddCoach: (newCoach: Coach) => void;
  onSelectSlot: (slot: Slot) => void;
}

export const TrainersPortal: React.FC<TrainersPortalProps> = ({
  coaches,
  slots,
  onOpenBookingModal,
  onSelectCoachForProfile,
  onUpdateCoach,
  onAddCoach,
  onSelectSlot
}) => {
  // Extract all trainers & head trainers from coaches list
  const trainersList = useMemo(() => {
    return coaches.filter(c => isTrainerOrHeadTrainer(c));
  }, [coaches]);

  const [selectedTrainerId, setSelectedTrainerId] = useState<number>(() => {
    return trainersList[0]?.id || 1;
  });

  const [rosterSearchQuery, setRosterSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'HEAD_TRAINER' | 'TRAINER'>('ALL');
  
  // Modals state
  const [isNewTrainerModalOpen, setIsNewTrainerModalOpen] = useState(false);
  const [isAssignCoachModalOpen, setIsAssignCoachModalOpen] = useState(false);
  const [newTrainerData, setNewTrainerData] = useState({
    name: '',
    role_type: 'Trainer' as 'Trainer' | 'Head Trainer',
    emp_type: 'Full Time' as 'Full Time' | 'Part Time',
    tier: 'Tier 5' as const
  });
  const [selectedCoachToAssign, setSelectedCoachToAssign] = useState<number | null>(null);

  // Active selected trainer
  const currentTrainer = useMemo(() => {
    return coaches.find(c => c.id === selectedTrainerId) || trainersList[0] || coaches[0];
  }, [coaches, selectedTrainerId, trainersList]);

  // Coaches assigned under the current selected trainer
  const currentTeamCoaches = useMemo(() => {
    if (!currentTrainer) return [];
    return coaches.filter(c => {
      if (c.id === currentTrainer.id) return false;
      const mgr = (c.trainer_manager || '').toLowerCase().trim();
      const tName = currentTrainer.name.toLowerCase().trim();
      const tDisplay = currentTrainer.display_name.toLowerCase().trim();
      return mgr === tName || mgr === tDisplay || mgr.includes(tName) || tName.includes(mgr);
    });
  }, [coaches, currentTrainer]);

  // Unassigned or reassignable coaches list
  const availableCoachesToAssign = useMemo(() => {
    return coaches.filter(c => !isTrainerOrHeadTrainer(c) && c.trainer_manager !== currentTrainer.name);
  }, [coaches, currentTrainer]);

  // Calculate metrics for selected trainer and team
  const currentMetrics = useMemo(() => {
    if (!currentTrainer) return { trainerActiveHours: 0, trainerDirectClasses: 0, totalCoachesInTeam: 0, totalTeamBatches: 0, totalTeamWeeklyHours: 0, overCapacityCount: 0 };

    // Trainer's direct emergency sub classes
    const trainerSlots = slots.filter(s => s.coach_id === currentTrainer.id);
    let trainerActiveMins = 0;
    let trainerDirectClasses = 0;
    trainerSlots.forEach(s => {
      if (isActiveClassSlot(s)) {
        trainerDirectClasses++;
        trainerActiveMins += getSlotDurationMinutes(s.start_time, s.end_time);
      }
    });

    // Team totals
    let totalTeamBatches = 0;
    let totalTeamMins = 0;
    let overCapacityCount = 0;

    currentTeamCoaches.forEach(c => {
      let cMins = 0;
      slots.filter(s => s.coach_id === c.id).forEach(s => {
        if (isActiveClassSlot(s)) {
          totalTeamBatches++;
          cMins += getSlotDurationMinutes(s.start_time, s.end_time);
        }
      });
      totalTeamMins += cMins;
      const limit = c.emp_type === 'Part Time' ? 18 : 36;
      if ((cMins / 60) > limit) overCapacityCount++;
    });

    return {
      trainerActiveHours: +(trainerActiveMins / 60).toFixed(1),
      trainerDirectClasses,
      totalCoachesInTeam: currentTeamCoaches.length,
      totalTeamBatches,
      totalTeamWeeklyHours: +(totalTeamMins / 60).toFixed(1),
      overCapacityCount
    };
  }, [currentTrainer, currentTeamCoaches, slots]);

  // Filtered trainers cards list
  const filteredTrainersList = useMemo(() => {
    return trainersList.filter(t => {
      if (roleFilter === 'HEAD_TRAINER' && t.role_type !== 'Head Trainer' && !t.is_head_trainer) return false;
      if (roleFilter === 'TRAINER' && t.role_type === 'Head Trainer') return false;
      return true;
    });
  }, [trainersList, roleFilter]);

  // Filtered team roster table by search query
  const filteredTeamCoaches = useMemo(() => {
    if (!rosterSearchQuery.trim()) return currentTeamCoaches;
    const q = rosterSearchQuery.toLowerCase().trim();
    return currentTeamCoaches.filter(
      c => c.display_name.toLowerCase().includes(q) || c.employee_id.toLowerCase().includes(q) || c.tier.toLowerCase().includes(q)
    );
  }, [currentTeamCoaches, rosterSearchQuery]);

  // Handlers
  const handleCreateNewTrainer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrainerData.name.trim()) return;

    const nextId = Math.max(...coaches.map(c => c.id), 0) + 1;
    const isHead = newTrainerData.role_type === 'Head Trainer';
    
    const created: Coach = {
      id: nextId,
      name: newTrainerData.name.trim(),
      display_name: newTrainerData.name.trim(),
      sf_coach_name: newTrainerData.name.trim(),
      category: isHead ? 'Head Trainer' : 'Trainer',
      emp_type: newTrainerData.emp_type,
      shift_days: 1,
      shift_type: 'Day Shift',
      standard_rating: 2000,
      tier: newTrainerData.tier,
      can_teach_upto: 'All Levels',
      demo_preference: 'Preference 1',
      demo_preference_color: '#10b981',
      languages: 'English, Hindi',
      employee_id: `CUSTOM-TRN-${1000 + nextId}`,
      trainer_manager: isHead ? 'Executive Ops' : 'Shubham Kumthekar',
      class_hours_per_day: 6.0,
      max_daily_classes: 4,
      max_daily_demos: 6,
      employment_model: 'Salaried',
      is_active: true,
      is_trainer: true,
      is_head_trainer: isHead,
      role_type: newTrainerData.role_type
    };

    onAddCoach(created);
    setSelectedTrainerId(created.id);
    setIsNewTrainerModalOpen(false);
    setNewTrainerData({ name: '', role_type: 'Trainer', emp_type: 'Full Time', tier: 'Tier 5' });
  };

  const handleAssignCoachToCurrentTrainer = () => {
    if (!selectedCoachToAssign || !currentTrainer) return;
    const coachToUpdate = coaches.find(c => c.id === selectedCoachToAssign);
    if (coachToUpdate) {
      onUpdateCoach({
        ...coachToUpdate,
        trainer_manager: currentTrainer.name
      });
    }
    setIsAssignCoachModalOpen(false);
    setSelectedCoachToAssign(null);
  };

  const handleRemoveCoachFromTrainer = (coachToRemove: Coach) => {
    if (confirm(`Remove ${coachToRemove.display_name} from ${currentTrainer.name}'s team?`)) {
      onUpdateCoach({
        ...coachToRemove,
        trainer_manager: 'Unassigned'
      });
    }
  };

  const handlePromoteCoachToTrainer = (coachToPromote: Coach, newRole: 'Trainer' | 'Head Trainer') => {
    if (confirm(`Promote ${coachToPromote.display_name} to ${newRole}?`)) {
      onUpdateCoach({
        ...coachToPromote,
        is_trainer: true,
        is_head_trainer: newRole === 'Head Trainer',
        role_type: newRole,
        category: newRole
      });
    }
  };

  return (
    <div className="audit-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="section-header-card shadow-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--accent-gold)' }}>
        <div className="header-icon-box" style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b' }}>
          <span style={{ fontSize: '1.8rem' }}>👑</span>
        </div>
        <div className="header-text-box" style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2>Trainers Operations & Team Roster Hub</h2>
              <p>
                Head Trainer: <strong>Shubham Kumthekar</strong> | Trainers: <strong>Sujay Mondal, Sairaj Chittal, Pratik Gengaje, Pratik Gaitonde, Vatsal Shah, Harsh Ghag</strong>.
                Each Trainer manages ~40 coaches. View trainer schedules, manage team assignments, and assign backup classes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsNewTrainerModalOpen(true)}
              className="btn-primary font-bold"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', padding: '0.55rem 1.1rem', fontSize: '0.85rem' }}
            >
              <UserPlus className="icon-sm" /> Add New Trainer / Head Trainer
            </button>
          </div>
        </div>
      </div>

      {/* Role Filter & Trainers Cards Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            👑 Trainers Directory ({filteredTrainersList.length} Active Trainers):
          </h3>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setRoleFilter('ALL')}
              className={`chip-btn ${roleFilter === 'ALL' ? 'active' : ''}`}
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem', cursor: 'pointer' }}
            >
              All Trainers ({trainersList.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('HEAD_TRAINER')}
              className={`chip-btn ${roleFilter === 'HEAD_TRAINER' ? 'active' : ''}`}
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem', cursor: 'pointer', background: roleFilter === 'HEAD_TRAINER' ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-card)', color: '#fcd34d' }}
            >
              👑 Head Trainers
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('TRAINER')}
              className={`chip-btn ${roleFilter === 'TRAINER' ? 'active' : ''}`}
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem', cursor: 'pointer' }}
            >
              ⭐ Trainers
            </button>
          </div>
        </div>

        {/* Trainers Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {filteredTrainersList.map(trn => {
            const isSelected = selectedTrainerId === trn.id;
            const isHead = trn.role_type === 'Head Trainer' || trn.is_head_trainer;
            const teamSize = coaches.filter(c => {
              if (c.id === trn.id) return false;
              const mgr = (c.trainer_manager || '').toLowerCase().trim();
              return mgr === trn.name.toLowerCase().trim() || mgr.includes(trn.name.toLowerCase().trim());
            }).length;

            return (
              <div
                key={trn.id}
                onClick={() => setSelectedTrainerId(trn.id)}
                className="card-glass"
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  border: isSelected ? '2px solid var(--accent-gold)' : '1px solid var(--border-color)',
                  background: isSelected ? 'rgba(245, 158, 11, 0.14)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 0 16px rgba(245, 158, 11, 0.35)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>{isHead ? '👑' : '⭐'}</span>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: isSelected ? 'var(--accent-gold)' : 'var(--text-main)' }}>
                      {trn.display_name}
                    </h4>
                    <span className={`badge-pill ${isHead ? 'gold' : 'blue'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                      {isHead ? '👑 Head Trainer' : '⭐ Trainer'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Coaches Team:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{teamSize} Coaches</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Selected Trainer Details, Metrics & Actions */}
      {currentTrainer && (
        <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          {/* Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: currentTrainer.role_type === 'Head Trainer' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 'bold', color: '#fff', border: '2px solid var(--accent-gold)' }}>
                {currentTrainer.role_type === 'Head Trainer' ? '👑' : '⭐'}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{currentTrainer.display_name}</h3>
                  <span className={`badge-pill ${currentTrainer.role_type === 'Head Trainer' ? 'gold' : 'blue'} font-bold`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                    {currentTrainer.role_type === 'Head Trainer' ? '👑 Head Trainer' : '⭐ Trainer'}
                  </span>
                </div>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  Supervising <strong>{currentMetrics.totalCoachesInTeam} Coaches</strong> | Backup Emergency Teaching Status: 
                  <strong style={{ color: currentMetrics.trainerDirectClasses > 0 ? '#f59e0b' : '#10b981', marginLeft: '0.3rem' }}>
                    {currentMetrics.trainerDirectClasses > 0 ? `⚡ Assigned ${currentMetrics.trainerDirectClasses} Backup Classes (${currentMetrics.trainerActiveHours}h)` : '🟢 Available for Emergency Backup'}
                  </strong>
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setIsAssignCoachModalOpen(true)}
                className="btn-secondary font-bold"
                style={{ fontSize: '0.85rem', padding: '0.55rem 1rem', borderColor: '#3b82f6', color: '#60a5fa' }}
              >
                <UserPlus className="icon-sm" /> Add Coach under {currentTrainer.display_name}
              </button>
              <button
                type="button"
                onClick={() => onOpenBookingModal(currentTrainer, 'Monday', '6:00 PM', '6:45 PM')}
                className="btn-primary"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', fontSize: '0.85rem', padding: '0.55rem 1.1rem' }}
              >
                <PlusCircle className="icon-sm" /> Assign Emergency Backup Class
              </button>
            </div>
          </div>

          {/* Executive Summary Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="summary-metric-box green-border shadow-sm" style={{ padding: '1rem' }}>
              <div className="metric-icon-wrap green-bg">
                <Users className="icon text-green" />
              </div>
              <div>
                <span className="metric-count text-green">{currentMetrics.totalCoachesInTeam}</span>
                <span className="metric-desc">Coaches under {currentTrainer.display_name}</span>
              </div>
            </div>

            <div className="summary-metric-box shadow-sm" style={{ padding: '1rem', borderColor: '#3b82f6' }}>
              <div className="metric-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                <BookOpen className="icon" style={{ color: '#60a5fa' }} />
              </div>
              <div>
                <span className="metric-count" style={{ color: '#60a5fa' }}>{currentMetrics.totalTeamBatches}</span>
                <span className="metric-desc">Total Active Batches in Team</span>
              </div>
            </div>

            <div className="summary-metric-box shadow-sm" style={{ padding: '1rem', borderColor: '#a855f7' }}>
              <div className="metric-icon-wrap" style={{ background: 'rgba(168, 85, 247, 0.2)' }}>
                <Clock className="icon" style={{ color: '#c084fc' }} />
              </div>
              <div>
                <span className="metric-count" style={{ color: '#c084fc' }}>{currentMetrics.totalTeamWeeklyHours}h</span>
                <span className="metric-desc">Weekly Active Teaching Hours</span>
              </div>
            </div>

            <div className="summary-metric-box red-border shadow-sm" style={{ padding: '1rem' }}>
              <div className="metric-icon-wrap red-bg">
                <ShieldAlert className="icon text-red" />
              </div>
              <div>
                <span className="metric-count text-red">{currentMetrics.overCapacityCount}</span>
                <span className="metric-desc">Coaches Over Weekly Capacity</span>
              </div>
            </div>
          </div>

          {/* Team Roster Section Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users className="icon-gold" /> Coaches Team Roster under {currentTrainer.display_name} ({filteredTeamCoaches.length} Coaches):
            </h4>

            <div style={{ position: 'relative', minWidth: '280px' }}>
              <Search className="icon-sm text-muted" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search coach name, ID, or tier..."
                value={rosterSearchQuery}
                onChange={e => setRosterSearchQuery(e.target.value)}
                className="text-input"
                style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Team Roster Table */}
          <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', color: 'var(--accent-gold)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Coach Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Emp ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Classification</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Tier</th>
                  <th style={{ padding: '0.75rem 1rem' }}>FIDE Rating</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Shift Type</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Weekly Working Load</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions & Management</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeamCoaches.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No coaches matching query under {currentTrainer.display_name}.
                    </td>
                  </tr>
                ) : (
                  filteredTeamCoaches.map(coach => {
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
                      <tr key={coach.id} style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {coach.display_name}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{coach.employee_id}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{coach.emp_type} ({coach.employment_model})</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className="badge-tier">{coach.tier}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>⭐ {coach.standard_rating}</td>
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
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => onSelectCoachForProfile(coach.id)}
                              className="btn-secondary"
                              style={{ fontSize: '0.75rem', padding: '0.3rem 0.5rem' }}
                            >
                              Profile
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePromoteCoachToTrainer(coach, 'Trainer')}
                              className="btn-secondary"
                              style={{ fontSize: '0.75rem', padding: '0.3rem 0.5rem', borderColor: '#f59e0b', color: '#fcd34d' }}
                            >
                              Promote to Trainer
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveCoachFromTrainer(coach)}
                              className="btn-secondary"
                              style={{ fontSize: '0.75rem', padding: '0.3rem 0.5rem', borderColor: '#ef4444', color: '#fca5a5' }}
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Embedded Schedule Grid for Current Trainer */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🗓️ Individual Schedule Grid for Trainer: {currentTrainer.display_name}
            </h4>
            <ScheduleGrid
              coaches={coaches}
              slots={slots}
              highlightedCoachTarget={{ coachName: currentTrainer.name }}
              onSelectSlot={onSelectSlot}
              onOpenBookingModal={onOpenBookingModal}
            />
          </div>
        </div>
      )}

      {/* MODAL 1: Add New Trainer / Head Trainer Modal */}
      {isNewTrainerModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-card shadow-2xl" style={{ maxWidth: '500px', background: 'var(--bg-card)', border: '1px solid var(--accent-gold)', borderRadius: '14px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>➕ Register New Trainer / Head Trainer</h3>
              <button onClick={() => setIsNewTrainerModalOpen(false)} className="btn-secondary" style={{ padding: '0.2rem 0.5rem' }}>
                <X className="icon-sm" />
              </button>
            </div>

            <form onSubmit={handleCreateNewTrainer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label font-bold">Trainer Full Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newTrainerData.name}
                  onChange={e => setNewTrainerData({ ...newTrainerData, name: e.target.value })}
                  className="text-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label font-bold">Role Classification:</label>
                <select
                  value={newTrainerData.role_type}
                  onChange={e => setNewTrainerData({ ...newTrainerData, role_type: e.target.value as any })}
                  className="select-input"
                >
                  <option value="Trainer">⭐ Trainer</option>
                  <option value="Head Trainer">👑 Head Trainer (Manages Trainers)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label font-bold">Employment Type:</label>
                <select
                  value={newTrainerData.emp_type}
                  onChange={e => setNewTrainerData({ ...newTrainerData, emp_type: e.target.value as any })}
                  className="select-input"
                >
                  <option value="Full Time">Full Time (36h/week)</option>
                  <option value="Part Time">Part Time (18h/week)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsNewTrainerModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  Create Trainer Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add / Assign Coach under Current Trainer */}
      {isAssignCoachModalOpen && currentTrainer && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-card shadow-2xl" style={{ maxWidth: '500px', background: 'var(--bg-card)', border: '1px solid var(--accent-gold)', borderRadius: '14px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>➕ Add Coach under {currentTrainer.display_name}</h3>
              <button onClick={() => setIsAssignCoachModalOpen(false)} className="btn-secondary" style={{ padding: '0.2rem 0.5rem' }}>
                <X className="icon-sm" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label font-bold">Select Coach to Assign:</label>
                <select
                  value={selectedCoachToAssign || ''}
                  onChange={e => setSelectedCoachToAssign(parseInt(e.target.value, 10))}
                  className="select-input"
                >
                  <option value="">-- Choose Coach --</option>
                  {availableCoachesToAssign.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.display_name} ({c.emp_type} | Current Manager: {c.trainer_manager})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsAssignCoachModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedCoachToAssign}
                  onClick={handleAssignCoachToCurrentTrainer}
                  className="btn-primary"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  Assign to {currentTrainer.display_name}'s Team
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
