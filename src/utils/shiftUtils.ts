import type { Coach, Slot } from '../types';

export const DAYS_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helper to convert time string to minutes
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*([AP]M)?$/i);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const modifier = (match[3] || '').toUpperCase();

  if (hours === 12) hours = 0;
  if (modifier === 'PM') hours += 12;

  return hours * 60 + minutes;
}

// Helper to add minutes to a time string and return formatted time
export function addMinutesToTime(timeStr: string, minsToAdd: number): string {
  const mins = timeToMinutes(timeStr);
  const totalMins = (mins + minsToAdd) % (24 * 60);
  let hours = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  let h = hours % 12;
  if (h === 0) h = 12;
  const mStr = m < 10 ? `0${m}` : `${m}`;
  return `${h}:${mStr} ${ampm}`;
}

// Helper to check if a slot time is in the early morning (before 8:00 AM)
export function isEarlyMorning(timeStr: string): boolean {
  const mins = timeToMinutes(timeStr);
  return mins < 8 * 60; // Before 8:00 AM
}

// Determine if a coach works night shift based on coach record or slots
export function isNightShiftCoach(coach?: Coach | null, coachId?: number, slots?: Slot[]): boolean {
  if (coach) {
    if (coach.shift_days === 2 || coach.shift_type === 'Night Shift') return true;
    if (coach.shift_days === 1 || coach.shift_type === 'Day Shift') return false;
  }

  if (coachId && slots) {
    const coachSlots = slots.filter(s => s.coach_id === coachId);
    if (coachSlots.length === 0) return false;

    const hasNight = coachSlots.some(s => {
      const mins = timeToMinutes(s.start_time);
      return mins >= 20 * 60; // 8:00 PM or later
    });
    const hasMorning = coachSlots.some(s => {
      const mins = timeToMinutes(s.start_time);
      return mins < 8 * 60; // Before 8:00 AM
    });
    return hasNight && hasMorning;
  }
  return false;
}

// Map day based on night shift early morning rule
export function getAdjustedSlotDay(
  day: string,
  startTime: string,
  isNightShift: boolean,
  direction: 'display' | 'db'
): string {
  if (!isNightShift || !isEarlyMorning(startTime)) {
    return day;
  }

  const idx = DAYS_ORDER.indexOf(day);
  if (idx === -1) return day;

  if (direction === 'display') {
    // DB Tuesday morning -> Display Monday night shift
    const prevIdx = (idx - 1 + 7) % 7;
    return DAYS_ORDER[prevIdx];
  } else {
    // Display Monday night shift -> DB Tuesday morning
    const nextIdx = (idx + 1) % 7;
    return DAYS_ORDER[nextIdx];
  }
}

// Rule 2: anything starting with 'x' or 'X' in front should not be considered a regular class (it is temporary or demo)
export function isTemporaryOrDemo(activity: string): boolean {
  if (!activity) return false;
  return activity.trim().toUpperCase().startsWith('X');
}
