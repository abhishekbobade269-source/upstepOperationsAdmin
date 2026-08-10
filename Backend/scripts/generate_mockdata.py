import json

with open('templates_output.json', 'r') as f:
    templates = json.load(f)

ts_content = f"""import type {{ Coach, Slot, ShiftTemplate, ConflictReport }} from './types';

export const INITIAL_COACHES: Coach[] = [
  {{
    id: 1,
    name: 'Aafrin Deshmukh',
    display_name: 'Aafrin Deshmukh',
    sf_coach_name: 'Aafrin Mohammed Imran Deshmukh',
    category: 'CT5',
    emp_type: 'Part Time',
    standard_rating: 1797,
    tier: 'Tier 2',
    can_teach_upto: 'Junior',
    demo_preference: 'Preference 1',
    demo_preference_color: '#00ff00',
    languages: 'English, Hindi',
    employee_id: 'EMP-1001',
    trainer_manager: 'Vedant Kamble',
    remarks: 'Prefers afternoon batches',
    class_hours_per_day: 4.5,
    max_daily_classes: 6,
    max_daily_demos: 12,
    employment_model: 'Salaried',
    is_active: true,
    profile_pic: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'
  }},
  {{
    id: 2,
    name: 'Aarti Thakur',
    display_name: 'Aarti Thakur',
    sf_coach_name: 'Aarti Abhishek Thakur',
    category: 'CT3',
    emp_type: 'Full Time',
    standard_rating: 1950,
    tier: 'Tier 3',
    can_teach_upto: 'Advanced Part 2',
    demo_preference: 'Preference 1',
    demo_preference_color: '#00ff00',
    languages: 'English, Hindi, Marathi',
    employee_id: 'EMP-1002',
    trainer_manager: 'Navdeepkaur Bagal',
    remarks: 'FIDE Rated Trainer',
    class_hours_per_day: 6.0,
    max_daily_classes: 8,
    max_daily_demos: 16,
    employment_model: 'Salaried',
    is_active: true,
    profile_pic: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200'
  }},
  {{
    id: 3,
    name: 'Abhilasha Jha',
    display_name: 'Abhilasha Jha',
    sf_coach_name: 'Abhilasha Pankaj Jha',
    category: 'CT3',
    emp_type: 'Full Time',
    standard_rating: 1850,
    tier: 'Tier 3',
    can_teach_upto: 'Advanced Part 2',
    demo_preference: 'Preference 2',
    demo_preference_color: '#90EE90',
    languages: 'English, Hindi',
    employee_id: 'EMP-1003',
    trainer_manager: 'Sana Choudhary',
    remarks: 'Expert in Group Batches',
    class_hours_per_day: 6.0,
    max_daily_classes: 8,
    max_daily_demos: 16,
    employment_model: 'Salaried',
    is_active: true,
    profile_pic: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=200'
  }},
  {{
    id: 4,
    name: 'Abhishek Deshpande',
    display_name: 'Abhishek Deshpande',
    sf_coach_name: 'Abhishek Balkrishna Deshpande',
    category: 'CT1',
    emp_type: 'Part Time',
    standard_rating: 1975,
    tier: 'Tier 3',
    can_teach_upto: 'Senior Part 2',
    demo_preference: 'Preference 1',
    demo_preference_color: '#00ff00',
    languages: 'English, Hindi, Marathi',
    employee_id: 'EMP-1004',
    trainer_manager: 'Nazeer Basha',
    remarks: 'Senior Master Coach',
    class_hours_per_day: 4.5,
    max_daily_classes: 6,
    max_daily_demos: 10,
    employment_model: 'Contract',
    is_active: true,
    profile_pic: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
  }},
  {{
    id: 5,
    name: 'Abhishek Patil',
    display_name: 'Abhishek Patil',
    sf_coach_name: 'Abhishek Charudatta Patil',
    category: 'CT2',
    emp_type: 'Part Time',
    standard_rating: 1551,
    tier: 'Tier 1',
    can_teach_upto: 'Sub-Junior',
    demo_preference: 'Preference 3',
    demo_preference_color: '#FFFF00',
    languages: 'English, Marathi',
    employee_id: 'EMP-1005',
    trainer_manager: 'Shailendra Waingankar',
    remarks: 'Specializes in Beginners',
    class_hours_per_day: 4.5,
    max_daily_classes: 6,
    max_daily_demos: 12,
    employment_model: 'Salaried',
    is_active: true,
    profile_pic: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'
  }},
  {{
    id: 6,
    name: 'Rishabh Chopra',
    display_name: 'Rishabh Chopra',
    sf_coach_name: 'Rishabh Chopra',
    category: 'CT4',
    emp_type: 'Full Time',
    standard_rating: 2050,
    tier: 'Tier 4',
    can_teach_upto: 'Senior Part 1',
    demo_preference: 'Preference 1',
    demo_preference_color: '#00ff00',
    languages: 'English, Hindi',
    employee_id: 'EMP-1006',
    trainer_manager: 'Sachin Haldankar',
    remarks: 'Night Shift Expert (US/UK)',
    class_hours_per_day: 6.5,
    max_daily_classes: 8,
    max_daily_demos: 16,
    employment_model: 'Salaried',
    is_active: true,
    profile_pic: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200'
  }}
];

export const INITIAL_SHIFTS: ShiftTemplate[] = {json.dumps(templates, indent=2)};

export const INITIAL_SLOTS: Slot[] = [
  // Coach 1: Aafrin Deshmukh (Shift5-PT-C-New)
  {{ id: 101, coach_id: 1, coach_name: 'Aafrin Deshmukh', rm_name: 'Vedant Kamble', shift_name: 'Shift5-PT-C-New', day_of_week: 'Monday', start_time: '11:45 AM', end_time: '12:30 PM', status_type: 'SCHEDULED_CLASS', activity: 'SIN-MPI-466' }},
  {{ id: 102, coach_id: 1, coach_name: 'Aafrin Deshmukh', rm_name: 'Vedant Kamble', shift_name: 'Shift5-PT-C-New', day_of_week: 'Tuesday', start_time: '11:45 AM', end_time: '12:30 PM', status_type: 'SCHEDULED_CLASS', activity: 'SIN-MPI-466' }},
  {{ id: 103, coach_id: 1, coach_name: 'Aafrin Deshmukh', rm_name: 'Vedant Kamble', shift_name: 'Shift5-PT-C-New', day_of_week: 'Wednesday', start_time: '11:45 AM', end_time: '12:30 PM', status_type: 'SCHEDULED_CLASS', activity: 'SIN-MPI-466' }},
  {{ id: 104, coach_id: 1, coach_name: 'Aafrin Deshmukh', rm_name: 'Vedant Kamble', shift_name: 'Shift5-PT-C-New', day_of_week: 'Thursday', start_time: '11:45 AM', end_time: '12:30 PM', status_type: 'SCHEDULED_CLASS', activity: 'SIN-MPI-466' }},
  {{ id: 105, coach_id: 1, coach_name: 'Aafrin Deshmukh', rm_name: 'Vedant Kamble', shift_name: 'Shift5-PT-C-New', day_of_week: 'Friday', start_time: '11:45 AM', end_time: '12:30 PM', status_type: 'SCHEDULED_CLASS', activity: 'SIN-MPI-466' }},
  
  {{ id: 106, coach_id: 1, coach_name: 'Aafrin Deshmukh', rm_name: 'Vedant Kamble', shift_name: 'Shift5-PT-C-New', day_of_week: 'Monday', start_time: '12:30 PM', end_time: '1:15 PM', status_type: 'SCHEDULED_CLASS', activity: 'SIN-FPI-774' }},
  {{ id: 107, coach_id: 1, coach_name: 'Aafrin Deshmukh', rm_name: 'Vedant Kamble', shift_name: 'Shift5-PT-C-New', day_of_week: 'Tuesday', start_time: '12:30 PM', end_time: '1:15 PM', status_type: 'SCHEDULED_CLASS', activity: 'AUS-MPI-728-NDL' }},
  {{ id: 108, coach_id: 1, coach_name: 'Aafrin Deshmukh', rm_name: 'Vedant Kamble', shift_name: 'Shift5-PT-C-New', day_of_week: 'Wednesday', start_time: '12:30 PM', end_time: '1:15 PM', status_type: 'SCHEDULED_CLASS', activity: 'SIN-FPI-774' }},
  {{ id: 109, coach_id: 1, coach_name: 'Aafrin Deshmukh', rm_name: 'Vedant Kamble', shift_name: 'Shift5-PT-C-New', day_of_week: 'Thursday', start_time: '12:30 PM', end_time: '1:15 PM', status_type: 'SCHEDULED_CLASS', activity: 'AUS-MPI-728-NDL' }},
  {{ id: 110, coach_id: 1, coach_name: 'Aafrin Deshmukh', rm_name: 'Vedant Kamble', shift_name: 'Shift5-PT-C-New', day_of_week: 'Friday', start_time: '12:30 PM', end_time: '1:15 PM', status_type: 'SCHEDULED_CLASS', activity: 'WW-MPI-569' }},
  
  {{ id: 111, coach_id: 1, coach_name: 'Aafrin Deshmukh', rm_name: 'Vedant Kamble', shift_name: 'Shift5-PT-C-New', day_of_week: 'Monday', start_time: '1:15 PM', end_time: '2:00 PM', status_type: 'REST_BREAK', activity: 'BREAK' }},
  {{ id: 112, coach_id: 1, coach_name: 'Aafrin Deshmukh', rm_name: 'Vedant Kamble', shift_name: 'Shift5-PT-C-New', day_of_week: 'Tuesday', start_time: '1:15 PM', end_time: '2:00 PM', status_type: 'REST_BREAK', activity: 'BREAK' }},
  {{ id: 113, coach_id: 1, coach_name: 'Aafrin Deshmukh', rm_name: 'Vedant Kamble', shift_name: 'Shift5-PT-C-New', day_of_week: 'Wednesday', start_time: '1:15 PM', end_time: '2:00 PM', status_type: 'REST_BREAK', activity: 'BREAK' }},
  {{ id: 114, coach_id: 1, coach_name: 'Aafrin Deshmukh', rm_name: 'Vedant Kamble', shift_name: 'Shift5-PT-C-New', day_of_week: 'Thursday', start_time: '1:15 PM', end_time: '2:00 PM', status_type: 'REST_BREAK', activity: 'BREAK' }},
  {{ id: 115, coach_id: 1, coach_name: 'Aafrin Deshmukh', rm_name: 'Vedant Kamble', shift_name: 'Shift5-PT-C-New', day_of_week: 'Friday', start_time: '1:15 PM', end_time: '2:00 PM', status_type: 'REST_BREAK', activity: 'BREAK' }},

  {{ id: 116, coach_id: 1, coach_name: 'Aafrin Deshmukh', rm_name: 'Vedant Kamble', shift_name: 'Shift5-PT-C-New', day_of_week: 'Monday', start_time: '2:00 PM', end_time: '2:45 PM', status_type: 'AVAILABLE', activity: 'X' }},
  {{ id: 117, coach_id: 1, coach_name: 'Aafrin Deshmukh', rm_name: 'Vedant Kamble', shift_name: 'Shift5-PT-C-New', day_of_week: 'Tuesday', start_time: '2:00 PM', end_time: '2:45 PM', status_type: 'AVAILABLE', activity: 'X' }},
  {{ id: 118, coach_id: 1, coach_name: 'Aafrin Deshmukh', rm_name: 'Vedant Kamble', shift_name: 'Shift5-PT-C-New', day_of_week: 'Wednesday', start_time: '2:00 PM', end_time: '2:45 PM', status_type: 'BATCH_LEVEL_BREAK', activity: 'SIN-MPI-506 (Level Break)' }},
  {{ id: 119, coach_id: 1, coach_name: 'Aafrin Deshmukh', rm_name: 'Vedant Kamble', shift_name: 'Shift5-PT-C-New', day_of_week: 'Thursday', start_time: '2:00 PM', end_time: '2:45 PM', status_type: 'BATCH_LEVEL_BREAK', activity: 'RC AUS-MPI-642-NDL (Level Break)' }},
  {{ id: 120, coach_id: 1, coach_name: 'Aafrin Deshmukh', rm_name: 'Vedant Kamble', shift_name: 'Shift5-PT-C-New', day_of_week: 'Friday', start_time: '2:00 PM', end_time: '2:45 PM', status_type: 'AVAILABLE', activity: 'X' }},

  // Coach 2: Aarti Thakur (Shift4-FT-C)
  {{ id: 201, coach_id: 2, coach_name: 'Aarti Thakur', rm_name: 'Navdeepkaur Bagal', shift_name: 'Shift4-FT-C', day_of_week: 'Monday', start_time: '10:00 AM', end_time: '10:45 AM', status_type: 'TEMPORARY_CLASS', activity: 'X Temporary Class' }},
  {{ id: 202, coach_id: 2, coach_name: 'Aarti Thakur', rm_name: 'Navdeepkaur Bagal', shift_name: 'Shift4-FT-C', day_of_week: 'Tuesday', start_time: '10:00 AM', end_time: '10:45 AM', status_type: 'TEMPORARY_CLASS', activity: 'X Temporary Class' }},
  {{ id: 203, coach_id: 2, coach_name: 'Aarti Thakur', rm_name: 'Navdeepkaur Bagal', shift_name: 'Shift4-FT-C', day_of_week: 'Wednesday', start_time: '10:00 AM', end_time: '10:45 AM', status_type: 'TEMPORARY_CLASS', activity: 'X Temporary Class' }},
  {{ id: 204, coach_id: 2, coach_name: 'Aarti Thakur', rm_name: 'Navdeepkaur Bagal', shift_name: 'Shift4-FT-C', day_of_week: 'Thursday', start_time: '10:00 AM', end_time: '10:45 AM', status_type: 'TEMPORARY_CLASS', activity: 'X Temporary Class' }},
  {{ id: 205, coach_id: 2, coach_name: 'Aarti Thakur', rm_name: 'Navdeepkaur Bagal', shift_name: 'Shift4-FT-C', day_of_week: 'Friday', start_time: '10:00 AM', end_time: '10:45 AM', status_type: 'TEMPORARY_CLASS', activity: 'X Temporary Class' }},

  {{ id: 206, coach_id: 2, coach_name: 'Aarti Thakur', rm_name: 'Navdeepkaur Bagal', shift_name: 'Shift4-FT-C', day_of_week: 'Monday', start_time: '12:00 PM', end_time: '12:45 PM', status_type: 'SCHEDULED_CLASS', activity: 'AUS-FPI-1303' }},
  {{ id: 207, coach_id: 2, coach_name: 'Aarti Thakur', rm_name: 'Navdeepkaur Bagal', shift_name: 'Shift4-FT-C', day_of_week: 'Tuesday', start_time: '12:00 PM', end_time: '12:45 PM', status_type: 'SCHEDULED_CLASS', activity: 'AUS-FPI-1227' }},
  {{ id: 208, coach_id: 2, coach_name: 'Aarti Thakur', rm_name: 'Navdeepkaur Bagal', shift_name: 'Shift4-FT-C', day_of_week: 'Wednesday', start_time: '12:00 PM', end_time: '12:45 PM', status_type: 'SCHEDULED_CLASS', activity: 'AUS-FPI-1570' }},
  {{ id: 209, coach_id: 2, coach_name: 'Aarti Thakur', rm_name: 'Navdeepkaur Bagal', shift_name: 'Shift4-FT-C', day_of_week: 'Thursday', start_time: '12:00 PM', end_time: '12:45 PM', status_type: 'SCHEDULED_CLASS', activity: 'AUS-FPI-1227' }},
  {{ id: 210, coach_id: 2, coach_name: 'Aarti Thakur', rm_name: 'Navdeepkaur Bagal', shift_name: 'Shift4-FT-C', day_of_week: 'Friday', start_time: '12:00 PM', end_time: '12:45 PM', status_type: 'SCHEDULED_CLASS', activity: 'AUS-FPI-1303' }},

  {{ id: 211, coach_id: 2, coach_name: 'Aarti Thakur', rm_name: 'Navdeepkaur Bagal', shift_name: 'Shift4-FT-C', day_of_week: 'Monday', start_time: '12:45 PM', end_time: '1:30 PM', status_type: 'REST_BREAK', activity: 'BREAK' }},
  {{ id: 212, coach_id: 2, coach_name: 'Aarti Thakur', rm_name: 'Navdeepkaur Bagal', shift_name: 'Shift4-FT-C', day_of_week: 'Tuesday', start_time: '12:45 PM', end_time: '1:30 PM', status_type: 'REST_BREAK', activity: 'BREAK' }},
  {{ id: 213, coach_id: 2, coach_name: 'Aarti Thakur', rm_name: 'Navdeepkaur Bagal', shift_name: 'Shift4-FT-C', day_of_week: 'Wednesday', start_time: '12:45 PM', end_time: '1:30 PM', status_type: 'REST_BREAK', activity: 'BREAK' }},
  {{ id: 214, coach_id: 2, coach_name: 'Aarti Thakur', rm_name: 'Navdeepkaur Bagal', shift_name: 'Shift4-FT-C', day_of_week: 'Thursday', start_time: '12:45 PM', end_time: '1:30 PM', status_type: 'REST_BREAK', activity: 'BREAK' }},
  {{ id: 215, coach_id: 2, coach_name: 'Aarti Thakur', rm_name: 'Navdeepkaur Bagal', shift_name: 'Shift4-FT-C', day_of_week: 'Friday', start_time: '12:45 PM', end_time: '1:30 PM', status_type: 'REST_BREAK', activity: 'BREAK' }},

  {{ id: 216, coach_id: 2, coach_name: 'Aarti Thakur', rm_name: 'Navdeepkaur Bagal', shift_name: 'Shift4-FT-C', day_of_week: 'Monday', start_time: '3:45 PM', end_time: '4:15 PM', status_type: 'DEMO_CLASS', activity: 'X Demo' }},
  {{ id: 217, coach_id: 2, coach_name: 'Aarti Thakur', rm_name: 'Navdeepkaur Bagal', shift_name: 'Shift4-FT-C', day_of_week: 'Tuesday', start_time: '3:45 PM', end_time: '4:15 PM', status_type: 'DEMO_CLASS', activity: 'X Demo' }},
  {{ id: 218, coach_id: 2, coach_name: 'Aarti Thakur', rm_name: 'Navdeepkaur Bagal', shift_name: 'Shift4-FT-C', day_of_week: 'Wednesday', start_time: '3:45 PM', end_time: '4:15 PM', status_type: 'DEMO_CLASS', activity: 'X Demo' }},
  {{ id: 219, coach_id: 2, coach_name: 'Aarti Thakur', rm_name: 'Navdeepkaur Bagal', shift_name: 'Shift4-FT-C', day_of_week: 'Thursday', start_time: '3:45 PM', end_time: '4:15 PM', status_type: 'DEMO_CLASS', activity: 'X Demo' }},
  {{ id: 220, coach_id: 2, coach_name: 'Aarti Thakur', rm_name: 'Navdeepkaur Bagal', shift_name: 'Shift4-FT-C', day_of_week: 'Friday', start_time: '3:45 PM', end_time: '4:15 PM', status_type: 'DEMO_CLASS', activity: 'X Demo' }},

  // Coach 5: Abhishek Patil (Shift6-PT)
  {{ id: 501, coach_id: 5, coach_name: 'Abhishek Patil', rm_name: 'Shailendra Waingankar', shift_name: 'Shift6-PT', day_of_week: 'Monday', start_time: '6:00 PM', end_time: '6:45 PM', status_type: 'SCHEDULED_CLASS', activity: 'USA-FPI-2480-NDL' }},
  {{ id: 502, coach_id: 5, coach_name: 'Abhishek Patil', rm_name: 'Shailendra Waingankar', shift_name: 'Shift6-PT', day_of_week: 'Tuesday', start_time: '6:00 PM', end_time: '6:45 PM', status_type: 'SCHEDULED_CLASS', activity: 'UAE-FPI-1080' }},
  {{ id: 503, coach_id: 5, coach_name: 'Abhishek Patil', rm_name: 'Shailendra Waingankar', shift_name: 'Shift6-PT', day_of_week: 'Wednesday', start_time: '6:00 PM', end_time: '6:45 PM', status_type: 'SCHEDULED_CLASS', activity: 'USA-FPI-2480-NDL' }},
  {{ id: 504, coach_id: 5, coach_name: 'Abhishek Patil', rm_name: 'Shailendra Waingankar', shift_name: 'Shift6-PT', day_of_week: 'Thursday', start_time: '6:00 PM', end_time: '6:45 PM', status_type: 'SCHEDULED_CLASS', activity: 'UAE-FPI-1080' }},
  {{ id: 505, coach_id: 5, coach_name: 'Abhishek Patil', rm_name: 'Shailendra Waingankar', shift_name: 'Shift6-PT', day_of_week: 'Friday', start_time: '6:00 PM', end_time: '6:45 PM', status_type: 'SCHEDULED_CLASS', activity: 'USA-FPI-2480-NDL' }},
  
  {{ id: 506, coach_id: 5, coach_name: 'Abhishek Patil', rm_name: 'Shailendra Waingankar', shift_name: 'Shift6-PT', day_of_week: 'Monday', start_time: '8:15 PM', end_time: '8:30 PM', status_type: 'REST_BREAK', activity: 'BREAK' }},
  {{ id: 507, coach_id: 5, coach_name: 'Abhishek Patil', rm_name: 'Shailendra Waingankar', shift_name: 'Shift6-PT', day_of_week: 'Monday', start_time: '8:30 PM', end_time: '8:45 PM', status_type: 'REPORT_BUILDING', activity: 'Report-building time' }},

  // Weekend Slots for Aarti Thakur
  {{ id: 221, coach_id: 2, coach_name: 'Aarti Thakur', rm_name: 'Navdeepkaur Bagal', shift_name: 'Shift4-FT-C', day_of_week: 'Saturday', start_time: '10:15 AM', end_time: '11:00 AM', status_type: 'SCHEDULED_CLASS', activity: 'UAE-FPI-1108' }},
  {{ id: 222, coach_id: 2, coach_name: 'Aarti Thakur', rm_name: 'Navdeepkaur Bagal', shift_name: 'Shift4-FT-C', day_of_week: 'Sunday', start_time: '10:15 AM', end_time: '11:00 AM', status_type: 'OFF_DUTY', activity: 'OFF' }},
  {{ id: 223, coach_id: 2, coach_name: 'Aarti Thakur', rm_name: 'Navdeepkaur Bagal', shift_name: 'Shift4-FT-C', day_of_week: 'Saturday', start_time: '11:00 AM', end_time: '11:45 AM', status_type: 'SCHEDULED_CLASS', activity: 'SIN-FPI-847' }},
  {{ id: 224, coach_id: 2, coach_name: 'Aarti Thakur', rm_name: 'Navdeepkaur Bagal', shift_name: 'Shift4-FT-C', day_of_week: 'Sunday', start_time: '11:00 AM', end_time: '11:45 AM', status_type: 'OFF_DUTY', activity: 'OFF' }},
  {{ id: 225, coach_id: 2, coach_name: 'Aarti Thakur', rm_name: 'Navdeepkaur Bagal', shift_name: 'Shift4-FT-C', day_of_week: 'Saturday', start_time: '1:15 PM', end_time: '2:00 PM', status_type: 'REST_BREAK', activity: 'BREAK' }},
  {{ id: 226, coach_id: 2, coach_name: 'Aarti Thakur', rm_name: 'Navdeepkaur Bagal', shift_name: 'Shift4-FT-C', day_of_week: 'Sunday', start_time: '1:15 PM', end_time: '2:00 PM', status_type: 'OFF_DUTY', activity: 'OFF' }}
];

export const INITIAL_CONFLICTS: ConflictReport[] = [
  {{
    id: 'conf-1',
    type: 'OVERLAP',
    coach_name: 'Aafrin Deshmukh',
    day: 'Wednesday',
    description: 'Overlapping class assignment detected at 12:30 PM - 1:15 PM.',
    slot1: '12:30 PM - 1:15 PM (SIN-FPI-774)',
    slot2: '12:30 PM - 1:15 PM (AUS-MPI-728)'
  }},
  {{
    id: 'conf-2',
    type: 'REST_BREAK_VIOLATION',
    coach_name: 'Abhilasha Jha',
    day: 'Thursday',
    description: 'Attempted to schedule class during mandatory Tea Break (5:00 PM - 5:15 PM).',
    slot1: '5:00 PM - 5:15 PM (BREAK)'
  }}
];
"""

with open('src/mockData.ts', 'w') as out:
    out.write(ts_content)

print("Updated src/mockData.ts successfully!")
