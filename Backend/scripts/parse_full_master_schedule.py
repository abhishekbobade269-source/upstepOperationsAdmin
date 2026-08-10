import csv
import json
import os

weekdays_path = r'c:\Users\monsx\OneDrive\Documents\Upstep Sheet Webapp\OperationsProject\Doc\Coaches Schedule - Weekdays.csv'
weekend_path = r'c:\Users\monsx\OneDrive\Documents\Upstep Sheet Webapp\OperationsProject\Doc\Coaches Schedule - Weekend.csv'

# Relative path fallback if needed
if not os.path.exists(weekdays_path):
    weekdays_path = os.path.join('..', '..', 'Doc', 'Coaches Schedule - Weekdays.csv')
if not os.path.exists(weekend_path):
    weekend_path = os.path.join('..', '..', 'Doc', 'Coaches Schedule - Weekend.csv')

with open('templates_output.json', 'r') as f:
    shift_templates = json.load(f)

# 1. Parse Weekdays
with open(weekdays_path, 'r', encoding='utf-8-sig') as f:
    w_rows = list(csv.reader(f))

# 2. Parse Weekend
with open(weekend_path, 'r', encoding='utf-8-sig') as f:
    wk_rows = list(csv.reader(f))

coaches_dict = {}
name_key_map = {} # norm_name -> canonical_name

def get_tier(rating):
    try:
        r = int(rating)
        if r >= 2200: return 'Tier 5'
        if r >= 2000: return 'Tier 4'
        if r >= 1800: return 'Tier 3'
        if r >= 1600: return 'Tier 2'
        if r >= 1400: return 'Tier 1'
    except:
        pass
    return 'Tier 2'

slots_list = []
slot_id_counter = 1

def add_minutes_to_time(time_str, mins_to_add):
    try:
        t = time_str.strip()
        parts = t.split()
        time_part = parts[0]
        ampm = parts[1].upper() if len(parts) > 1 else 'PM'
        h, m = map(int, time_part.split(':'))
        if h == 12: h = 0
        if ampm == 'PM': h += 12
        total_m = (h * 60 + m + mins_to_add) % (24 * 60)
        new_h = total_m // 60
        new_m = total_m % 60
        new_ampm = 'PM' if new_h >= 12 else 'AM'
        final_h = new_h % 12
        if final_h == 0: final_h = 12
        return f"{final_h}:{new_m:02d} {new_ampm}"
    except:
        return time_str

def map_status_type(act_text):
    t = (act_text or '').strip()
    u = t.upper()
    if not t or t == 'X':
        return 'AVAILABLE', 'X'
    if u == 'OFF':
        return 'OFF_DUTY', 'OFF'
    if 'BREAK' in u:
        return 'REST_BREAK', t
    if 'REPORT' in u:
        return 'REPORT_BUILDING', 'Report-building time'
    if 'LEVEL BREAK' in u:
        return 'BATCH_LEVEL_BREAK', t
    if 'INACTIVE' in u:
        return 'INACTIVE', t
    if 'DEMO' in u:
        return 'DEMO_CLASS', t
    if 'TEMPORARY' in u or 'TEMP' in u:
        return 'TEMPORARY_CLASS', t
    if 'SUBSTITUTE' in u or 'SUB' in u:
        return 'SUBSTITUTE_CLASS', t
    return 'SCHEDULED_CLASS', t

def get_or_create_coach(r):
    raw_name = r[4].strip()
    norm_key = raw_name.lower()
    
    if norm_key in name_key_map:
        canonical_name = name_key_map[norm_key]
        return coaches_dict[canonical_name]

    # Create new coach entry
    rm_name = r[2].strip() if len(r) > 2 and r[2].strip() else 'Vedant Kamble'
    shift_name = r[3].strip() if len(r) > 3 and r[3].strip() else 'Shift5-FT'
    sf_name = r[5].strip() if len(r) > 5 and r[5].strip() else raw_name
    rating_str = r[14].strip() if len(r) > 14 else '1750'
    can_teach = r[15].strip() if len(r) > 15 and r[15].strip() else 'Junior'

    try:
        rating = int(float(rating_str)) if rating_str else 1750
    except:
        rating = 1750

    tier = get_tier(rating)
    c_id = len(coaches_dict) + 1

    shift_days_raw = r[13].strip() if len(r) > 13 and r[13].strip() else '1'
    shift_days = 2 if shift_days_raw == '2' else 1
    shift_type = 'Night Shift' if shift_days == 2 else 'Day Shift'

    coach_entry = {
        'id': c_id,
        'name': raw_name,
        'display_name': raw_name,
        'sf_coach_name': sf_name,
        'category': 'CT3',
        'emp_type': 'Full Time' if 'FT' in shift_name else 'Part Time',
        'shift_days': shift_days,
        'shift_type': shift_type,
        'standard_rating': rating,
        'tier': tier,
        'can_teach_upto': can_teach,
        'demo_preference': 'Preference 1',
        'demo_preference_color': '#00ff00',
        'languages': 'English, Hindi',
        'employee_id': f'EMP-{1000 + c_id}',
        'trainer_manager': rm_name,
        'class_hours_per_day': 6.0 if 'FT' in shift_name else 4.5,
        'max_daily_classes': 8 if 'FT' in shift_name else 6,
        'max_daily_demos': 16 if 'FT' in shift_name else 10,
        'employment_model': 'Salaried',
        'is_active': True,
        'profile_pic': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
    }

    coaches_dict[raw_name] = coach_entry
    name_key_map[norm_key] = raw_name
    return coach_entry

# Parse Weekday Rows
for r in w_rows[1:]:
    if len(r) < 8 or not r[4].strip() or not r[6].strip():
        continue
    
    c_info = get_or_create_coach(r)
    rm_name = r[2].strip() if len(r) > 2 and r[2].strip() else c_info['trainer_manager']
    shift_name = r[3].strip() if len(r) > 3 and r[3].strip() else 'Shift5-FT'
    start_t = r[6].strip()
    end_t = r[7].strip()

    days_cols = [('Monday', 8), ('Tuesday', 9), ('Wednesday', 10), ('Thursday', 11), ('Friday', 12)]
    for day_name, col_idx in days_cols:
        val = r[col_idx].strip() if len(r) > col_idx else 'X'
        st_type, act = map_status_type(val)
        slot_end_t = add_minutes_to_time(start_t, 30) if st_type == 'DEMO_CLASS' or 'DEMO' in val.upper() else end_t
        
        slots_list.append({
            'id': slot_id_counter,
            'coach_id': c_info['id'],
            'coach_name': c_info['name'],
            'rm_name': rm_name,
            'shift_name': shift_name,
            'day_of_week': day_name,
            'start_time': start_t,
            'end_time': slot_end_t,
            'status_type': st_type,
            'activity': act
        })
        slot_id_counter += 1

# Parse Weekend Rows
for r in wk_rows[1:]:
    if len(r) < 8 or not r[4].strip() or not r[6].strip():
        continue
        
    c_info = get_or_create_coach(r)
    rm_name = r[2].strip() if len(r) > 2 and r[2].strip() else c_info['trainer_manager']
    shift_name = r[3].strip() if len(r) > 3 and r[3].strip() else 'Shift5-FT'
    start_t = r[6].strip()
    end_t = r[7].strip()

    wk_cols = [('Saturday', 8), ('Sunday', 9)]
    for day_name, col_idx in wk_cols:
        val = r[col_idx].strip() if len(r) > col_idx else 'X'
        st_type, act = map_status_type(val)
        slot_end_t = add_minutes_to_time(start_t, 30) if st_type == 'DEMO_CLASS' or 'DEMO' in val.upper() else end_t
        
        slots_list.append({
            'id': slot_id_counter,
            'coach_id': c_info['id'],
            'coach_name': c_info['name'],
            'rm_name': rm_name,
            'shift_name': shift_name,
            'day_of_week': day_name,
            'start_time': start_t,
            'end_time': slot_end_t,
            'status_type': st_type,
            'activity': act
        })
        slot_id_counter += 1

coaches_list = list(coaches_dict.values())
print(f"Total Coaches Parsed: {len(coaches_list)}")
print(f"Total Slots Parsed: {len(slots_list)}")

target_mock_file = os.path.join('..', 'src', 'mockData.ts')

ts_content = f"""import type {{ Coach, Slot, ShiftTemplate, ConflictReport }} from './types';

export const INITIAL_COACHES: Coach[] = {json.dumps(coaches_list)};

export const INITIAL_SHIFTS: ShiftTemplate[] = {json.dumps(shift_templates, indent=2)};

const rawSlots: any[] = {json.dumps(slots_list)};
export const INITIAL_SLOTS: Slot[] = rawSlots as Slot[];

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

with open(target_mock_file, 'w', encoding='utf-8') as out:
    out.write(ts_content)

print(f"Successfully written {target_mock_file} with {len(slots_list)} slots!")
