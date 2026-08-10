import React, { useState, useMemo, useEffect } from 'react';
import type { Role, Coach, Slot, ShiftTemplate, SlotStatusType, AuditRuleConfig } from './types';
import { INITIAL_COACHES, INITIAL_SHIFTS, INITIAL_SLOTS } from './mockData';
import { isTemporaryOrDemo, addMinutesToTime } from './utils/shiftUtils';
import { detectScheduleConflicts, DEFAULT_RULE_CONFIG } from './utils/conflictDetector';
import { ensureLeadTrainersInCoaches } from './utils/trainerUtils';
import { Header } from './components/Header';
import { ScheduleGrid } from './components/ScheduleGrid';
import { MultiDaySearch } from './components/MultiDaySearch';
import { CoachProfile } from './components/CoachProfile';
import { TrainersPortal } from './components/TrainersPortal';
import { CustomShiftBuilder } from './components/CustomShiftBuilder';
import { CoachOnboarding } from './components/CoachOnboarding';
import { ConflictAudit } from './components/ConflictAudit';
import { DailyDemoSlotsHub } from './components/DailyDemoSlotsHub';
import { SlotBookingModal } from './components/SlotBookingModal';
import './index.css';

export function App() {
  // State
  const [currentRole, setCurrentRole] = useState<Role>('manager');
  const [activePortal, setActivePortal] = useState<'management' | 'admin'>(() => {
    const saved = localStorage.getItem('upstep_active_portal');
    return (saved as 'management' | 'admin') || 'management';
  });
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('upstep_active_tab') || 'grid';
  });
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Application Data States (Loaded from localStorage or defaults)
  const [coaches, setCoaches] = useState<Coach[]>(() => {
    const saved = localStorage.getItem('upstep_coaches');
    const base = saved ? JSON.parse(saved) : INITIAL_COACHES;
    const sanitized = ensureLeadTrainersInCoaches(base);
    localStorage.setItem('upstep_coaches', JSON.stringify(sanitized));
    return sanitized;
  });
  const [shifts, setShifts] = useState<ShiftTemplate[]>(() => {
    const saved = localStorage.getItem('upstep_shifts');
    return saved ? JSON.parse(saved) : INITIAL_SHIFTS;
  });
  const [slots, setSlots] = useState<Slot[]>(() => {
    const saved = localStorage.getItem('upstep_slots');
    return saved ? JSON.parse(saved) : INITIAL_SLOTS;
  });
  const [resolvedConflictIds, setResolvedConflictIds] = useState<string[]>([]);
  const [ignoredConflictIds, setIgnoredConflictIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('upstep_ignored_conflicts');
    return saved ? JSON.parse(saved) : [];
  });
  const [ruleConfig, setRuleConfig] = useState<AuditRuleConfig>(() => {
    const saved = localStorage.getItem('upstep_rule_config');
    return saved ? JSON.parse(saved) : DEFAULT_RULE_CONFIG;
  });
  const [highlightedCoachTarget] = useState<{ coachName: string; day?: string } | null>(null);

  const handleIgnoreConflict = (id: string) => {
    setIgnoredConflictIds(prev => [...prev, id]);
  };

  // Dynamic real-time schedule diagnostic conflict engine
  const conflicts = useMemo(() => {
    const detected = detectScheduleConflicts(slots, coaches, ruleConfig);
    return detected.filter(c => !resolvedConflictIds.includes(c.id) && !ignoredConflictIds.includes(c.id));
  }, [slots, coaches, resolvedConflictIds, ignoredConflictIds, ruleConfig]);

  // Persist state updates to localStorage
  useEffect(() => {
    localStorage.setItem('upstep_ignored_conflicts', JSON.stringify(ignoredConflictIds));
  }, [ignoredConflictIds]);

  useEffect(() => {
    localStorage.setItem('upstep_rule_config', JSON.stringify(ruleConfig));
  }, [ruleConfig]);

  useEffect(() => {
    localStorage.setItem('upstep_active_portal', activePortal);
  }, [activePortal]);

  useEffect(() => {
    localStorage.setItem('upstep_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('upstep_coaches', JSON.stringify(coaches));
  }, [coaches]);

  useEffect(() => {
    localStorage.setItem('upstep_shifts', JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem('upstep_slots', JSON.stringify(slots));
  }, [slots]);

  const handleResetDatabase = () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('upstep_')) {
        localStorage.removeItem(key);
      }
    });
    window.location.reload();
  };

  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [targetBookingInfo, setTargetBookingInfo] = useState<{
    coachName?: string;
    coachId?: number;
    day?: string;
    startTime?: string;
    endTime?: string;
    multipleDays?: string[];
  } | null>(null);

  // Calculate Metrics
  const metrics = useMemo(() => {
    const totalCoaches = coaches.length;
    let activeClasses = 0;
    let freeSlots = 0;

    slots.forEach(s => {
      const isClass = s.status_type === 'SCHEDULED_CLASS' && !isTemporaryOrDemo(s.activity);
      if (isClass) {
        activeClasses++;
      } else if (s.status_type === 'AVAILABLE') {
        freeSlots++;
      }
    });

    return { totalCoaches, activeClasses, freeSlots, conflicts: conflicts.length };
  }, [coaches, slots, conflicts]);

  // Apply dark/light class to body
  React.useEffect(() => {
    if (darkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }, [darkMode]);

  // Handlers for Managing Slots
  const handleSelectSlotCell = (slot: Slot) => {
    setSelectedSlot(slot);
    setTargetBookingInfo(null);
    setIsBookingModalOpen(true);
  };

  const handleOpenBookingForCoach = (coach: Coach, day: string, startTime: string, endTime: string) => {
    setSelectedSlot(null);
    setTargetBookingInfo({
      coachName: coach.name,
      coachId: coach.id,
      day,
      startTime,
      endTime,
      multipleDays: [day]
    });
    setIsBookingModalOpen(true);
  };

  const handleBookSearchResult = (coach: Coach, selectedDays: string[], startTime: string, endTime: string) => {
    setSelectedSlot(null);
    setTargetBookingInfo({
      coachName: coach.name,
      coachId: coach.id,
      day: selectedDays[0],
      startTime,
      endTime,
      multipleDays: selectedDays
    });
    setIsBookingModalOpen(true);
  };

  const handleSaveSlotBooking = (data: {
    status_type: SlotStatusType;
    activity: string;
    applyToMultipleDays?: string[];
  }) => {
    const targetDays = data.applyToMultipleDays || [selectedSlot?.day_of_week || 'Monday'];
    const targetCoachId = selectedSlot ? selectedSlot.coach_id : targetBookingInfo?.coachId;
    const targetCoach = coaches.find(c => c.id === targetCoachId);
    const startTime = selectedSlot ? selectedSlot.start_time : targetBookingInfo?.startTime || '12:00 PM';
    let endTime = selectedSlot ? selectedSlot.end_time : targetBookingInfo?.endTime || '12:45 PM';

    // X Demo slot is always 30 minutes duration (e.g. 3:45 PM to 4:15 PM)
    if (data.status_type === 'DEMO_CLASS' || data.activity.toUpperCase().includes('X DEMO')) {
      endTime = addMinutesToTime(startTime, 30);
    }

    setSlots(prevSlots => {
      let updated = [...prevSlots];

      targetDays.forEach(day => {
        const existingIdx = updated.findIndex(
          s => s.coach_id === targetCoachId && s.day_of_week === day && s.start_time === startTime
        );

        if (existingIdx >= 0) {
          // Update existing slot
          updated[existingIdx] = {
            ...updated[existingIdx],
            status_type: data.status_type,
            activity: data.activity
          };
        } else if (targetCoach) {
          // Create new slot
          const coachSlots = prevSlots.filter(s => s.coach_id === targetCoachId);
          const existingShiftName = coachSlots.length > 0 ? coachSlots[0].shift_name : 'Custom';
          const existingRmName = coachSlots.length > 0 ? coachSlots[0].rm_name : (targetCoach.trainer_manager || 'Vedant Kamble');

          const newSlot: Slot = {
            id: Date.now() + Math.floor(Math.random() * 100000),
            coach_id: targetCoach.id,
            coach_name: targetCoach.name,
            rm_name: existingRmName,
            shift_name: existingShiftName,
            day_of_week: day as any,
            start_time: startTime,
            end_time: endTime,
            status_type: data.status_type,
            activity: data.activity
          };
          updated.push(newSlot);
        }
      });

      return updated;
    });

    setIsBookingModalOpen(false);
  };

  // Handlers for Coaches & Shifts
  const handleUpdateCoach = (updatedCoach: Coach) => {
    setCoaches(coaches.map(c => (c.id === updatedCoach.id ? updatedCoach : c)));
    alert(`Profile for ${updatedCoach.display_name} updated successfully!`);
  };

  const handleAddCoach = (newCoach: Coach, selectedShift: ShiftTemplate) => {
    setCoaches([...coaches, newCoach]);

    // Instantiate slots for the new coach from the shift template
    const newSlots: Slot[] = [];
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const weekend = ['Saturday', 'Sunday'];

    selectedShift.slots.forEach(slotDef => {
      weekdays.forEach(day => {
        newSlots.push({
          id: Date.now() + Math.floor(Math.random() * 10000),
          coach_id: newCoach.id,
          coach_name: newCoach.name,
          rm_name: newCoach.trainer_manager,
          shift_name: selectedShift.name,
          day_of_week: day as any,
          start_time: slotDef.start_time,
          end_time: slotDef.end_time,
          status_type: slotDef.default_weekday_status,
          activity: slotDef.default_weekday_activity
        });
      });

      weekend.forEach(day => {
        newSlots.push({
          id: Date.now() + Math.floor(Math.random() * 10000),
          coach_id: newCoach.id,
          coach_name: newCoach.name,
          rm_name: newCoach.trainer_manager,
          shift_name: selectedShift.name,
          day_of_week: day as any,
          start_time: slotDef.start_time,
          end_time: slotDef.end_time,
          status_type: slotDef.default_weekend_status,
          activity: slotDef.default_weekend_activity
        });
      });
    });

    setSlots([...slots, ...newSlots]);
  };

  const handleCreateShift = (newShift: ShiftTemplate) => {
    setShifts([...shifts, newShift]);
  };

  const handleDeleteShift = (shiftId: string) => {
    setShifts(shifts.filter(s => s.id !== shiftId));
  };

  const handleReassignSlot = (sourceSlot: Slot, targetSlotId: number) => {
    setSlots(prevSlots => {
      return prevSlots.map(s => {
        if (s.id === targetSlotId) {
          return {
            ...s,
            status_type: sourceSlot.status_type,
            activity: sourceSlot.activity,
            rm_name: sourceSlot.rm_name
          };
        }
        if (s.id === sourceSlot.id) {
          return {
            ...s,
            status_type: 'AVAILABLE',
            activity: 'X'
          };
        }
        return s;
      });
    });
    setIsBookingModalOpen(false);
  };

  const handleResolveConflict = (conflictId: string) => {
    setResolvedConflictIds(prev => [...prev, conflictId]);
  };

  const handleDeleteSlot = (slotId: number) => {
    setSlots(prevSlots => prevSlots.filter(s => s.id !== slotId));
    setIsBookingModalOpen(false);
  };

  const handleAddSlotsRow = (coachId: number, startTime: string, endTime: string) => {
    const targetCoach = coaches.find(c => c.id === coachId);
    if (!targetCoach) return;
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const coachSlots = slots.filter(s => s.coach_id === coachId);
    const existingShiftName = coachSlots.length > 0 ? coachSlots[0].shift_name : 'Custom';
    const existingRmName = coachSlots.length > 0 ? coachSlots[0].rm_name : (targetCoach.trainer_manager || 'Vedant Kamble');

    const newSlots: Slot[] = days.map(day => ({
      id: Date.now() + Math.floor(Math.random() * 100000),
      coach_id: coachId,
      coach_name: targetCoach.name,
      rm_name: existingRmName,
      shift_name: existingShiftName,
      day_of_week: day as any,
      start_time: startTime,
      end_time: endTime,
      status_type: 'AVAILABLE',
      activity: 'X'
    }));
    
    setSlots(prevSlots => [...prevSlots, ...newSlots]);
  };

  const handleDeleteSlotsRow = (coachId: number, startTime: string) => {
    if (confirm(`Are you sure you want to remove the entire time slot row starting at ${startTime}? This deletes all slots at this time range.`)) {
      setSlots(prevSlots => prevSlots.filter(s => !(s.coach_id === coachId && s.start_time === startTime)));
    }
  };

  return (
    <div className="app-root">
      {/* Header */}
      <Header
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        activePortal={activePortal}
        setActivePortal={setActivePortal}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        metrics={metrics}
        onResetDatabase={handleResetDatabase}
      />

      {/* Main Content Area */}
      <main className="main-container">
        {/* MANAGEMENT PORTAL */}
        <div style={{ display: activePortal === 'management' && activeTab === 'grid' ? 'block' : 'none' }}>
          <ScheduleGrid
            coaches={coaches}
            slots={slots}
            conflicts={conflicts}
            highlightedCoachTarget={highlightedCoachTarget}
            onSelectSlot={handleSelectSlotCell}
            onOpenBookingModal={handleOpenBookingForCoach}
          />
        </div>

        <div style={{ display: activePortal === 'management' && activeTab === 'search' ? 'block' : 'none' }}>
          <MultiDaySearch
            coaches={coaches}
            slots={slots}
            onBookSearchResult={handleBookSearchResult}
          />
        </div>

        <div style={{ display: activePortal === 'management' && activeTab === 'trainers' ? 'block' : 'none' }}>
          <TrainersPortal
            coaches={coaches}
            slots={slots}
            onOpenBookingModal={handleOpenBookingForCoach}
            onSelectCoachForProfile={(coachId) => {
              setActiveTab('profile');
              localStorage.setItem('upstep_selected_coach_id', coachId.toString());
            }}
            onUpdateCoach={handleUpdateCoach}
            onAddCoach={(newCoach) => handleAddCoach(newCoach, shifts[0])}
            onSelectSlot={handleSelectSlotCell}
          />
        </div>

        <div style={{ display: activePortal === 'management' && activeTab === 'daily_demo_slots' ? 'block' : 'none' }}>
          <DailyDemoSlotsHub
            coaches={coaches}
            slots={slots}
            onUpdateCoach={handleUpdateCoach}
          />
        </div>



        <div style={{ display: activePortal === 'management' && activeTab === 'profile' ? 'block' : 'none' }}>
          <CoachProfile
            coaches={coaches}
            slots={slots}
            onUpdateCoach={handleUpdateCoach}
            onSelectSlot={handleSelectSlotCell}
            onOpenBookingModal={handleOpenBookingForCoach}
            onAddSlotsRow={handleAddSlotsRow}
            onDeleteSlotsRow={handleDeleteSlotsRow}
          />
        </div>

        {/* ADMIN PORTAL */}
        <div style={{ display: activePortal === 'admin' && activeTab === 'shifts' ? 'block' : 'none' }}>
          <CustomShiftBuilder
            shifts={shifts}
            onCreateShift={handleCreateShift}
            onDeleteShift={handleDeleteShift}
          />
        </div>

        <div style={{ display: activePortal === 'admin' && activeTab === 'onboard' ? 'block' : 'none' }}>
          <CoachOnboarding
            shifts={shifts}
            onAddCoach={handleAddCoach}
          />
        </div>

        <div style={{ display: activePortal === 'admin' && activeTab === 'audit' ? 'block' : 'none' }}>
          <ConflictAudit
            conflicts={conflicts}
            coaches={coaches}
            slots={slots}
            onResolveConflict={handleResolveConflict}
            onIgnoreConflict={handleIgnoreConflict}
            ruleConfig={ruleConfig}
            onToggleRule={(ruleKey) => setRuleConfig(prev => ({ ...prev, [ruleKey]: !prev[ruleKey] }))}
            onGrantCoachException={(coachName) => {
              setActivePortal('management');
              setActiveTab('profile');
              const coachObj = coaches.find(c => c.name.toLowerCase() === coachName.toLowerCase() || c.display_name.toLowerCase() === coachName.toLowerCase());
              if (coachObj) {
                localStorage.setItem('upstep_selected_coach_id', coachObj.id.toString());
              }
            }}
            onSelectSlot={handleSelectSlotCell}
            onOpenBookingModal={handleOpenBookingForCoach}
          />
        </div>
      </main>

      {/* Slot Booking / Release Modal */}
      <SlotBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        slot={selectedSlot}
        targetCoachName={targetBookingInfo?.coachName}
        targetDay={targetBookingInfo?.day}
        targetStartTime={targetBookingInfo?.startTime}
        targetEndTime={targetBookingInfo?.endTime}
        onSaveSlot={handleSaveSlotBooking}
        coaches={coaches}
        slots={slots}
        onReassignSlot={handleReassignSlot}
        onDeleteSlot={handleDeleteSlot}
      />
    </div>
  );
}

export default App;
