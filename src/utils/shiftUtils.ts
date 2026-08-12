import type { Coach, Slot, SlotStatusType, DemoSubSlot, DateSlotOverride } from '../types';

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

export function formatDateIso(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDateDisplay(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${days[date.getDay()]} ${date.getDate()}-${months[date.getMonth()]}`;
}

export function getWeekStartMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekDates(baseDate: Date): Date[] {
  const mon = getWeekStartMonday(baseDate);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export interface ResolvedSlotState {
  status_type: SlotStatusType;
  activity: string;
  is_override: boolean;
  substitute_coach_name?: string;
  sub_slot_1?: DemoSubSlot;
  sub_slot_2?: DemoSubSlot;
  override_notes?: string;
}

export function resolveSlotStatusForDate(
  slot: Slot,
  targetDateStr: string,
  dateOverrides: DateSlotOverride[] = []
): ResolvedSlotState {
  // 1. Check Date-Specific Overrides
  const override = dateOverrides.find(o => o.slot_id === slot.id && o.target_date === targetDateStr);
  if (override) {
    return {
      status_type: override.status_type,
      activity: override.activity,
      is_override: true,
      substitute_coach_name: override.substitute_coach_name,
      sub_slot_1: override.sub_slot_1,
      sub_slot_2: override.sub_slot_2,
      override_notes: override.notes
    };
  }

  // 2. Check Permanent Class Start and Expiry (End) Dates
  if (slot.start_date && targetDateStr < slot.start_date) {
    return {
      status_type: 'AVAILABLE',
      activity: 'X',
      is_override: false
    };
  }

  if (slot.end_date && targetDateStr > slot.end_date) {
    return {
      status_type: 'AVAILABLE',
      activity: 'X (Expired)',
      is_override: false
    };
  }

  // 3. Fallback to original permanent schedule status
  return {
    status_type: slot.status_type,
    activity: slot.activity,
    is_override: false
  };
}
