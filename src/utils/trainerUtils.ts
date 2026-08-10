import type { Coach } from '../types';
import { COACH_TO_RM_MAP } from './coachRmMap';

export const HEAD_TRAINER_NAME = 'Shubham Kumthekar';

export const TRAINERS_LIST = [
  'Sujay Mondal',
  'Sairaj Chittal',
  'Pratik Gengaje',
  'Pratik Gaitonde',
  'Vatsal Shah',
  'Harsh Ghag'
];

export const ALL_EXPLICIT_TRAINERS = [HEAD_TRAINER_NAME, ...TRAINERS_LIST];

export function isTrainerOrHeadTrainer(coach: Coach): boolean {
  if (!coach) return false;
  const nameLower = (coach.name || coach.display_name || '').toLowerCase().trim();
  const isExplicit = ALL_EXPLICIT_TRAINERS.some(t => nameLower.includes(t.toLowerCase()) || t.toLowerCase().includes(nameLower));
  if (isExplicit) return true;
  if (coach.employee_id && coach.employee_id.startsWith('CUSTOM-TRN-')) return true;
  return false;
}

export function getExactRmForCoach(coachName: string, sfCoachName?: string): string {
  if (!coachName) return 'Vedant Kamble';
  if (COACH_TO_RM_MAP[coachName]) return COACH_TO_RM_MAP[coachName];
  if (sfCoachName && COACH_TO_RM_MAP[sfCoachName]) return COACH_TO_RM_MAP[sfCoachName];
  
  // Fuzzy match
  const cLower = coachName.toLowerCase().trim();
  for (const [k, v] of Object.entries(COACH_TO_RM_MAP)) {
    if (k.toLowerCase().trim() === cLower || cLower.includes(k.toLowerCase()) || k.toLowerCase().includes(cLower)) {
      return v;
    }
  }
  return 'Vedant Kamble';
}

export function ensureLeadTrainersInCoaches(coaches: Coach[]): Coach[] {
  // 1. Purge any fake RM coach entries
  let cleanedCoaches = coaches.filter(c => {
    if (ALL_EXPLICIT_TRAINERS.some(t => c.name.toLowerCase().includes(t.toLowerCase()))) return true;
    if (c.employee_id && c.employee_id.startsWith('CUSTOM-TRN-')) return true;
    if (c.employee_id && c.employee_id.startsWith('TRN-')) return false;
    return true;
  });

  let nextId = Math.max(...cleanedCoaches.map(c => c.id), 0) + 1;

  // 2. Ensure the 7 exact Trainers/Head Trainers exist in cleanedCoaches array
  const trainerObjects: Coach[] = [];

  // Head Trainer: Shubham Kumthekar
  let htIndex = cleanedCoaches.findIndex(c => c.name.toLowerCase().includes('shubham kumthekar'));
  if (htIndex !== -1) {
    cleanedCoaches[htIndex] = {
      ...cleanedCoaches[htIndex],
      category: 'Head Trainer',
      is_trainer: true,
      is_head_trainer: true,
      role_type: 'Head Trainer',
      rm_name: 'Operations Head'
    };
    trainerObjects.push(cleanedCoaches[htIndex]);
  } else {
    const ht: Coach = {
      id: nextId++,
      name: HEAD_TRAINER_NAME,
      display_name: HEAD_TRAINER_NAME,
      sf_coach_name: HEAD_TRAINER_NAME,
      category: 'Head Trainer',
      emp_type: 'Full Time',
      shift_days: 1,
      shift_type: 'Day Shift',
      standard_rating: 2200,
      tier: 'Tier 5',
      can_teach_upto: 'All Levels',
      demo_preference: 'Preference 1',
      demo_preference_color: '#10b981',
      languages: 'English, Hindi',
      employee_id: 'TRN-1001',
      trainer_manager: 'Executive Ops',
      rm_name: 'Operations Head',
      class_hours_per_day: 6.0,
      max_daily_classes: 4,
      max_daily_demos: 6,
      employment_model: 'Salaried',
      is_active: true,
      is_trainer: true,
      is_head_trainer: true,
      role_type: 'Head Trainer'
    };
    cleanedCoaches.push(ht);
    trainerObjects.push(ht);
  }

  // 6 Trainers: Sujay Mondal, Sairaj Chittal, Pratik Gengaje, Pratik Gaitonde, Vatsal Shah, Harsh Ghag
  TRAINERS_LIST.forEach((tName) => {
    let tIndex = cleanedCoaches.findIndex(c => c.name.toLowerCase().includes(tName.toLowerCase()));
    if (tIndex !== -1) {
      cleanedCoaches[tIndex] = {
        ...cleanedCoaches[tIndex],
        category: 'Trainer',
        is_trainer: true,
        is_head_trainer: false,
        role_type: 'Trainer',
        rm_name: 'Operations Head'
      };
      trainerObjects.push(cleanedCoaches[tIndex]);
    } else {
      const trn: Coach = {
        id: nextId++,
        name: tName,
        display_name: tName,
        sf_coach_name: tName,
        category: 'Trainer',
        emp_type: 'Full Time',
        shift_days: 1,
        shift_type: 'Day Shift',
        standard_rating: 2000,
        tier: 'Tier 5',
        can_teach_upto: 'All Levels',
        demo_preference: 'Preference 1',
        demo_preference_color: '#10b981',
        languages: 'English, Hindi',
        employee_id: `TRN-${1000 + trainerObjects.length + 1}`,
        trainer_manager: HEAD_TRAINER_NAME,
        rm_name: 'Operations Head',
        class_hours_per_day: 6.0,
        max_daily_classes: 4,
        max_daily_demos: 6,
        employment_model: 'Salaried',
        is_active: true,
        is_trainer: true,
        is_head_trainer: false,
        role_type: 'Trainer'
      };
      cleanedCoaches.push(trn);
      trainerObjects.push(trn);
    }
  });

  // 3. For all regular teaching coaches:
  // - Set exact RM from CSV (getExactRmForCoach)
  // - Assign trainer_manager to one of the 7 Trainers
  const active7Trainers = cleanedCoaches.filter(c => isTrainerOrHeadTrainer(c));
  const regularCoaches = cleanedCoaches.filter(c => !isTrainerOrHeadTrainer(c));

  regularCoaches.forEach((c, idx) => {
    const csvRmName = getExactRmForCoach(c.name, c.sf_coach_name);
    const assignedTrainer = active7Trainers[idx % active7Trainers.length];

    const coachIndexInUpdated = cleanedCoaches.findIndex(uc => uc.id === c.id);
    if (coachIndexInUpdated !== -1) {
      cleanedCoaches[coachIndexInUpdated] = {
        ...cleanedCoaches[coachIndexInUpdated],
        rm_name: csvRmName,
        trainer_manager: assignedTrainer.name,
        is_trainer: false,
        is_head_trainer: false,
        role_type: 'Coach'
      };
    }
  });

  return cleanedCoaches;
}
