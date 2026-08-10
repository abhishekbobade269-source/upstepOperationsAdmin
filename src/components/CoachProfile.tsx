import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Coach, Slot } from '../types';
import { User, Edit3, Calendar, AlertCircle, BookOpen, Clock, UserCheck, Save } from 'lucide-react';
import './CoachProfile.css';

interface CoachProfileProps {
  coaches: Coach[];
  slots: Slot[];
  onUpdateCoach: (updatedCoach: Coach) => void;
  onSelectSlot: (slot: Slot) => void;
  onOpenBookingModal: (coach: Coach, day: string, startTime: string, endTime: string) => void;
  onAddSlotsRow: (coachId: number, startTime: string, endTime: string) => void;
  onDeleteSlotsRow: (coachId: number, startTime: string) => void;
}

import { isTemporaryOrDemo, timeToMinutes } from '../utils/shiftUtils';
import { isActiveClassSlot, getSlotDurationMinutes } from '../utils/conflictDetector';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const CoachProfile: React.FC<CoachProfileProps> = ({
  coaches,
  slots,
  onUpdateCoach,
  onSelectSlot,
  onOpenBookingModal,
  onAddSlotsRow,
  onDeleteSlotsRow
}) => {
  const [selectedCoachId, setSelectedCoachId] = useState<number>(() => {
    const saved = localStorage.getItem('upstep_profile_coach_id');
    const parsed = saved ? parseInt(saved, 10) : NaN;
    return !isNaN(parsed) && coaches.some(c => c.id === parsed) ? parsed : (coaches[0]?.id || 1);
  });

  useEffect(() => {
    localStorage.setItem('upstep_profile_coach_id', selectedCoachId.toString());
  }, [selectedCoachId]);

  const [isEditing, setIsEditing] = useState(false);

  // Time slot row builder states
  const [newRowStart, setNewRowStart] = useState('8:00 AM');
  const [newRowEnd, setNewRowEnd] = useState('8:45 AM');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Currently Selected Coach
  const coach = useMemo(() => {
    return coaches.find(c => c.id === selectedCoachId) || coaches[0];
  }, [coaches, selectedCoachId]);

  // Form State for editing coach details
  const [formData, setFormData] = useState<Coach>(coach);

  // Sync form data when coach changes
  useEffect(() => {
    setFormData(coach);
  }, [coach]);

  // Auto-calculate Tier based on rating
  const calculateTier = (rating: number): Coach['tier'] => {
    if (rating >= 2200) return 'Tier 5';
    if (rating >= 2000) return 'Tier 4';
    if (rating >= 1800) return 'Tier 3';
    if (rating >= 1600) return 'Tier 2';
    if (rating >= 1400) return 'Tier 1';
    return 'No Tier';
  };

  const handleRatingChange = (newRating: number) => {
    const calculatedTier = calculateTier(newRating);
    setFormData({
      ...formData,
      standard_rating: newRating,
      tier: calculatedTier
    });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCoach(formData);
    setIsEditing(false);
  };

  // Image Upload handler (converting to Base64)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          profile_pic: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter slots for this coach
  const coachSlots = useMemo(() => {
    return slots.filter(s => s.coach_id === coach.id);
  }, [slots, coach.id]);

  // Extract distinct time slots for this coach
  const distinctTimeSlots = useMemo(() => {
    const timesMap = new Map<string, { start: string; end: string }>();
    coachSlots.forEach(s => {
      timesMap.set(s.start_time, { start: s.start_time, end: s.end_time });
    });
    return Array.from(timesMap.values()).sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  }, [coachSlots]);

  // Helper to find slot for a specific day and start time
  const getSlotForDayAndTime = (day: string, startTime: string): Slot | undefined => {
    return coachSlots.find(s => s.day_of_week === day && s.start_time === startTime);
  };

  // Cell Styling & Class helper based on Slot Status & Activity text
  const getSlotCellClass = (slot?: Slot) => {
    if (!slot) return 'slot-cell status-placeholder-cell is-placeholder-slot';
    
    const act = (slot.activity || '').toUpperCase().trim();
    const st = slot.status_type;

    // 1. Check specific operational categories by status_type OR activity text matching
    if (st === 'REST_BREAK' || st === 'OFF_DUTY' || act === 'OFF' || act.includes('MEAL BREAK')) {
      return 'slot-cell status-red-break';
    }
    if (st === 'BATCH_LEVEL_BREAK' || st === 'INACTIVE' || act.includes('INACTIVE') || act.includes('LEVEL BREAK') || act === 'BREAK') {
      return 'slot-cell status-purple-break';
    }
    if (st === 'REQUIREMENT_BLOCK' || act.includes('REQUIREMENT BLOCK') || act.includes('REQ BLOCK')) {
      return 'slot-cell status-yellow-req';
    }
    if (st === 'NEXT_MONTH_BLOCK' || act.includes('NEXT MONTH BLOCK') || act.includes('NEXT MONTH')) {
      return 'slot-cell status-cyan-nextmonth';
    }
    if (st === 'ODD_SLOT' || act.includes('ODD SLOT') || act.includes('ODD')) {
      return 'slot-cell status-magenta-odd';
    }
    if (st === 'TRAINING' || act.includes('TRAINING')) {
      return 'slot-cell status-mauve-training';
    }
    if (st === 'PERMANENT_SUBSTITUTE' || act.includes('PERMANENT SUBSTITUTE') || act.includes('PERM SUB')) {
      return 'slot-cell status-orange-permsub';
    }
    if (st === 'LONG_LEAVE_SUBSTITUTE' || act.includes('LONG LEAVE SUBSTITUTE') || act.includes('LONG LEAVE')) {
      return 'slot-cell status-blue-leavesub';
    }
    if (st === 'NOTICE_PERIOD' || act.includes('NOTICE PERIOD')) {
      return 'slot-cell status-green-notice';
    }
    if (st === 'REPORT_BUILDING' || act.includes('REPORT-BUILDING') || act.includes('REPORT BUILDING')) {
      return 'slot-cell status-olive-report';
    }
    if (st === 'CLASSES_NEED_TO_BE_MANAGED' || act.includes('CLASSES NEED TO BE MANAGED') || act.includes('NEED TO BE MANAGED') || act.includes('MANAGED')) {
      return 'slot-cell status-teal-managed';
    }

    const isTemp = st === 'TEMPORARY_CLASS' || 
                   st === 'SUBSTITUTE_CLASS' || 
                   act.includes('X TEMPORARY') ||
                   (st === 'SCHEDULED_CLASS' && isTemporaryOrDemo(slot.activity) && !act.includes('DEMO'));

    if (isTemp) {
      return 'slot-cell status-orange-temp';
    }

    if (st === 'SCHEDULED_CLASS' || st === 'DEMO_CLASS' || act.includes('DEMO')) {
      return 'slot-cell status-green-class';
    }

    return 'slot-cell status-blue-available';
  };

  // Summary Metrics for Coach
  const metrics = useMemo(() => {
    let scheduledClasses = 0;
    let demoSlots = 0;
    let substituteSlots = 0;
    let tempClasses = 0;
    let levelBreaks = 0;
    let restBreaks = 0;
    let freeSlots = 0;

    coachSlots.forEach(s => {
      const actualStatus = (s.status_type === 'SCHEDULED_CLASS' && isTemporaryOrDemo(s.activity)) 
        ? 'TEMPORARY_CLASS' 
        : s.status_type;

      switch (actualStatus) {
        case 'SCHEDULED_CLASS': scheduledClasses++; break;
        case 'DEMO_CLASS': demoSlots++; break;
        case 'SUBSTITUTE_CLASS': substituteSlots++; break;
        case 'TEMPORARY_CLASS': tempClasses++; break;
        case 'BATCH_LEVEL_BREAK':
        case 'INACTIVE': levelBreaks++; break;
        case 'REST_BREAK':
        case 'OFF_DUTY': restBreaks++; break;
        case 'AVAILABLE': freeSlots++; break;
      }
    });

    return { scheduledClasses, demoSlots, substituteSlots, tempClasses, levelBreaks, restBreaks, freeSlots };
  }, [coachSlots]);

  const weeklyHoursInfo = useMemo(() => {
    let activeMins = 0;
    coachSlots.forEach(s => {
      if (isActiveClassSlot(s)) {
        activeMins += getSlotDurationMinutes(s.start_time, s.end_time);
      }
    });
    const totalHours = +(activeMins / 60).toFixed(1);
    const limit = coach ? (coach.emp_type === 'Part Time' ? 18 : 36) : 36;
    const isExceeded = totalHours > limit;
    const pct = Math.min(100, +((totalHours / limit) * 100).toFixed(1));
    return { totalHours, limit, isExceeded, pct };
  }, [coachSlots, coach]);

  return (
    <div className="coach-profile-container">
      {/* Top Header & Coach Selector */}
      <div className="profile-selector-card">
        <div className="selector-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <User className="icon-gold" />
          <label className="form-label font-bold">Select Coach Profile:</label>
          <select 
            value={selectedCoachId} 
            onChange={e => setSelectedCoachId(parseInt(e.target.value, 10))}
            className="select-input select-lg"
            style={{ minWidth: '320px' }}
          >
            {coaches.map(c => (
              <option key={c.id} value={c.id}>
                {c.display_name} ({c.tier} - FIDE {c.standard_rating}) - RM: {c.rm_name || 'Vedant Kamble'} | Trainer: {c.trainer_manager || 'Shubham Kumthekar'}
              </option>
            ))}
          </select>
        </div>

        <button 
          type="button" 
          onClick={() => {
            setIsEditing(!isEditing);
            if (isEditing) setFormData(coach);
          }}
          className="btn-secondary"
        >
          <Edit3 className="icon-sm" />
          {isEditing ? 'Cancel Editing' : 'Edit Profile Details'}
        </button>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        style={{ display: 'none' }} 
      />

      {/* Main Profile Info Card */}
      {isEditing ? (
        <form onSubmit={handleSaveProfile} className="profile-card-premium">
          <div className="coach-info-columns">
            <div className="photo-upload-wrapper">
              <div 
                className="avatar-circle-wrapper"
                onClick={() => fileInputRef.current?.click()}
                title="Click to Upload Profile Photo"
              >
                {formData.profile_pic ? (
                  <img src={formData.profile_pic} alt="" className="avatar-img" />
                ) : (
                  <span className="avatar-placeholder-char">{formData.display_name.charAt(0)}</span>
                )}
                <div className="avatar-overlay-upload">📸 Upload Photo</div>
              </div>
              <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Click image to select photo file</span>
            </div>

            <div style={{ flex: 1 }}>
              <h3 className="font-bold" style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                Editing Coach Credentials: {coach.display_name}
              </h3>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Display Name:</label>
                  <input 
                    type="text" 
                    value={formData.display_name}
                    onChange={e => setFormData({ ...formData, display_name: e.target.value, name: e.target.value })}
                    className="text-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Salesforce Coach Name:</label>
                  <input 
                    type="text" 
                    value={formData.sf_coach_name}
                    onChange={e => setFormData({ ...formData, sf_coach_name: e.target.value })}
                    className="text-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Employee ID:</label>
                  <input 
                    type="text" 
                    value={formData.employee_id}
                    onChange={e => setFormData({ ...formData, employee_id: e.target.value })}
                    className="text-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Relationship Manager (RM):</label>
                  <input 
                    type="text" 
                    value={formData.trainer_manager}
                    onChange={e => setFormData({ ...formData, trainer_manager: e.target.value })}
                    className="text-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">FIDE Standard Rating:</label>
                  <input 
                    type="number" 
                    value={formData.standard_rating}
                    onChange={e => handleRatingChange(parseInt(e.target.value, 10))}
                    className="text-input"
                    min="1000"
                    max="2800"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Teaching Level Limit:</label>
                  <select 
                    value={formData.can_teach_upto}
                    onChange={e => setFormData({ ...formData, can_teach_upto: e.target.value })}
                    className="select-input"
                  >
                    <option value="Sub-Junior">Sub-Junior</option>
                    <option value="Junior">Junior</option>
                    <option value="Advanced Part 1">Advanced Part 1</option>
                    <option value="Advanced Part 2">Advanced Part 2</option>
                    <option value="Senior Part 1">Senior Part 1</option>
                    <option value="Senior Part 2">Senior Part 2</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Spoken Languages:</label>
                  <input 
                    type="text" 
                    value={formData.languages}
                    onChange={e => setFormData({ ...formData, languages: e.target.value })}
                    className="text-input"
                    placeholder="e.g. English, Hindi"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Employment Type:</label>
                  <select 
                    value={formData.emp_type}
                    onChange={e => setFormData({ ...formData, emp_type: e.target.value as any })}
                    className="select-input"
                  >
                    <option value="Part Time">Part Time</option>
                    <option value="Full Time">Full Time</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Shift Type (Shift Days):</label>
                  <select 
                    value={formData.shift_days || (formData.shift_type === 'Night Shift' ? 2 : 1)}
                    onChange={e => {
                      const val = parseInt(e.target.value, 10) as 1 | 2;
                      setFormData({
                        ...formData,
                        shift_days: val,
                        shift_type: val === 2 ? 'Night Shift' : 'Day Shift'
                      });
                    }}
                    className="select-input font-bold"
                    style={{ color: (formData.shift_days === 2 || formData.shift_type === 'Night Shift') ? '#c084fc' : '#fbbf24' }}
                  >
                    <option value="1">☀️ Day Shift (Shift Days: 1)</option>
                    <option value="2">🌙 Night Shift (Shift Days: 2)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Employment Model:</label>
                  <select 
                    value={formData.employment_model}
                    onChange={e => setFormData({ ...formData, employment_model: e.target.value as any })}
                    className="select-input"
                  >
                    <option value="Salaried">Salaried</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Class Hours Limit / Day:</label>
                  <input 
                    type="number" 
                    step="0.5"
                    value={formData.class_hours_per_day || 6.0}
                    onChange={e => setFormData({ ...formData, class_hours_per_day: parseFloat(e.target.value) })}
                    className="text-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Max Daily Classes Limit:</label>
                  <input 
                    type="number" 
                    value={formData.max_daily_classes || 8}
                    onChange={e => setFormData({ ...formData, max_daily_classes: parseInt(e.target.value, 10) })}
                    className="text-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Demo Preference:</label>
                  <select 
                    value={formData.demo_preference}
                    onChange={e => {
                      const color = e.target.value === 'Preference 1' ? '#10b981' : e.target.value === 'Preference 2' ? '#f59e0b' : '#3b82f6';
                      setFormData({ ...formData, demo_preference: e.target.value, demo_preference_color: color });
                    }}
                    className="select-input"
                  >
                    <option value="Preference 1">Preference 1 (Green)</option>
                    <option value="Preference 2">Preference 2 (Yellow)</option>
                    <option value="Preference 3">Preference 3 (Blue)</option>
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1', background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--accent-gold)', marginTop: '0.5rem' }}>
                  <h4 style={{ color: 'var(--accent-gold)', marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: 700 }}>
                    ⚙️ Special Conditions & Operational Rule Overrides
                  </h4>
                  <div className="form-grid-3">
                    <div>
                      <label className="form-label">Custom Weekly Hours Limit (hrs):</label>
                      <input 
                        type="number" 
                        step="0.5"
                        placeholder={`Default (${formData.emp_type === 'Part Time' ? 18 : 36}h)`}
                        value={formData.custom_weekly_hours_limit || ''}
                        onChange={e => setFormData({ ...formData, custom_weekly_hours_limit: e.target.value ? parseFloat(e.target.value) : undefined })}
                        className="text-input"
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={!!formData.exempt_capacity_limit}
                          onChange={e => setFormData({ ...formData, exempt_capacity_limit: e.target.checked })}
                        />
                        Exempt from Weekly Hours Limit
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={!!formData.exempt_consecutive_limit}
                          onChange={e => setFormData({ ...formData, exempt_consecutive_limit: e.target.checked })}
                        />
                        Exempt from Max 4 Consecutive Rule
                      </label>
                    </div>
                    <div>
                      <label className="form-label">Special Exception Notes:</label>
                      <input 
                        type="text" 
                        placeholder="Reason for special override..."
                        value={formData.special_exception_notes || ''}
                        onChange={e => setFormData({ ...formData, special_exception_notes: e.target.value })}
                        className="text-input"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="action-buttons-row">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(coach);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <Save className="icon-sm" /> Save Profile Details
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="profile-card-premium">
          <div className="coach-info-columns">
            <div className="photo-upload-wrapper">
              <div 
                className="avatar-circle-wrapper"
                onClick={() => fileInputRef.current?.click()}
                title="Click to Upload Profile Photo"
              >
                {coach.profile_pic ? (
                  <img src={coach.profile_pic} alt="" className="avatar-img" />
                ) : (
                  <span className="avatar-placeholder-char">{coach.display_name.charAt(0)}</span>
                )}
                <div className="avatar-overlay-upload">📸 Upload Photo</div>
              </div>
              <span className="badge-pill green" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', fontWeight: 700 }}>
                {coach.is_active ? '● Active Ops' : '○ Inactive Ops'}
              </span>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--heading-font)' }}>
                    {coach.display_name}
                  </h2>
                  <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
                    Salesforce Name: <strong style={{ color: 'var(--text-main)' }}>{coach.sf_coach_name}</strong>
                  </p>
                </div>
                <span className="badge-tier" style={{ fontSize: '1rem', padding: '0.45rem 1rem' }}>{coach.tier}</span>
              </div>

              <div className="coach-details-grid">
                <div className="details-row-item">
                  <span className="detail-label">Employee ID</span>
                  <span className="detail-val">{coach.employee_id || 'N/A'}</span>
                </div>

                <div className="details-row-item">
                  <span className="detail-label">Relationship Manager (RM)</span>
                  <span className="detail-val" style={{ color: '#60a5fa', fontWeight: 700 }}>
                    🤝 {coach.rm_name || 'Vedant Kamble'}
                  </span>
                </div>

                <div className="details-row-item">
                  <span className="detail-label">Assigned Trainer</span>
                  <span className="detail-val" style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>
                    👑 {coach.trainer_manager || 'Shubham Kumthekar'}
                  </span>
                </div>

                <div className="details-row-item">
                  <span className="detail-label">FIDE Rating</span>
                  <span className="detail-val">⭐ {coach.standard_rating}</span>
                </div>

                <div className="details-row-item">
                  <span className="detail-label">Teaching Level Range</span>
                  <span className="detail-val">{coach.can_teach_upto}</span>
                </div>

                <div className="details-row-item">
                  <span className="detail-label">Spoken Languages</span>
                  <span className="detail-val">{coach.languages}</span>
                </div>

                <div className="details-row-item">
                  <span className="detail-label">Employment Classification</span>
                  <span className="detail-val">{coach.emp_type} ({coach.employment_model})</span>
                </div>

                <div className="details-row-item">
                  <span className="detail-label">Shift Days / Type</span>
                  <span className="detail-val font-bold">
                    <span className={`badge-shift-type ${coach.shift_days === 2 ? 'badge-night-shift' : 'badge-day-shift'}`}>
                      {coach.shift_days === 2 ? '🌙 Night Shift (Shift Days: 2)' : '☀️ Day Shift (Shift Days: 1)'}
                    </span>
                  </span>
                </div>

                <div className="details-row-item">
                  <span className="detail-label">Demo Preference</span>
                  <span className="detail-val" style={{ color: coach.demo_preference_color || 'var(--text-main)' }}>
                    ● {coach.demo_preference}
                  </span>
                </div>

                <div className="details-row-item">
                  <span className="detail-label">Daily Capacity Load</span>
                  <span className="detail-val">
                    {coach.class_hours_per_day || 6.0} Hrs / Max {coach.max_daily_classes || 8} Classes
                  </span>
                </div>

                <div className="details-row-item" style={{ gridColumn: '1 / -1', background: 'var(--bg-card)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className="detail-label font-bold" style={{ color: 'var(--accent-gold)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock className="icon-sm" /> Weekly Hours Limit ({coach.emp_type}):
                    </span>
                    <span className="detail-val font-bold" style={{ color: weeklyHoursInfo.isExceeded ? '#ef4444' : '#10b981', fontSize: '0.85rem' }}>
                      {weeklyHoursInfo.totalHours} / {weeklyHoursInfo.limit} Hrs ({weeklyHoursInfo.pct}%)
                      {weeklyHoursInfo.isExceeded && ' ⚠️ OVER-CAPACITY!'}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${weeklyHoursInfo.pct}%`, 
                        height: '100%', 
                        background: weeklyHoursInfo.isExceeded ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #10b981, #3b82f6)',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.6rem', fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                    <span>⚡ <strong>System Readiness:</strong> Must be ready 15m prior to shift</span>
                    <span>🛑 <strong>Consecutive Limit:</strong> Max 4 sessions back-to-back</span>
                    <span>☕ <strong>Mandatory Rest:</strong> Min 10m break after 3h teaching</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="coach-metrics-grid-premium">
            <div className="metric-card-premium green">
              <div className="metric-icon-box">
                <BookOpen className="icon" />
              </div>
              <div className="metric-numbers-box">
                <span className="metric-val-premium">{metrics.scheduledClasses}</span>
                <span className="metric-lbl-premium">Scheduled Batches</span>
              </div>
            </div>

            <div className="metric-card-premium orange">
              <div className="metric-icon-box">
                <Calendar className="icon" />
              </div>
              <div className="metric-numbers-box">
                <span className="metric-val-premium">{metrics.tempClasses + metrics.substituteSlots}</span>
                <span className="metric-lbl-premium">Temp / Substitutes</span>
              </div>
            </div>

            <div className="metric-card-premium yellow">
              <div className="metric-icon-box">
                <Clock className="icon" />
              </div>
              <div className="metric-numbers-box">
                <span className="metric-val-premium">{metrics.demoSlots}</span>
                <span className="metric-lbl-premium">Demo Slots</span>
              </div>
            </div>

            <div className="metric-card-premium purple">
              <div className="metric-icon-box">
                <AlertCircle className="icon" />
              </div>
              <div className="metric-numbers-box">
                <span className="metric-val-premium">{metrics.levelBreaks}</span>
                <span className="metric-lbl-premium">Level Breaks (Purple)</span>
              </div>
            </div>

            <div className="metric-card-premium blue">
              <div className="metric-icon-box">
                <UserCheck className="icon" />
              </div>
              <div className="metric-numbers-box">
                <span className="metric-val-premium">{metrics.freeSlots}</span>
                <span className="metric-lbl-premium">Free Available Slots</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Individual Coach Matrix Schedule Grid */}
      <div className="individual-schedule-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📅 Weekly Schedule Matrix Grid for <strong>{coach.display_name}</strong>
            </h3>
            <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.15rem' }}>
              Click cells to book/reassign slots, or click "-" cells to instantiate new slots.
            </p>
          </div>

          {/* Custom Time Slot Row Creator */}
          <div className="add-time-row-form" style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span className="text-muted" style={{ fontSize: '0.7rem' }}>New Start Time</span>
              <select value={newRowStart} onChange={e => setNewRowStart(e.target.value)} className="select-input-sm">
                <option value="8:00 AM">8:00 AM</option>
                <option value="9:00 AM">9:00 AM</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="11:00 AM">11:00 AM</option>
                <option value="12:00 PM">12:00 PM</option>
                <option value="1:00 PM">1:00 PM</option>
                <option value="2:00 PM">2:00 PM</option>
                <option value="3:00 PM">3:00 PM</option>
                <option value="4:00 PM">4:00 PM</option>
                <option value="5:00 PM">5:00 PM</option>
                <option value="6:00 PM">6:00 PM</option>
                <option value="7:00 PM">7:00 PM</option>
                <option value="8:00 PM">8:00 PM</option>
                <option value="9:00 PM">9:00 PM</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span className="text-muted" style={{ fontSize: '0.7rem' }}>New End Time</span>
              <select value={newRowEnd} onChange={e => setNewRowEnd(e.target.value)} className="select-input-sm">
                <option value="8:45 AM">8:45 AM</option>
                <option value="9:45 AM">9:45 AM</option>
                <option value="10:45 AM">10:45 AM</option>
                <option value="11:45 AM">11:45 AM</option>
                <option value="12:45 PM">12:45 PM</option>
                <option value="1:45 PM">1:45 PM</option>
                <option value="2:45 PM">2:45 PM</option>
                <option value="3:45 PM">3:45 PM</option>
                <option value="4:45 PM">4:45 PM</option>
                <option value="5:45 PM">5:45 PM</option>
                <option value="6:45 PM">6:45 PM</option>
                <option value="7:45 PM">7:45 PM</option>
                <option value="8:45 PM">8:45 PM</option>
                <option value="9:45 PM">9:45 PM</option>
              </select>
            </div>
            <button 
              type="button" 
              onClick={() => onAddSlotsRow(coach.id, newRowStart, newRowEnd)} 
              className="btn-primary" 
              style={{ padding: '0.45rem 0.95rem', fontSize: '0.8rem', height: '32px' }}
            >
              ➕ Add Row
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="master-grid-table" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th className="col-time" style={{ width: '130px', minWidth: '130px', maxWidth: '130px' }}>Time Slot</th>
                {DAYS_OF_WEEK.map(day => (
                  <th key={day} className="col-day" style={{ textAlign: 'center' }}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {distinctTimeSlots.length === 0 ? (
                <tr>
                  <td colSpan={1 + DAYS_OF_WEEK.length} className="no-data-cell" style={{ padding: '2rem', textAlign: 'center' }}>
                    No time slots configured in mock data for this coach.
                  </td>
                </tr>
              ) : (
                distinctTimeSlots.map(timeSpan => (
                  <tr key={timeSpan.start}>
                    {/* Sticky Row header with deletion icon */}
                    <td className="col-time font-mono" style={{ width: '130px', minWidth: '130px', maxWidth: '130px', fontWeight: 'bold', background: 'var(--bg-secondary)', color: 'var(--text-main)', borderRight: '1px solid var(--border-color)', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                        <span>{timeSpan.start} - {timeSpan.end}</span>
                        <button
                          type="button"
                          onClick={() => onDeleteSlotsRow(coach.id, timeSpan.start)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}
                          title="Remove Time Slot Row"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                    {DAYS_OF_WEEK.map(day => {
                      const slot = getSlotForDayAndTime(day, timeSpan.start);
                      return (
                        <td 
                          key={day}
                          className={getSlotCellClass(slot)}
                          onClick={() => {
                            if (slot) {
                              onSelectSlot(slot);
                            } else {
                              // If cell is "-", click triggers slot instantiation modal!
                              onOpenBookingModal(coach, day, timeSpan.start, timeSpan.end);
                            }
                          }}
                          title={slot ? `Click to manage slot: ${slot.activity}` : `Click to define slot for ${coach.display_name}`}
                          style={{ cursor: 'pointer', padding: '0.35rem' }}
                        >
                          {slot ? (
                            <div className="slot-cell-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                              <span className="activity-text" style={{ fontWeight: 'bold' }}>{slot.activity}</span>
                              {slot.status_type === 'BATCH_LEVEL_BREAK' && (
                                <span className="badge-micro purple" style={{ fontSize: '0.65rem' }}>Level Break</span>
                              )}
                              {slot.status_type === 'INACTIVE' && (
                                <span className="badge-micro purple" style={{ fontSize: '0.65rem' }}>Inactive</span>
                              )}
                            </div>
                          ) : (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', opacity: 0.4 }}>-</div>
                          )}
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
    </div>
  );
};
