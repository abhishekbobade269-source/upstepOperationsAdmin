import type { Slot, Coach, ConflictReport, AuditRuleConfig } from '../types';
import { timeToMinutes, isNightShiftCoach } from './shiftUtils';

export const DEFAULT_RULE_CONFIG: AuditRuleConfig = {
  enableOverlapCheck: true,
  enableWeeklyCapacityCheck: true,
  enableConsecutiveSessionsCheck: true,
  enableRestBreakCheck: true,
  enableMidnightCrossoverCheck: true,
  enableTierMatchCheck: true
};

export function getSlotDurationMinutes(startTime: string, endTime: string): number {
  const s = timeToMinutes(startTime);
  let e = timeToMinutes(endTime);
  if (e <= s) e += 24 * 60; // Overnight slot
  return e - s;
}

export function isActiveClassSlot(slot: Slot): boolean {
  if (!slot) return false;
  const st = slot.status_type;
  const act = (slot.activity || '').trim().toUpperCase();

  if (
    st === 'REST_BREAK' ||
    st === 'OFF_DUTY' ||
    st === 'REPORT_BUILDING' ||
    st === 'BATCH_LEVEL_BREAK' ||
    st === 'INACTIVE' ||
    st === 'AVAILABLE' ||
    st === 'REQUIREMENT_BLOCK' ||
    st === 'NEXT_MONTH_BLOCK' ||
    st === 'ODD_SLOT' ||
    st === 'TRAINING' ||
    st === 'NOTICE_PERIOD' ||
    act === 'X' ||
    act === 'OFF' ||
    act === 'BREAK' ||
    act.includes('MEAL BREAK') ||
    act.includes('LEVEL BREAK') ||
    act.includes('INACTIVE') ||
    act.includes('REPORT-BUILDING') ||
    act.includes('REPORT BUILDING') ||
    act.includes('TRAINING') ||
    act.includes('REQUIREMENT BLOCK') ||
    act.includes('NEXT MONTH') ||
    act.includes('ODD SLOT') ||
    act === 'X (EXPIRED)'
  ) {
    return false;
  }
  return true;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

interface ShiftRun {
  shiftDay: string;
  isNightShift: boolean;
  slots: Slot[];
}

export function detectScheduleConflicts(
  slots: Slot[],
  coaches?: Coach[],
  ruleConfig: AuditRuleConfig = DEFAULT_RULE_CONFIG
): ConflictReport[] {
  const conflicts: ConflictReport[] = [];
  let counter = 1;

  // 1. Check for double-booking overlaps
  if (ruleConfig.enableOverlapCheck) {
    const classSlotsMap = new Map<string, Slot[]>();
    slots.forEach(slot => {
      if (isActiveClassSlot(slot)) {
        const key = `${slot.coach_id}_${slot.day_of_week}_${slot.start_time}`;
        if (!classSlotsMap.has(key)) {
          classSlotsMap.set(key, []);
        }
        classSlotsMap.get(key)!.push(slot);
      }
    });

    classSlotsMap.forEach((slotList) => {
      if (slotList.length > 1) {
        const s1 = slotList[0];
        const s2 = slotList[1];
        conflicts.push({
          id: `conf-overlap-${counter++}`,
          type: 'OVERLAP',
          coach_name: s1.coach_name,
          day: s1.day_of_week,
          description: `Overlapping class assignment detected at ${s1.start_time} - ${s1.end_time}.`,
          slot1: `${s1.start_time} - ${s1.end_time} (${s1.activity})`,
          slot2: `${s2.start_time} - ${s2.end_time} (${s2.activity})`
        });
      }
    });
  }

  // Group slots by coach
  const slotsByCoachMap = new Map<number, Slot[]>();
  slots.forEach(slot => {
    if (!slotsByCoachMap.has(slot.coach_id)) {
      slotsByCoachMap.set(slot.coach_id, []);
    }
    slotsByCoachMap.get(slot.coach_id)!.push(slot);
  });

  slotsByCoachMap.forEach((coachSlots, coachId) => {
    const coachObj = coaches?.find(c => c.id === coachId);
    const coachName = coachSlots[0]?.coach_name || `Coach ${coachId}`;
    const empType = coachObj?.emp_type || (coachSlots[0]?.shift_name?.includes('PT') ? 'Part Time' : 'Full Time');
    
    const defaultMaxHours = empType === 'Part Time' ? 18 : 36;
    const maxWeeklyHours = coachObj?.custom_weekly_hours_limit || defaultMaxHours;
    const isCapacityExempt = coachObj?.exempt_capacity_limit || false;
    const isConsecutiveExempt = coachObj?.exempt_consecutive_limit || false;

    // 2. Calculate Weekly Working Hours
    if (ruleConfig.enableWeeklyCapacityCheck && !isCapacityExempt) {
      let totalWeeklyMins = 0;
      coachSlots.forEach(s => {
        if (isActiveClassSlot(s)) {
          totalWeeklyMins += getSlotDurationMinutes(s.start_time, s.end_time);
        }
      });

      const totalWeeklyHours = +(totalWeeklyMins / 60).toFixed(1);
      if (totalWeeklyHours > maxWeeklyHours) {
        conflicts.push({
          id: `conf-capacity-${counter++}`,
          type: 'CAPACITY_BREACH',
          coach_name: coachName,
          day: 'All Days',
          description: `Weekly working hours limit exceeded! Assigned ${totalWeeklyHours} hrs (${empType} limit: ${maxWeeklyHours} hrs/week).`,
          slot1: `Weekly Total: ${totalWeeklyHours} hrs / ${maxWeeklyHours} hrs limit`
        });
      }
    }

    // 3. Midnight Crossover Check (Day shift coach assigned overnight slots)
    if (ruleConfig.enableMidnightCrossoverCheck) {
      const isNight = isNightShiftCoach(coachObj, coachId, coachSlots);
      if (!isNight) {
        // Coach is Day Shift -> check for any active class slots in overnight hours (10:30 PM - 6:00 AM)
        coachSlots.forEach(s => {
          if (isActiveClassSlot(s)) {
            const mins = timeToMinutes(s.start_time);
            if (mins >= 22 * 60 + 30 || mins < 6 * 60) {
              conflicts.push({
                id: `conf-crossover-${counter++}`,
                type: 'MIDNIGHT_CROSSOVER',
                coach_name: coachName,
                day: s.day_of_week,
                description: `Day shift coach assigned to overnight slot at ${s.start_time} - ${s.end_time}.`,
                slot1: `${s.day_of_week} ${s.start_time} - ${s.end_time} (${s.activity})`
              });
            }
          }
        });
      }
    }

    // 4. Consecutive Sessions & 3h Continuous Teaching Break Checks (Per Shift Run)
    const isNight = isNightShiftCoach(coachObj, coachId, coachSlots);
    const shiftRuns: ShiftRun[] = [];

    if (isNight) {
      // Night Shift: Shift Day D starts in the evening of Day D (e.g. 11:00 PM) 
      // and continues into early morning of Day D+1 (e.g. 12:30 AM - 7:00 AM)
      DAYS_OF_WEEK.forEach((day, idx) => {
        const nextDay = DAYS_OF_WEEK[(idx + 1) % 7];
        
        // Evening slots on Day D (>= 12:00 PM)
        const eveningSlots = coachSlots
          .filter(s => s.day_of_week === day && timeToMinutes(s.start_time) >= 12 * 60)
          .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
        
        // Morning slots on Day D+1 (< 12:00 PM)
        const morningSlots = coachSlots
          .filter(s => s.day_of_week === nextDay && timeToMinutes(s.start_time) < 12 * 60)
          .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

        const combinedSlots = [...eveningSlots, ...morningSlots];
        if (combinedSlots.length > 0) {
          shiftRuns.push({
            shiftDay: day,
            isNightShift: true,
            slots: combinedSlots
          });
        }
      });
    } else {
      // Day Shift: Slots on Day D sorted chronologically from morning to evening
      DAYS_OF_WEEK.forEach(day => {
        const daySlots = coachSlots
          .filter(s => s.day_of_week === day)
          .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

        if (daySlots.length > 0) {
          shiftRuns.push({
            shiftDay: day,
            isNightShift: false,
            slots: daySlots
          });
        }
      });
    }

    // Evaluate consecutive sessions and continuous teaching minutes along each Shift Run
    shiftRuns.forEach(run => {
      let consecutiveSessionsCount = 0;
      let continuousTeachingMins = 0;
      let prevSlot: Slot | null = null;
      let streakStartSlot: Slot | null = null;

      run.slots.forEach((s) => {
        if (isActiveClassSlot(s)) {
          const sDur = getSlotDurationMinutes(s.start_time, s.end_time);

          // Check if contiguous with previous slot or if there was an off-duty gap
          if (prevSlot && isActiveClassSlot(prevSlot)) {
            const prevEndMins = timeToMinutes(prevSlot.end_time);
            const sStartMins = timeToMinutes(s.start_time);
            let gap = sStartMins - prevEndMins;
            if (gap < -720) gap += 1440; // overnight crossover boundary

            if (gap > 15) {
              // Off-duty gap > 15 mins: Not back-to-back, reset streak
              consecutiveSessionsCount = 1;
              continuousTeachingMins = sDur;
              streakStartSlot = s;
            } else {
              // Contiguous back-to-back class
              consecutiveSessionsCount++;
              continuousTeachingMins += sDur;
            }
          } else {
            // First class after a break slot, non-teaching slot, or start of shift
            consecutiveSessionsCount = 1;
            continuousTeachingMins = sDur;
            streakStartSlot = s;
          }

          // Check consecutive session limit (> 4 back-to-back classes)
          // Rule: Max 4 consecutive sessions allowed. 5+ consecutive classes without break is a conflict.
          if (ruleConfig.enableConsecutiveSessionsCheck && !isConsecutiveExempt && consecutiveSessionsCount === 5) {
            conflicts.push({
              id: `conf-consec-${counter++}`,
              type: 'CONSECUTIVE_SESSIONS_BREACH',
              coach_name: coachName,
              day: run.shiftDay,
              description: `Exceeded maximum 4 consecutive sessions without a break! 5+ back-to-back classes detected starting at ${streakStartSlot?.start_time || s.start_time} on ${run.shiftDay} ${run.isNightShift ? 'Night Shift' : 'Shift'}.`,
              slot1: `Class ${s.start_time} - ${s.end_time} (${s.activity})`
            });
          }

          // Check 3h continuous teaching break rule
          if (ruleConfig.enableRestBreakCheck && continuousTeachingMins > 180) {
            conflicts.push({
              id: `conf-restbreak-${counter++}`,
              type: 'REST_BREAK_VIOLATION',
              coach_name: coachName,
              day: run.shiftDay,
              description: `Continuous teaching exceeded 3 hours (${(continuousTeachingMins / 60).toFixed(1)} hrs) without a minimum 10-minute break on ${run.shiftDay} ${run.isNightShift ? 'Night Shift' : 'Shift'}.`,
              slot1: `Slot at ${s.start_time} - ${s.end_time} (${s.activity})`
            });
          }
        } else {
          // Reset continuous counts on break / non-teaching slot
          consecutiveSessionsCount = 0;
          continuousTeachingMins = 0;
          streakStartSlot = null;
        }

        prevSlot = s;
      });
    });
  });

  return conflicts;
}
