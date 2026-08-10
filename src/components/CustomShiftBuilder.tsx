import React, { useState, useEffect } from 'react';
import type { ShiftTemplate, ShiftSlotDefinition, SlotStatusType } from '../types';
import { Plus, Trash2, Settings, Check, Copy, Eye, Sparkles, Clock, Globe, Calendar } from 'lucide-react';
import './AdminPortal.css';

interface CustomShiftBuilderProps {
  shifts: ShiftTemplate[];
  onCreateShift: (newShift: ShiftTemplate) => void;
  onDeleteShift: (shiftId: string) => void;
}

const REGION_OPTIONS = ['UK', 'USA', 'AUS', 'IND', 'SIN', 'UAE', 'EUR', 'WW'];

const STATUS_OPTIONS: { label: string; value: SlotStatusType; activity: string }[] = [
  { label: 'Free Slot (X)', value: 'AVAILABLE', activity: 'X' },
  { label: 'Rest Break (BREAK)', value: 'REST_BREAK', activity: 'BREAK' },
  { label: 'Report-building time', value: 'REPORT_BUILDING', activity: 'Report-building time' },
  { label: 'Weekly OFF', value: 'OFF_DUTY', activity: 'OFF' },
  { label: 'Demo Slot (X Demo)', value: 'DEMO_CLASS', activity: 'X Demo' }
];

export const CustomShiftBuilder: React.FC<CustomShiftBuilderProps> = ({
  shifts,
  onCreateShift,
  onDeleteShift
}) => {
  const [activeMode, setActiveMode] = useState<'create' | 'inspect'>('inspect');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    const saved = localStorage.getItem('upstep_shift_builder_template_id');
    return saved && shifts.some(s => s.id === saved) ? saved : (shifts[0]?.id || '');
  });

  useEffect(() => {
    if (selectedTemplateId) {
      localStorage.setItem('upstep_shift_builder_template_id', selectedTemplateId);
    }
  }, [selectedTemplateId]);
  
  // Tab states for day views
  const [inspectTab, setInspectTab] = useState<'weekdays' | 'weekend' | 'all'>('weekdays');
  const [builderTab, setBuilderTab] = useState<'weekdays' | 'weekend' | 'all'>('weekdays');

  // Form state for creating/cloning custom shift
  const [shiftName, setShiftName] = useState('');
  const [shiftType, setShiftType] = useState<'Full Time' | 'Part Time'>('Full Time');
  const [workingDays, setWorkingDays] = useState('Mon-Sat');
  const [selectedRegions, setSelectedRegions] = useState<string[]>(['SIN', 'IND', 'UAE', 'WW']);
  const [requiresDaylight, setRequiresDaylight] = useState(false);

  // Time slots for new shift creation
  const [slotsList, setSlotsList] = useState<ShiftSlotDefinition[]>([
    { 
      id: '1', start_time: '12:30 AM', end_time: '1:15 AM', 
      monday_status: 'OFF_DUTY', monday_activity: 'OFF',
      tuesday_status: 'AVAILABLE', tuesday_activity: 'X',
      wednesday_status: 'AVAILABLE', wednesday_activity: 'X',
      thursday_status: 'AVAILABLE', thursday_activity: 'X',
      friday_status: 'AVAILABLE', friday_activity: 'X',
      saturday_status: 'AVAILABLE', saturday_activity: 'X',
      sunday_status: 'OFF_DUTY', sunday_activity: 'OFF',
      default_weekday_status: 'AVAILABLE', default_weekday_activity: 'X', 
      default_weekend_status: 'AVAILABLE', default_weekend_activity: 'X' 
    },
    { 
      id: '2', start_time: '1:15 AM', end_time: '1:45 AM', 
      monday_status: 'OFF_DUTY', monday_activity: 'OFF',
      tuesday_status: 'REST_BREAK', tuesday_activity: 'BREAK',
      wednesday_status: 'REST_BREAK', wednesday_activity: 'BREAK',
      thursday_status: 'REST_BREAK', thursday_activity: 'BREAK',
      friday_status: 'REST_BREAK', friday_activity: 'BREAK',
      saturday_status: 'REST_BREAK', saturday_activity: 'BREAK',
      sunday_status: 'OFF_DUTY', sunday_activity: 'OFF',
      default_weekday_status: 'REST_BREAK', default_weekday_activity: 'BREAK', 
      default_weekend_status: 'REST_BREAK', default_weekend_activity: 'BREAK' 
    }
  ]);

  // Selected template for inspection
  const selectedTemplate = shifts.find(s => s.id === selectedTemplateId) || shifts[0];

  const toggleRegion = (region: string) => {
    if (selectedRegions.includes(region)) {
      setSelectedRegions(selectedRegions.filter(r => r !== region));
    } else {
      setSelectedRegions([...selectedRegions, region]);
    }
  };

  const handleAddSlot = () => {
    const newId = (slotsList.length + 1).toString();
    setSlotsList([
      ...slotsList,
      {
        id: newId,
        start_time: '5:00 PM',
        end_time: '5:45 PM',
        monday_status: 'AVAILABLE', monday_activity: 'X',
        tuesday_status: 'AVAILABLE', tuesday_activity: 'X',
        wednesday_status: 'AVAILABLE', wednesday_activity: 'X',
        thursday_status: 'AVAILABLE', thursday_activity: 'X',
        friday_status: 'AVAILABLE', friday_activity: 'X',
        saturday_status: 'AVAILABLE', saturday_activity: 'X',
        sunday_status: 'OFF_DUTY', sunday_activity: 'OFF',
        default_weekday_status: 'AVAILABLE', default_weekday_activity: 'X',
        default_weekend_status: 'AVAILABLE', default_weekend_activity: 'X'
      }
    ]);
  };

  const handleRemoveSlot = (id: string) => {
    if (slotsList.length > 1) {
      setSlotsList(slotsList.filter(s => s.id !== id));
    }
  };

  // Helper for updating day-specific status in slot editor
  const handleDayStatusChange = (
    slotId: string, 
    dayPrefix: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday', 
    statusVal: SlotStatusType
  ) => {
    const opt = STATUS_OPTIONS.find(o => o.value === statusVal) || STATUS_OPTIONS[0];
    
    setSlotsList(slotsList.map(s => {
      if (s.id === slotId) {
        return {
          ...s,
          [`${dayPrefix}_status`]: opt.value,
          [`${dayPrefix}_activity`]: opt.activity
        };
      }
      return s;
    }));
  };

  const handleCloneTemplate = (tmpl: ShiftTemplate) => {
    setShiftName(`${tmpl.name} (Custom Copy)`);
    setShiftType(tmpl.shift_type);
    setWorkingDays(tmpl.working_days);
    setSelectedRegions([...tmpl.regions]);
    setRequiresDaylight(tmpl.requires_daylight);
    
    // Deep clone slots with full day definitions
    setSlotsList(tmpl.slots.map(s => ({
      ...s,
      monday_status: s.monday_status || s.default_weekday_status,
      monday_activity: s.monday_activity || s.default_weekday_activity,
      tuesday_status: s.tuesday_status || s.default_weekday_status,
      tuesday_activity: s.tuesday_activity || s.default_weekday_activity,
      wednesday_status: s.wednesday_status || s.default_weekday_status,
      wednesday_activity: s.wednesday_activity || s.default_weekday_activity,
      thursday_status: s.thursday_status || s.default_weekday_status,
      thursday_activity: s.thursday_activity || s.default_weekday_activity,
      friday_status: s.friday_status || s.default_weekday_status,
      friday_activity: s.friday_activity || s.default_weekday_activity,
      saturday_status: s.saturday_status || s.default_weekend_status,
      saturday_activity: s.saturday_activity || s.default_weekend_activity,
      sunday_status: s.sunday_status || s.default_weekend_status,
      sunday_activity: s.sunday_activity || s.default_weekend_activity
    })));

    setActiveMode('create');
  };

  const handleCreateShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftName.trim()) return;

    const newTemplate: ShiftTemplate = {
      id: `shift-custom-${Date.now()}`,
      name: shiftName.trim(),
      shift_type: shiftType,
      working_days: workingDays,
      regions: selectedRegions,
      requires_daylight: requiresDaylight,
      slots: slotsList
    };

    onCreateShift(newTemplate);
    setShiftName('');
    setActiveMode('inspect');
    setSelectedTemplateId(newTemplate.id);
    alert(`Custom shift template "${newTemplate.name}" published successfully!`);
  };

  return (
    <div className="custom-shift-container">
      {/* Top Header Card */}
      <div className="section-header-card shadow-lg">
        <div className="header-icon-box">
          <Settings className="icon-gold" />
        </div>
        <div className="header-text-box">
          <h2>Shift Templates & Custom Shift Builder</h2>
          <p>Inspect predefined operational templates with day-by-day (Monday to Sunday) schedules or create custom shift templates.</p>
        </div>

        {/* Mode Switcher Buttons */}
        <div className="mode-toggle-group">
          <button 
            type="button"
            className={`mode-btn ${activeMode === 'inspect' ? 'active' : ''}`}
            onClick={() => setActiveMode('inspect')}
          >
            <Eye className="icon-sm" /> Select & Inspect Template ({shifts.length})
          </button>
          <button 
            type="button"
            className={`mode-btn ${activeMode === 'create' ? 'active' : ''}`}
            onClick={() => setActiveMode('create')}
          >
            <Plus className="icon-sm" /> Create Custom Shift
          </button>
        </div>
      </div>

      {/* MODE 1: INSPECT EXISTING TEMPLATE */}
      {activeMode === 'inspect' && (
        <div className="inspect-template-wrapper">
          <div className="template-selector-bar card-glass">
            <div className="select-row">
              <label className="form-label font-bold">Select Shift Template to Preview:</label>
              <select 
                value={selectedTemplateId}
                onChange={e => setSelectedTemplateId(e.target.value)}
                className="select-input select-lg shadow-sm"
              >
                {shifts.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.shift_type} | {s.working_days}) - {s.slots.length} time blocks
                  </option>
                ))}
              </select>
            </div>

            {selectedTemplate && (
              <button 
                type="button"
                className="btn-primary btn-clone-action"
                onClick={() => handleCloneTemplate(selectedTemplate)}
              >
                <Copy className="icon-sm" /> Clone into New Custom Template
              </button>
            )}
          </div>

          {selectedTemplate && (
            <div className="template-preview-card card-glass shadow-md">
              <div className="template-card-header">
                <div>
                  <h3 className="template-name-title">{selectedTemplate.name}</h3>
                  <div className="meta-badges-row">
                    <span className="badge-pill blue"><Clock className="icon-xs" /> {selectedTemplate.shift_type}</span>
                    <span className="badge-pill gold"><Calendar className="icon-xs" /> {selectedTemplate.working_days}</span>
                    <span className="badge-pill green"><Globe className="icon-xs" /> Regions: {selectedTemplate.regions.join(', ')}</span>
                    {selectedTemplate.requires_daylight && (
                      <span className="badge-pill orange">☀️ Daylight Saving Adjusted (±1 Hr)</span>
                    )}
                  </div>
                </div>

                {selectedTemplate.id.startsWith('shift-custom-') && (
                  <button 
                    type="button"
                    className="btn-danger-outline"
                    onClick={() => onDeleteShift(selectedTemplate.id)}
                  >
                    <Trash2 className="icon-sm" /> Delete Custom Template
                  </button>
                )}
              </div>

              {/* Day View Mode Selector Tabs */}
              <div className="view-mode-tabs mt-4">
                <button
                  type="button"
                  className={`tab-btn ${inspectTab === 'weekdays' ? 'active' : ''}`}
                  onClick={() => setInspectTab('weekdays')}
                >
                  📅 Weekdays View (Mon - Fri)
                </button>
                <button
                  type="button"
                  className={`tab-btn ${inspectTab === 'weekend' ? 'active' : ''}`}
                  onClick={() => setInspectTab('weekend')}
                >
                  🏖️ Weekend View (Sat - Sun)
                </button>
                <button
                  type="button"
                  className={`tab-btn ${inspectTab === 'all' ? 'active' : ''}`}
                  onClick={() => setInspectTab('all')}
                >
                  🗓️ All 7 Days (Mon - Sun)
                </button>
              </div>

              {/* Day-by-Day Slots Grid Table */}
              <div className="table-responsive mt-4">
                <table className="custom-table template-slots-table">
                  <thead>
                    <tr>
                      <th className="col-center" style={{ width: '60px' }}>SLOT #</th>
                      <th className="col-center" style={{ width: '110px' }}>START TIME</th>
                      <th className="col-center" style={{ width: '110px' }}>END TIME</th>
                      {(inspectTab === 'weekdays' || inspectTab === 'all') && (
                        <>
                          <th className="col-center">MONDAY</th>
                          <th className="col-center">TUESDAY</th>
                          <th className="col-center">WEDNESDAY</th>
                          <th className="col-center">THURSDAY</th>
                          <th className="col-center">FRIDAY</th>
                        </>
                      )}
                      {(inspectTab === 'weekend' || inspectTab === 'all') && (
                        <>
                          <th className="col-center">SATURDAY</th>
                          <th className="col-center">SUNDAY</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTemplate.slots.map((slot, idx) => (
                      <tr key={slot.id || idx}>
                        <td className="col-center font-mono font-bold">{idx + 1}</td>
                        <td className="col-center font-mono font-bold">{slot.start_time}</td>
                        <td className="col-center font-mono font-bold">{slot.end_time}</td>
                        
                        {(inspectTab === 'weekdays' || inspectTab === 'all') && (
                          <>
                            <td className="col-center">
                              <span className={`status-pill-badge ${(slot.monday_status || slot.default_weekday_status).toLowerCase()}`}>
                                {slot.monday_activity || slot.default_weekday_activity}
                              </span>
                            </td>
                            <td className="col-center">
                              <span className={`status-pill-badge ${(slot.tuesday_status || slot.default_weekday_status).toLowerCase()}`}>
                                {slot.tuesday_activity || slot.default_weekday_activity}
                              </span>
                            </td>
                            <td className="col-center">
                              <span className={`status-pill-badge ${(slot.wednesday_status || slot.default_weekday_status).toLowerCase()}`}>
                                {slot.wednesday_activity || slot.default_weekday_activity}
                              </span>
                            </td>
                            <td className="col-center">
                              <span className={`status-pill-badge ${(slot.thursday_status || slot.default_weekday_status).toLowerCase()}`}>
                                {slot.thursday_activity || slot.default_weekday_activity}
                              </span>
                            </td>
                            <td className="col-center">
                              <span className={`status-pill-badge ${(slot.friday_status || slot.default_weekday_status).toLowerCase()}`}>
                                {slot.friday_activity || slot.default_weekday_activity}
                              </span>
                            </td>
                          </>
                        )}

                        {(inspectTab === 'weekend' || inspectTab === 'all') && (
                          <>
                            <td className="col-center">
                              <span className={`status-pill-badge ${(slot.saturday_status || slot.default_weekend_status).toLowerCase()}`}>
                                {slot.saturday_activity || slot.default_weekend_activity}
                              </span>
                            </td>
                            <td className="col-center">
                              <span className={`status-pill-badge ${(slot.sunday_status || slot.default_weekend_status).toLowerCase()}`}>
                                {slot.sunday_activity || slot.default_weekend_activity}
                              </span>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: CREATE / CLONE BRAND NEW CUSTOM SHIFT TEMPLATE */}
      {activeMode === 'create' && (
        <form onSubmit={handleCreateShiftSubmit} className="shift-form-card card-glass shadow-lg">
          <div className="card-header-bar">
            <h3 className="card-title"><Sparkles className="icon-gold icon-sm" /> Custom Shift Template Builder</h3>
            <button type="button" onClick={() => setActiveMode('inspect')} className="btn-secondary-sm">
              Back to Inspection
            </button>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Shift Identifier / Name:</label>
              <input 
                type="text" 
                placeholder="e.g. Shift12-Custom or Night-Shift-US" 
                value={shiftName}
                onChange={e => setShiftName(e.target.value)}
                className="text-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Shift Type:</label>
              <select 
                value={shiftType} 
                onChange={e => setShiftType(e.target.value as any)}
                className="select-input"
              >
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Working Days:</label>
              <input 
                type="text" 
                value={workingDays} 
                onChange={e => setWorkingDays(e.target.value)}
                className="text-input"
                placeholder="e.g. Mon-Sat or Tue-Sun"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Covered Regions:</label>
            <div className="checkbox-wrap-grid">
              {REGION_OPTIONS.map(reg => (
                <label key={reg} className={`chip-checkbox ${selectedRegions.includes(reg) ? 'selected' : ''}`}>
                  <input 
                    type="checkbox" 
                    checked={selectedRegions.includes(reg)}
                    onChange={() => toggleRegion(reg)}
                  />
                  <span>{reg}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={requiresDaylight} 
                onChange={e => setRequiresDaylight(e.target.checked)}
              />
              <span>Requires Daylight Saving Adjustment (±1 Hour for UK/USA/AUS)</span>
            </label>
          </div>

          {/* TIME SLOTS DEFINITION WITH DAY TABS */}
          <div className="slots-definition-section mt-4">
            <div className="slots-header">
              <h3 className="card-title">Define Shift Time Slots ({slotsList.length})</h3>
              <button type="button" onClick={handleAddSlot} className="btn-secondary-sm">
                <Plus className="icon-sm" /> Add Time Slot
              </button>
            </div>

            {/* Builder Day Tabs */}
            <div className="view-mode-tabs mt-3">
              <button
                type="button"
                className={`tab-btn ${builderTab === 'weekdays' ? 'active' : ''}`}
                onClick={() => setBuilderTab('weekdays')}
              >
                📅 Weekdays Editor (Mon - Fri)
              </button>
              <button
                type="button"
                className={`tab-btn ${builderTab === 'weekend' ? 'active' : ''}`}
                onClick={() => setBuilderTab('weekend')}
              >
                🏖️ Weekend Editor (Sat - Sun)
              </button>
              <button
                type="button"
                className={`tab-btn ${builderTab === 'all' ? 'active' : ''}`}
                onClick={() => setBuilderTab('all')}
              >
                🗓️ All 7 Days Editor (Mon - Sun)
              </button>
            </div>

            <div className="table-responsive mt-3">
              <table className="custom-table slots-builder-table">
                <thead>
                  <tr>
                    <th className="col-center" style={{ width: '120px' }}>START TIME</th>
                    <th className="col-center" style={{ width: '120px' }}>END TIME</th>

                    {(builderTab === 'weekdays' || builderTab === 'all') && (
                      <>
                        <th className="col-center">MONDAY</th>
                        <th className="col-center">TUESDAY</th>
                        <th className="col-center">WEDNESDAY</th>
                        <th className="col-center">THURSDAY</th>
                        <th className="col-center">FRIDAY</th>
                      </>
                    )}

                    {(builderTab === 'weekend' || builderTab === 'all') && (
                      <>
                        <th className="col-center">SATURDAY</th>
                        <th className="col-center">SUNDAY</th>
                      </>
                    )}

                    <th className="col-center" style={{ width: '60px' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {slotsList.map((slot) => (
                    <tr key={slot.id}>
                      <td className="col-center">
                        <input 
                          type="text" 
                          value={slot.start_time} 
                          onChange={e => {
                            const val = e.target.value;
                            setSlotsList(slotsList.map(s => s.id === slot.id ? { ...s, start_time: val } : s));
                          }}
                          className="text-input-sm font-mono font-bold text-center"
                        />
                      </td>
                      <td className="col-center">
                        <input 
                          type="text" 
                          value={slot.end_time} 
                          onChange={e => {
                            const val = e.target.value;
                            setSlotsList(slotsList.map(s => s.id === slot.id ? { ...s, end_time: val } : s));
                          }}
                          className="text-input-sm font-mono font-bold text-center"
                        />
                      </td>

                      {(builderTab === 'weekdays' || builderTab === 'all') && (
                        <>
                          {/* Monday */}
                          <td className="col-center">
                            <select 
                              value={slot.monday_status || slot.default_weekday_status}
                              onChange={e => handleDayStatusChange(slot.id, 'monday', e.target.value as SlotStatusType)}
                              className="select-input-sm"
                            >
                              {STATUS_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                          </td>
                          {/* Tuesday */}
                          <td className="col-center">
                            <select 
                              value={slot.tuesday_status || slot.default_weekday_status}
                              onChange={e => handleDayStatusChange(slot.id, 'tuesday', e.target.value as SlotStatusType)}
                              className="select-input-sm"
                            >
                              {STATUS_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                          </td>
                          {/* Wednesday */}
                          <td className="col-center">
                            <select 
                              value={slot.wednesday_status || slot.default_weekday_status}
                              onChange={e => handleDayStatusChange(slot.id, 'wednesday', e.target.value as SlotStatusType)}
                              className="select-input-sm"
                            >
                              {STATUS_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                          </td>
                          {/* Thursday */}
                          <td className="col-center">
                            <select 
                              value={slot.thursday_status || slot.default_weekday_status}
                              onChange={e => handleDayStatusChange(slot.id, 'thursday', e.target.value as SlotStatusType)}
                              className="select-input-sm"
                            >
                              {STATUS_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                          </td>
                          {/* Friday */}
                          <td className="col-center">
                            <select 
                              value={slot.friday_status || slot.default_weekday_status}
                              onChange={e => handleDayStatusChange(slot.id, 'friday', e.target.value as SlotStatusType)}
                              className="select-input-sm"
                            >
                              {STATUS_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                          </td>
                        </>
                      )}

                      {(builderTab === 'weekend' || builderTab === 'all') && (
                        <>
                          {/* Saturday */}
                          <td className="col-center">
                            <select 
                              value={slot.saturday_status || slot.default_weekend_status}
                              onChange={e => handleDayStatusChange(slot.id, 'saturday', e.target.value as SlotStatusType)}
                              className="select-input-sm"
                            >
                              {STATUS_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                          </td>
                          {/* Sunday */}
                          <td className="col-center">
                            <select 
                              value={slot.sunday_status || slot.default_weekend_status}
                              onChange={e => handleDayStatusChange(slot.id, 'sunday', e.target.value as SlotStatusType)}
                              className="select-input-sm"
                            >
                              {STATUS_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                          </td>
                        </>
                      )}

                      <td className="col-center">
                        <button 
                          type="button" 
                          onClick={() => handleRemoveSlot(slot.id)}
                          className="btn-danger-icon"
                          title="Remove Slot"
                        >
                          <Trash2 className="icon-sm" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="form-actions mt-4">
            <button type="submit" className="btn-primary btn-lg full-width shadow-md">
              <Check className="icon-sm" /> Save & Publish Custom Shift Template
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
