import csv
import json

csv_path = r'c:\Users\monsx\OneDrive\Documents\Upstep Sheet Webapp\OperationsProject\Doc\Coach Shift\Coaches Schedule - Sample Sheet.csv'

with open(csv_path, 'r', encoding='utf-8-sig') as f:
    rows = list(csv.reader(f))

header_rows = []
for i, row in enumerate(rows):
    if len(row) > 4 and row[1].strip() == 'Shift Name' and row[4].strip() == 'Start T':
        header_rows.append(i)

print(f"Found {len(header_rows)} template blocks in sample sheet.")

meta = {
    "Shift1-FT": {"type": "Full Time", "working_days": "Mon-Sat (Night)", "regions": ["UK", "USA", "EUR"], "dl": True},
    "Shift2-FT": {"type": "Full Time", "working_days": "Tue-Sun (Night)", "regions": ["UK", "USA", "EUR"], "dl": True},
    "Shift3-PT": {"type": "Part Time", "working_days": "Mon-Sat (Morning)", "regions": ["USA"], "dl": True},
    "Shift4-FT": {"type": "Full Time", "working_days": "Mon-Sat (Morning AUS)", "regions": ["AUS", "IND", "UAE", "WW"], "dl": True},
    "Shift5-FT": {"type": "Full Time", "working_days": "Mon-Sat (Afternoon IST)", "regions": ["SIN", "IND", "UAE", "WW"], "dl": False},
    "Shift6-PT": {"type": "Part Time", "working_days": "Mon-Sat (Evening IST)", "regions": ["SIN", "IND", "UAE", "WW"], "dl": False},
    "Shift7-PT": {"type": "Part Time", "working_days": "Mon-Sat (Night)", "regions": ["UK", "USA", "EUR"], "dl": True},
    "Shift8-PT": {"type": "Part Time", "working_days": "Mon-Sat (Early Morning)", "regions": ["USA"], "dl": True},
    "Shift9-PT": {"type": "Part Time", "working_days": "Mon-Sat (Afternoon IST)", "regions": ["SIN", "IND", "UAE", "WW"], "dl": False},
    "Shift10-PT": {"type": "Part Time", "working_days": "Mon-Sat (Afternoon IST)", "regions": ["SIN", "IND", "UAE", "WW"], "dl": False},
    "Shift5A-FT": {"type": "Full Time", "working_days": "Mon-Sat (Afternoon IST)", "regions": ["SIN", "IND", "UAE", "WW"], "dl": False},
    "Shift11-FT": {"type": "Full Time", "working_days": "Mon-Sat (Custom)", "regions": ["SIN", "IND", "UAE", "WW", "UK", "USA"], "dl": False}
}

def get_status(act_text):
    t = (act_text or '').upper().strip()
    if t == 'OFF': return 'OFF_DUTY'
    if 'BREAK' in t: return 'REST_BREAK'
    if 'REPORT' in t: return 'REPORT_BUILDING'
    if 'DEMO' in t: return 'DEMO_CLASS'
    return 'AVAILABLE'

templates = []

for idx, h_idx in enumerate(header_rows):
    next_h_idx = header_rows[idx+1] if idx+1 < len(header_rows) else len(rows)
    block_rows = rows[h_idx+1:next_h_idx]
    
    shift_name = ''
    for r in block_rows:
        if len(r) > 1 and r[1].strip():
            shift_name = r[1].strip()
            break
            
    if not shift_name:
        continue

    is_dl = (idx < 12)
    template_id = f"shift-{shift_name.lower()}-{'dl' if is_dl else 'std'}"
    display_name = f"{shift_name} ({'Daylight Time' if is_dl else 'Standard Time'})" if is_dl or (shift_name in ['Shift1-FT', 'Shift2-FT', 'Shift3-PT', 'Shift4-FT', 'Shift7-PT', 'Shift8-PT']) else shift_name
    
    slots = []
    for slot_idx, r in enumerate(block_rows):
        if len(r) < 8 or not r[4].strip():
            continue
            
        start_t = r[4].strip()
        end_t = r[5].strip()
        
        mon = r[6].strip() if len(r) > 6 else 'X'
        tue = r[7].strip() if len(r) > 7 else 'X'
        wed = r[8].strip() if len(r) > 8 else 'X'
        thu = r[9].strip() if len(r) > 9 else 'X'
        fri = r[10].strip() if len(r) > 10 else 'X'
        
        sat = r[19].strip() if len(r) > 19 and r[19].strip() else 'X'
        sun = r[20].strip() if len(r) > 20 and r[20].strip() else 'X'
        
        # Fallbacks for weekend columns if offset
        if sat == 'X' and len(r) > 14 and r[14].strip() in ['OFF', 'X', 'BREAK', 'Report-building time']:
            sat = r[14].strip()
        if sun == 'X' and len(r) > 15 and r[15].strip() in ['OFF', 'X', 'BREAK', 'Report-building time']:
            sun = r[15].strip()

        w_act = tue if tue and tue != 'OFF' else (mon if mon and mon != 'OFF' else 'X')

        slots.append({
            "id": str(slot_idx + 1),
            "start_time": start_t,
            "end_time": end_t,
            "monday_status": get_status(mon),
            "monday_activity": mon or 'X',
            "tuesday_status": get_status(tue),
            "tuesday_activity": tue or 'X',
            "wednesday_status": get_status(wed),
            "wednesday_activity": wed or 'X',
            "thursday_status": get_status(thu),
            "thursday_activity": thu or 'X',
            "friday_status": get_status(fri),
            "friday_activity": fri or 'X',
            "saturday_status": get_status(sat),
            "saturday_activity": sat or 'X',
            "sunday_status": get_status(sun),
            "sunday_activity": sun or 'X',
            "default_weekday_status": get_status(w_act),
            "default_weekday_activity": w_act,
            "default_weekend_status": get_status(sat),
            "default_weekend_activity": sat or 'X'
        })
        
    if not slots:
        continue
        
    m = meta.get(shift_name, {"type": "Full Time", "working_days": "Mon-Sat", "regions": ["IND", "WW"], "dl": False})
    
    templates.append({
        "id": template_id,
        "name": display_name,
        "shift_type": m["type"],
        "working_days": m["working_days"],
        "regions": m["regions"],
        "requires_daylight": is_dl and m["dl"],
        "slots": slots
    })

print(f"Generated {len(templates)} templates with full Monday-Sunday day data.")
with open('templates_output.json', 'w') as out:
    json.dump(templates, out, indent=2)
