export type Role = 'admin' | 'manager' | 'rm';

export type SlotStatusType = 
  | 'AVAILABLE'                    // Free Slot (X)
  | 'OFF_DUTY'                     // Off/Meal BREAK (Red)
  | 'REST_BREAK'                    // Off/Meal BREAK (Red)
  | 'BATCH_LEVEL_BREAK'            // BREAK/Inactive (Purple)
  | 'INACTIVE'                     // BREAK/Inactive (Purple)
  | 'REQUIREMENT_BLOCK'            // Requirement Block (Yellow)
  | 'NEXT_MONTH_BLOCK'             // Next Month Block (Cyan)
  | 'ODD_SLOT'                     // Odd Slot (Magenta / Hot Pink)
  | 'TRAINING'                     // Training (Mauve / Dusty Pink)
  | 'PERMANENT_SUBSTITUTE'         // Permanent Substitute (Orange)
  | 'LONG_LEAVE_SUBSTITUTE'        // Long Leave Substitute (Royal Blue)
  | 'NOTICE_PERIOD'                // Notice Period (Bright Green)
  | 'REPORT_BUILDING'              // Report-building time (Mustard Gold / Olive)
  | 'CLASSES_NEED_TO_BE_MANAGED'   // Classes need to be managed (Teal / Sea Green)
  | 'SCHEDULED_CLASS'              // Scheduled Permanent Class
  | 'TEMPORARY_CLASS'              // Temporary Class
  | 'DEMO_CLASS'                   // Demo Slot / X Demo
  | 'SUBSTITUTE_CLASS';            // Substitute Class

export interface Coach {
  id: number;
  name: string;
  display_name: string;
  sf_coach_name: string;
  category: string;
  emp_type: 'Full Time' | 'Part Time';
  shift_days: 1 | 2;
  shift_type: 'Day Shift' | 'Night Shift';
  standard_rating: number;
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Tier 4' | 'Tier 5' | 'No Tier';
  can_teach_upto: string;
  demo_preference: string;
  demo_preference_color: string;
  languages: string;
  employee_id: string;
  trainer_manager: string; // Assigned Trainer (Sujay Mondal, Shubham Kumthekar, etc.)
  rm_name?: string;        // Assigned Relationship Manager (Vedant Kamble, Navdeepkaur Bagal, etc.)
  remarks?: string;
  class_hours_per_day: number;
  max_daily_classes: number;
  max_daily_demos: number;
  employment_model: 'Salaried' | 'Contract';
  is_active: boolean;
  is_trainer?: boolean;
  is_head_trainer?: boolean;
  role_type?: 'Coach' | 'Trainer' | 'Head Trainer';
  profile_pic?: string;
  custom_weekly_hours_limit?: number; // Override default 36h/18h limit
  exempt_consecutive_limit?: boolean; // Exempt from max 4 consecutive sessions rule
  exempt_capacity_limit?: boolean;    // Exempt from weekly hours capacity limit
  special_exception_notes?: string;
}

export interface RelationshipManager {
  id: number;
  name: string;
  display_name: string;
  employee_id: string;
  email?: string;
  phone?: string;
  assigned_coaches_count?: number;
}

export interface AuditRuleConfig {
  enableOverlapCheck: boolean;
  enableWeeklyCapacityCheck: boolean;
  enableConsecutiveSessionsCheck: boolean;
  enableRestBreakCheck: boolean;
  enableMidnightCrossoverCheck: boolean;
  enableTierMatchCheck: boolean;
}

export interface Slot {
  id: number;
  coach_id: number;
  coach_name: string;
  rm_name: string;
  shift_name: string;
  day_of_week: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  start_time: string;
  end_time: string;
  status_type: SlotStatusType;
  activity: string; // Batch Code (e.g. SIN-MPI-466), BREAK, Report-building time, etc.
  notes?: string;
}

export interface ShiftSlotDefinition {
  id: string;
  start_time: string;
  end_time: string;
  monday_status?: SlotStatusType;
  monday_activity?: string;
  tuesday_status?: SlotStatusType;
  tuesday_activity?: string;
  wednesday_status?: SlotStatusType;
  wednesday_activity?: string;
  thursday_status?: SlotStatusType;
  thursday_activity?: string;
  friday_status?: SlotStatusType;
  friday_activity?: string;
  saturday_status?: SlotStatusType;
  saturday_activity?: string;
  sunday_status?: SlotStatusType;
  sunday_activity?: string;
  default_weekday_status: SlotStatusType;
  default_weekday_activity: string;
  default_weekend_status: SlotStatusType;
  default_weekend_activity: string;
}

export interface ShiftTemplate {
  id: string;
  name: string;
  shift_type: 'Full Time' | 'Part Time';
  working_days: string; // e.g. "Mon-Sat", "Tue-Sun"
  regions: string[];    // ["UK", "USA", "AUS", "IND", "SIN", "UAE", "EUR", "WW"]
  requires_daylight: boolean;
  slots: ShiftSlotDefinition[];
}

export interface ConflictReport {
  id: string;
  type: 'OVERLAP' | 'CAPACITY_BREACH' | 'CONSECUTIVE_SESSIONS_BREACH' | 'REST_BREAK_VIOLATION' | 'RATING_MISMATCH' | 'MIDNIGHT_CROSSOVER';
  coach_name: string;
  day: string;
  description: string;
  slot1?: string;
  slot2?: string;
}

export interface SearchCriteria {
  days: string[];
  start_time: string;
  end_time: string;
  min_rating: number;
  tier: string;
  can_teach_upto: string;
  language: string;
  region: string;
  include_purple_slots: boolean;
}

export interface DemoSubSlot {
  slot_number: 1 | 2; // 1st 20 Mins or 2nd 20 Mins
  start_time: string; // e.g. "5:00 PM" (1st 20 Mins) or "5:25 PM" (2nd 20 Mins)
  end_time: string;   // e.g. "5:20 PM" (1st 20 Mins) or "5:45 PM" (2nd 20 Mins)
  status: 'FREE' | 'BOOKED' | 'CANCELLED';
  student_name?: string;
  student_level?: string;
  demo_topic?: string;
  notes?: string;
}

export interface DailyDemoSlotBlock {
  id: string;
  date_str: string;         // e.g. "07-Aug-2026"
  day_of_week: string;      // e.g. "Friday"
  coach_id: number;
  coach_name: string;
  sf_coach_name: string;
  rm_name: string;
  trainer_manager: string;
  master_start_time: string; // e.g. "5:00 PM"
  master_end_time: string;   // e.g. "5:45 PM"
  sub_slot_1: DemoSubSlot;   // 1st 20 Mins (5:00 PM - 5:20 PM)
  rest_break_time: string;   // 5 Min Rest Break (5:20 PM - 5:25 PM)
  sub_slot_2: DemoSubSlot;   // 2nd 20 Mins (5:25 PM - 5:45 PM)
  remarks: string;           // "X Demo", "X Temporary", "Purple Slot (Inactive/Break)", etc.
  demo_preference: string;   // "Preference 1", "Preference 2", "Preference 3", "Not to be given", etc.
  demo_preference_color: string; // Green (#00ff00), Light Green (#90ee90), Yellow (#ffff00), Red (#ff0000)
  is_no_demo_highlighted: boolean; // Pink highlight (#EA9999) if Foundation & Master Demo are both No/Hold/Ineligible
}
