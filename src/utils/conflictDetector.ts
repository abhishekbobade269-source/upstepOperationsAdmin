import type { Slot, Coach, ConflictReport, AuditRuleConfig } from '../types';
import { timeToMinutes } from './shiftUtils';

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
  if (
    slot.status_type === 'REST_BREAK' ||
    slot.status_type === 'OFF_DUTY' ||
    slot.status_type === 'REPORT_BUILDING' ||
    slot.status_type === 'BATCH_LEVEL_BREAK' ||
    slot.status_type === 'INACTIVE' ||
    slot.status_type === 'AVAILABLE' ||
    slot.activity === 'X' ||
    slot.activity === 'OFF' ||
    slot.activity === 'BREAK'
  ) {
    return false;
  }
  return true;
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

    // 3. Consecutive Sessions & 3h Continuous Teaching Break Checks (Per Day)
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    days.forEach(day => {
      const daySlots = coachSlots
        .filter(s => s.day_of_week === day)
        .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

      let consecutiveSessionsCount = 0;
      let continuousTeachingMins = 0;

      daySlots.forEach((s) => {
        if (isActiveClassSlot(s)) {
          consecutiveSessionsCount++;
          const dur = getSlotDurationMinutes(s.start_time, s.end_time);
          continuousTeachingMins += dur;

          // Check consecutive session limit (> 4)
          if (ruleConfig.enableConsecutiveSessionsCheck && !isConsecutiveExempt && consecutiveSessionsCount === 5) {
            conflicts.push({
              id: `conf-consec-${counter++}`,
              type: 'CONSECUTIVE_SESSIONS_BREACH',
              coach_name: coachName,
              day: day,
              description: `Exceeded maximum 4 consecutive sessions without a break! 5+ back-to-back classes detected starting at ${s.start_time}.`,
              slot1: `Class ${s.start_time} (${s.activity})`
            });
          }

          // Check 3h continuous teaching break rule
          if (ruleConfig.enableRestBreakCheck && continuousTeachingMins > 180) {
            conflicts.push({
              id: `conf-restbreak-${counter++}`,
              type: 'REST_BREAK_VIOLATION',
              coach_name: coachName,
              day: day,
              description: `Continuous teaching exceeded 3 hours (${(continuousTeachingMins / 60).toFixed(1)} hrs) without a minimum 10-minute break.`,
              slot1: `Slot at ${s.start_time} - ${s.end_time}`
            });
          }
        } else {
          // Reset continuous counts on break slot
          consecutiveSessionsCount = 0;
          continuousTeachingMins = 0;
        }
      });
    });
  });

  return conflicts;
}
