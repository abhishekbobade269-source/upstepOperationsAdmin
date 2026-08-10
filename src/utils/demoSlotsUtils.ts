import type { Coach, Slot, DailyDemoSlotBlock, DemoSubSlot } from '../types';
import { addMinutesToTime, timeToMinutes } from './shiftUtils';

export const NO_DEMO_HIGHLIGHT_COLOR = '#EA9999';

export const PREFERENCE_COLOR_MAP: Record<string, string> = {
  'Preference 1': '#10b981', // Green
  'Preference 2': '#84cc16', // Light Green
  'Preference 3': '#eab308', // Yellow
  'Not to be given': '#ef4444', // Red
  'To Be Updated': '#ef4444'   // Red
};

export function isEligibleDemoMasterSlot(slot: Slot): boolean {
  if (!slot) return false;
  const act = (slot.activity || '').toUpperCase().trim();
  const st = slot.status_type;

  // 1. Activity starts with X (X, X Demo, X Coverup, X Temporary Class, X Temporary, etc.)
  if (act.startsWith('X')) return true;

  // 2. Purple Background / Inactive / Level Break / Requirement Block / Demo Class
  if (
    st === 'BATCH_LEVEL_BREAK' ||
    st === 'INACTIVE' ||
    st === 'REQUIREMENT_BLOCK' ||
    st === 'DEMO_CLASS' ||
    act.includes('LEVEL BREAK') ||
    act.includes('INACTIVE')
  ) {
    return true;
  }

  return false;
}

export function splitMasterSlotIntoSubSlots(
  startTime: string
): { sub1: DemoSubSlot; restBreakTime: string; sub2: DemoSubSlot } {
  const sub1Start = startTime;
  const sub1End = addMinutesToTime(startTime, 20);

  const restStart = sub1End;
  const restEnd = addMinutesToTime(startTime, 25);
  const restBreakTime = `${restStart} - ${restEnd}`;

  const sub2Start = restEnd;
  const sub2End = addMinutesToTime(startTime, 45);

  const sub1: DemoSubSlot = {
    slot_number: 1,
    start_time: sub1Start,
    end_time: sub1End,
    status: 'FREE'
  };

  const sub2: DemoSubSlot = {
    slot_number: 2,
    start_time: sub2Start,
    end_time: sub2End,
    status: 'FREE'
  };

  return { sub1, restBreakTime, sub2 };
}

export function generateDailyDemoSlotBlocks(
  dateStr: string,
  dayOfWeek: string,
  coaches: Coach[],
  slots: Slot[]
): DailyDemoSlotBlock[] {
  const daySlots = slots.filter(s => s.day_of_week === dayOfWeek);

  const demoBlocks: DailyDemoSlotBlock[] = [];

  daySlots.forEach(s => {
    if (!isEligibleDemoMasterSlot(s)) return;

    const coach = coaches.find(c => c.id === s.coach_id);
    if (!coach) return;

    const { sub1, restBreakTime, sub2 } = splitMasterSlotIntoSubSlots(s.start_time);

    // Remarks determination
    const act = (s.activity || '').trim();
    let remark = act;
    if (/^X Demo$/i.test(act) || /^X Coverup$/i.test(act) || act === 'X') {
      remark = 'X Demo';
    } else if (/^X Temporary Class$/i.test(act) || /^X Temporary$/i.test(act)) {
      remark = 'X Temporary';
    } else if (s.status_type === 'BATCH_LEVEL_BREAK' || s.status_type === 'INACTIVE') {
      remark = 'Purple Slot (Inactive/Break)';
    }

    // Demo preference
    const prefText = coach.demo_preference || 'Preference 1';
    const prefColor = PREFERENCE_COLOR_MAP[prefText] || coach.demo_preference_color || '#10b981';

    // Ineligible highlight check (pink if Not to be given or inactive)
    const isNoDemo = prefText.toLowerCase().includes('not to be given') || prefText.toLowerCase().includes('to be updated');

    demoBlocks.push({
      id: `${dateStr}-${s.id}`,
      date_str: dateStr,
      day_of_week: dayOfWeek,
      coach_id: coach.id,
      coach_name: coach.display_name,
      sf_coach_name: coach.sf_coach_name,
      rm_name: coach.rm_name || 'Vedant Kamble',
      trainer_manager: coach.trainer_manager || 'Shubham Kumthekar',
      master_start_time: s.start_time,
      master_end_time: s.end_time,
      sub_slot_1: sub1,
      rest_break_time: restBreakTime,
      sub_slot_2: sub2,
      remarks: remark,
      demo_preference: prefText,
      demo_preference_color: prefColor,
      is_no_demo_highlighted: isNoDemo
    });
  });

  // Sort blocks by start_time
  demoBlocks.sort((a, b) => timeToMinutes(a.master_start_time) - timeToMinutes(b.master_start_time));

  return demoBlocks;
}
