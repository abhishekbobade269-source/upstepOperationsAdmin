import React, { useState, useMemo } from 'react';
import type { Slot, SlotStatusType, Coach } from '../types';
import { X, Check, ShieldAlert, RefreshCw, Clock } from 'lucide-react';
import { isActiveClassSlot, getSlotDurationMinutes } from '../utils/conflictDetector';

interface SlotBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: Slot | null;
  targetCoachName?: string;
  targetDay?: string;
  targetStartTime?: string;
  targetEndTime?: string;
  onSaveSlot: (updatedSlotData: {
    status_type: SlotStatusType;
    activity: string;
    applyToMultipleDays?: string[];
  }) => void;
  coaches: Coach[];
  slots: Slot[];
  onReassignSlot: (sourceSlot: Slot, targetSlotId: number) => void;
  onDeleteSlot?: (slotId: number) => void;
}

const DAYS_LIST = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const SlotBookingModal: React.FC<SlotBookingModalProps> = ({
  isOpen,
  onClose,
  slot,
  targetCoachName,
  targetDay,
  targetStartTime,
  targetEndTime,
  onSaveSlot,
  coaches,
  slots,
  onReassignSlot,
  onDeleteSlot
}) => {
  if (!isOpen) return null;

  const coachName = slot ? slot.coach_name : targetCoachName;
  const day = slot ? slot.day_of_week : targetDay;
  const startTime = slot ? slot.start_time : targetStartTime;
  const endTime = slot ? slot.end_time : targetEndTime;
  const currentActivity = slot ? slot.activity : 'X';
  const currentStatus = slot ? slot.status_type : 'AVAILABLE';

  const [bookingType, setBookingType] = useState<SlotStatusType>(
    currentStatus === 'AVAILABLE' ? 'SCHEDULED_CLASS' : currentStatus
  );
  const [batchCode, setBatchCode] = useState(
    currentActivity !== 'X' && currentActivity !== 'BREAK' && currentActivity !== 'OFF' ? currentActivity : ''
  );
  const [selectedDays, setSelectedDays] = useState<string[]>([day || 'Monday']);
  const [isReassignMode, setIsReassignMode] = useState(false);

  const isRestBreak = currentStatus === 'REST_BREAK' || currentStatus === 'OFF_DUTY';

  const weeklyHoursSummary = useMemo(() => {
    const targetCoach = coaches.find(c => c.name === coachName || c.display_name === coachName);
    const targetCoachId = slot ? slot.coach_id : targetCoach?.id;
    if (!targetCoachId) return null;

    let activeMins = 0;
    slots.filter(s => s.coach_id === targetCoachId).forEach(s => {
      if (isActiveClassSlot(s)) {
        activeMins += getSlotDurationMinutes(s.start_time, s.end_time);
      }
    });

    const totalHours = +(activeMins / 60).toFixed(1);
    const empType = targetCoach?.emp_type || 'Full Time';
    const limit = empType === 'Part Time' ? 18 : 36;
    return { totalHours, limit, empType, isExceeded: totalHours > limit };
  }, [slot, targetCoachName, coaches, slots, coachName]);

  const toggleDay = (d: string) => {
    if (selectedDays.includes(d)) {
      if (selectedDays.length > 1) setSelectedDays(selectedDays.filter(day => day !== d));
    } else {
      setSelectedDays([...selectedDays, d]);
    }
  };

  const handleSave = () => {
    let finalActivity = batchCode.trim();

    if (bookingType === 'AVAILABLE') {
      finalActivity = 'X';
    } else if (bookingType === 'OFF_DUTY' || bookingType === 'REST_BREAK') {
      finalActivity = 'OFF';
    } else if (bookingType === 'BATCH_LEVEL_BREAK' || bookingType === 'INACTIVE') {
      finalActivity = finalActivity || 'BREAK/Inactive';
    } else if (bookingType === 'REQUIREMENT_BLOCK') {
      finalActivity = finalActivity || 'Requirement Block';
    } else if (bookingType === 'NEXT_MONTH_BLOCK') {
      finalActivity = finalActivity || 'Next Month Block';
    } else if (bookingType === 'ODD_SLOT') {
      finalActivity = finalActivity || 'Odd Slot';
    } else if (bookingType === 'TRAINING') {
      finalActivity = finalActivity || 'Training';
    } else if (bookingType === 'PERMANENT_SUBSTITUTE') {
      finalActivity = finalActivity || 'Permanent Substitute';
    } else if (bookingType === 'LONG_LEAVE_SUBSTITUTE') {
      finalActivity = finalActivity || 'Long Leave Substitute';
    } else if (bookingType === 'NOTICE_PERIOD') {
      finalActivity = finalActivity || 'Notice Period Class';
    } else if (bookingType === 'REPORT_BUILDING') {
      finalActivity = finalActivity || 'Report-building time';
    } else if (bookingType === 'CLASSES_NEED_TO_BE_MANAGED') {
      finalActivity = finalActivity || 'Classes need to be managed';
    } else if (bookingType === 'DEMO_CLASS' && !finalActivity) {
      finalActivity = 'X Demo';
    }

    onSaveSlot({
      status_type: bookingType,
      activity: finalActivity || 'Scheduled Class',
      applyToMultipleDays: selectedDays
    });

    onClose();
  };

  // Find alternative coaches who are available at this same day/time (From Next.js logic)
  const alternativeCoaches = useMemo(() => {
    if (!slot) return [];

    return coaches.map(coach => {
      // Exclude the current coach of this slot
      if (coach.id === slot.coach_id) return null;
      if (!coach.is_active) return null;

      // Find an available slot for this coach at the same day & time
      const matchingSlot = slots.find(
        s => s.coach_id === coach.id && 
             s.day_of_week === slot.day_of_week && 
             s.start_time === slot.start_time &&
             s.status_type === 'AVAILABLE'
      );

      if (!matchingSlot) return null;

      return {
        coach,
        availableSlotId: matchingSlot.id
      };
    }).filter(Boolean) as { coach: Coach; availableSlotId: number }[];
  }, [slot, coaches, slots]);

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h3>{isReassignMode ? 'Reassign Class to Alternative Coach' : `Manage Slot: ${coachName}`}</h3>
            <p className="subtext">{day} ({startTime} - {endTime})</p>
          </div>
          <button type="button" onClick={onClose} className="btn-close">
            <X className="icon" />
          </button>
        </div>

        {isReassignMode && slot ? (
          /* REASSIGNMENT SCREEN (Ported from Next.js project slot editor) */
          <div className="modal-body">
            <p className="font-sm text-muted" style={{ marginBottom: '1rem' }}>
              The following coaches have an <strong>Available (X)</strong> slot at {day} @ {startTime} and are ready to take over:
            </p>

            {alternativeCoaches.length === 0 ? (
              <div className="alert-banner orange" style={{ padding: '1rem', textAlign: 'center' }}>
                <ShieldAlert className="icon" style={{ margin: '0 auto 0.5rem' }} />
                <strong>No alternative coaches available:</strong> No other active coaches have a free slot at this day/time.
              </div>
            ) : (
              <div className="reassign-coaches-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto' }}>
                {alternativeCoaches.map(({ coach, availableSlotId }) => (
                  <button
                    key={coach.id}
                    type="button"
                    onClick={() => {
                      if (confirm(`Transfer this class to ${coach.display_name}?`)) {
                        onReassignSlot(slot, availableSlotId);
                      }
                    }}
                    className="action-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1.25rem',
                      width: '100%',
                      textAlign: 'left',
                      background: 'rgba(28, 37, 65, 0.4)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <div className="font-bold font-md" style={{ color: 'var(--text-main)' }}>
                        {coach.display_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        RM: {coach.trainer_manager} | Can Teach: {coach.can_teach_upto}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                      <span className="badge-pill green" style={{ fontSize: '0.7rem' }}>⭐ {coach.standard_rating}</span>
                      <span style={{ fontSize: '0.7rem', color: coach.demo_preference_color || '#94a3b8' }}>
                        {coach.demo_preference}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div style={{ marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setIsReassignMode(false)}
                className="btn-secondary"
                style={{ width: '100%' }}
              >
                Cancel Reassignment
              </button>
            </div>
          </div>
        ) : (
          /* STANDARD BOOKING SCREEN */
          <div className="modal-body">
            {/* Weekly Hours & Compliance Banner */}
            {weeklyHoursSummary && (
              <div 
                className={`alert-banner ${weeklyHoursSummary.isExceeded ? 'red' : 'yellow'}`}
                style={{ background: weeklyHoursSummary.isExceeded ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)', border: `1px solid ${weeklyHoursSummary.isExceeded ? '#ef4444' : '#3b82f6'}`, color: '#f8fafc', padding: '0.65rem 0.85rem', fontSize: '0.8rem', borderRadius: '8px' }}
              >
                <Clock className="icon-sm" style={{ color: weeklyHoursSummary.isExceeded ? '#ef4444' : '#60a5fa' }} />
                <div>
                  <strong>Weekly Working Load ({weeklyHoursSummary.empType}):</strong> Coach currently assigned <strong>{weeklyHoursSummary.totalHours} / {weeklyHoursSummary.limit} hrs</strong> per week.
                  {weeklyHoursSummary.isExceeded && <span style={{ color: '#ef4444', fontWeight: 'bold' }}> (⚠️ Max limit of {weeklyHoursSummary.limit}h exceeded!)</span>}
                </div>
              </div>
            )}

            {/* Warning if slot is a Rest Break */}
            {isRestBreak && (
              <div className="alert-banner red">
                <ShieldAlert className="icon" />
                <div>
                  <strong>Rest Break / Off-Duty Warning:</strong> This slot is designated as an operational rest break (`BREAK` / `OFF`). Permanent class bookings are restricted here.
                </div>
              </div>
            )}

            {/* Booking Action Type Selector */}
            <div className="form-group">
              <label className="form-label font-bold">Select Action / Operational Slot Status:</label>
              <div className="action-type-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                <button
                  type="button"
                  className={`action-btn ${bookingType === 'SCHEDULED_CLASS' ? 'selected green' : ''}`}
                  onClick={() => setBookingType('SCHEDULED_CLASS')}
                >
                  📗 Permanent Class
                </button>

                <button
                  type="button"
                  className={`action-btn ${bookingType === 'BATCH_LEVEL_BREAK' ? 'selected purple' : ''}`}
                  onClick={() => setBookingType('BATCH_LEVEL_BREAK')}
                >
                  🟣 BREAK / Inactive
                </button>

                <button
                  type="button"
                  className={`action-btn ${bookingType === 'REST_BREAK' ? 'selected red' : ''}`}
                  onClick={() => setBookingType('REST_BREAK')}
                >
                  🔴 Off / Meal BREAK
                </button>

                <button
                  type="button"
                  className={`action-btn ${bookingType === 'REQUIREMENT_BLOCK' ? 'selected yellow' : ''}`}
                  onClick={() => setBookingType('REQUIREMENT_BLOCK')}
                >
                  🟡 Requirement Block
                </button>

                <button
                  type="button"
                  className={`action-btn ${bookingType === 'NEXT_MONTH_BLOCK' ? 'selected cyan' : ''}`}
                  onClick={() => setBookingType('NEXT_MONTH_BLOCK')}
                >
                  🌐 Next Month Block
                </button>

                <button
                  type="button"
                  className={`action-btn ${bookingType === 'ODD_SLOT' ? 'selected pink' : ''}`}
                  onClick={() => setBookingType('ODD_SLOT')}
                >
                  🌸 Odd Slot
                </button>

                <button
                  type="button"
                  className={`action-btn ${bookingType === 'TRAINING' ? 'selected mauve' : ''}`}
                  onClick={() => setBookingType('TRAINING')}
                >
                  🎀 Training
                </button>

                <button
                  type="button"
                  className={`action-btn ${bookingType === 'PERMANENT_SUBSTITUTE' ? 'selected orange' : ''}`}
                  onClick={() => setBookingType('PERMANENT_SUBSTITUTE')}
                >
                  📙 Permanent Substitute
                </button>

                <button
                  type="button"
                  className={`action-btn ${bookingType === 'LONG_LEAVE_SUBSTITUTE' ? 'selected blue' : ''}`}
                  onClick={() => setBookingType('LONG_LEAVE_SUBSTITUTE')}
                >
                  🔷 Long Leave Substitute
                </button>

                <button
                  type="button"
                  className={`action-btn ${bookingType === 'NOTICE_PERIOD' ? 'selected green' : ''}`}
                  onClick={() => setBookingType('NOTICE_PERIOD')}
                >
                  🟢 Notice Period
                </button>

                <button
                  type="button"
                  className={`action-btn ${bookingType === 'REPORT_BUILDING' ? 'selected yellow' : ''}`}
                  onClick={() => setBookingType('REPORT_BUILDING')}
                >
                  🟤 Report-building time
                </button>

                <button
                  type="button"
                  className={`action-btn ${bookingType === 'CLASSES_NEED_TO_BE_MANAGED' ? 'selected green' : ''}`}
                  onClick={() => setBookingType('CLASSES_NEED_TO_BE_MANAGED')}
                >
                  🌊 Classes need to be managed
                </button>

                <button
                  type="button"
                  className={`action-btn ${bookingType === 'DEMO_CLASS' ? 'selected yellow' : ''}`}
                  onClick={() => setBookingType('DEMO_CLASS')}
                >
                  🟨 Demo Slot
                </button>

                <button
                  type="button"
                  className={`action-btn ${bookingType === 'TEMPORARY_CLASS' ? 'selected orange' : ''}`}
                  onClick={() => setBookingType('TEMPORARY_CLASS')}
                >
                  🟧 Temporary Class
                </button>

                <button
                  type="button"
                  className={`action-btn ${bookingType === 'AVAILABLE' ? 'selected blue' : ''}`}
                  onClick={() => setBookingType('AVAILABLE')}
                >
                  🟦 Release / Mark Available (X)
                </button>
              </div>
            </div>

            {/* Batch Code Input */}
            {bookingType !== 'AVAILABLE' && (
              <div className="form-group">
                <label className="form-label">
                  Batch Code / Class Description:
                </label>
                <input
                  type="text"
                  placeholder="e.g. SIN-MPI-466, AUS-FPI-1303, UAE-BTP-465"
                  value={batchCode}
                  onChange={e => setBatchCode(e.target.value)}
                  className="text-input"
                  autoFocus
                />
              </div>
            )}

            {/* Apply to Multiple Days Checkboxes */}
            <div className="form-group">
              <label className="form-label font-bold font-sm">Apply Booking to Multiple Days:</label>
              <div className="days-chip-row">
                {DAYS_LIST.map(d => (
                  <button
                    key={d}
                    type="button"
                    className={`chip-btn ${selectedDays.includes(d) ? 'active' : ''}`}
                    onClick={() => toggleDay(d)}
                  >
                    {d.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {!isReassignMode && (
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {slot && (slot.status_type === 'SCHEDULED_CLASS' || slot.status_type === 'TEMPORARY_CLASS' || slot.status_type === 'SUBSTITUTE_CLASS') && (
                <button
                  type="button"
                  onClick={() => setIsReassignMode(true)}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#60a5fa', borderColor: '#3b82f6' }}
                >
                  <RefreshCw className="icon-sm" /> Reassign Class
                </button>
              )}

              {slot && onDeleteSlot && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to remove this slot from the coach schedule completely? This makes the slot N/A.')) {
                      onDeleteSlot(slot.id);
                    }
                  }}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f87171', borderColor: '#ef4444' }}
                >
                  🗑️ Remove Slot (N/A)
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="button" onClick={handleSave} className="btn-primary">
                <Check className="icon-sm" /> Save Slot Booking
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
