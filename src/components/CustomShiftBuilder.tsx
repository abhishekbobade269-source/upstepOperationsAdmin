import React, { useState, useEffect, useMemo } from 'react';
import type { ShiftTemplate, ShiftSlotDefinition, SlotStatusType, Coach, Slot } from '../types';
import { 
  Plus, 
  Trash2, 
  Settings, 
  Eye, 
  Search, 
  ChevronRight, 
  Edit 
} from 'lucide-react';
import './AdminPortal.css';

interface CustomShiftBuilderProps {
  shifts: ShiftTemplate[];
  onCreateShift: (newShift: ShiftTemplate) => void;
  onDeleteShift: (shiftId: string) => void;
  coaches: Coach[];
  slots: Slot[];
  onUpdateShift: (updatedShift: ShiftTemplate) => void;
}

const REGION_OPTIONS = ['UK', 'USA', 'AUS', 'IND', 'SIN', 'UAE', 'EUR', 'WW'];

const STATUS_OPTIONS: { label: string; value: SlotStatusType; activity: string }[] = [
  { label: 'Available (X)', value: 'AVAILABLE', activity: 'X' },
  { label: 'Break', value: 'REST_BREAK', activity: 'BREAK' },
  { label: 'Daylight Break', value: 'BATCH_LEVEL_BREAK', activity: 'DAYLIGHT_BREAK' },
  { label: 'Report-building', value: 'REPORT_BUILDING', activity: 'Report-building time' },
  { label: 'Off / Weekend', value: 'OFF_DUTY', activity: 'OFF' },
  { label: 'X Demo Slot', value: 'DEMO_CLASS', activity: 'X Demo' }
];

const TIMEZONE_OPTIONS = [
  'Europe/London',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Brisbane',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore'
];

export const CustomShiftBuilder: React.FC<CustomShiftBuilderProps> = ({
  shifts,
  onCreateShift,
  onDeleteShift,
  coaches,
  slots,
  onUpdateShift
}) => {
  const [activeMode, setActiveMode] = useState<'inspect' | 'create'>('inspect');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    const saved = localStorage.getItem('upstep_shift_builder_template_id');
    return saved && shifts.some(s => s.id === saved) ? saved : (shifts[0]?.id || '');
  });

  // Active regime version selector: VERSION_A (Standard) vs. VERSION_B (Daylight)
  const [selectedVersion, setSelectedVersion] = useState<'STANDARD' | 'DAYLIGHT'>('STANDARD');

  // Form states for Editing selected shift
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editShiftType, setEditShiftType] = useState<'Full Time' | 'Part Time'>('Full Time');
  const [editWorkingDays, setEditWorkingDays] = useState('Mon-Sat');
  const [editRegions, setEditRegions] = useState<string[]>([]);
  const [editTimezone, setEditTimezone] = useState('America/New_York');
  const [editStrategy, setEditStrategy] = useState<'NONE' | 'FULL_SHIFT' | 'SPECIAL_TEMPLATE'>('FULL_SHIFT');

  // Form states for creating custom shift
  const [shiftName, setShiftName] = useState('');
  const [shiftType, setShiftType] = useState<'Full Time' | 'Part Time'>('Full Time');
  const [workingDays, setWorkingDays] = useState('Mon-Sat');
  const [selectedRegions, setSelectedRegions] = useState<string[]>(['USA', 'UK']);
  const [createTimezone, setCreateTimezone] = useState('America/New_York');
  const [createStrategy, setCreateStrategy] = useState<'NONE' | 'FULL_SHIFT' | 'SPECIAL_TEMPLATE'>('FULL_SHIFT');

  const [slotsList, setSlotsList] = useState<ShiftSlotDefinition[]>([
    { 
      id: '1', start_time: '12:00 PM', end_time: '12:45 PM', 
      default_weekday_status: 'AVAILABLE', default_weekday_activity: 'X', 
      default_weekend_status: 'OFF_DUTY', default_weekend_activity: 'OFF' 
    },
    { 
      id: '2', start_time: '12:45 PM', end_time: '1:30 PM', 
      default_weekday_status: 'AVAILABLE', default_weekday_activity: 'X', 
      default_weekend_status: 'OFF_DUTY', default_weekend_activity: 'OFF' 
    }
  ]);

  const selectedTemplate = useMemo(() => {
    return shifts.find(s => s.id === selectedTemplateId) || shifts[0];
  }, [shifts, selectedTemplateId]);

  // Sync edits when active template changes
  useEffect(() => {
    if (selectedTemplate) {
      setEditName(selectedTemplate.name);
      setEditShiftType(selectedTemplate.shift_type);
      setEditWorkingDays(selectedTemplate.working_days);
      setEditRegions([...selectedTemplate.regions]);
      setEditTimezone(selectedTemplate.iana_timezone || 'America/New_York');
      setEditStrategy(selectedTemplate.dst_transition_strategy || 'FULL_SHIFT');
      setIsEditing(false);
    }
  }, [selectedTemplate]);

  useEffect(() => {
    if (selectedTemplateId) {
      localStorage.setItem('upstep_shift_builder_template_id', selectedTemplateId);
    }
  }, [selectedTemplateId]);

  // Filter templates list
  const filteredTemplates = useMemo(() => {
    return shifts.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [shifts, searchQuery]);

  const toggleEditRegion = (region: string) => {
    if (editRegions.includes(region)) {
      setEditRegions(editRegions.filter(r => r !== region));
    } else {
      setEditRegions([...editRegions, region]);
    }
  };

  const toggleCreateRegion = (region: string) => {
    if (selectedRegions.includes(region)) {
      setSelectedRegions(selectedRegions.filter(r => r !== region));
    } else {
      setSelectedRegions([...selectedRegions, region]);
    }
  };

  // Timetable cells editing handlers (Standard vs. Daylight)
  const handleCellStatusClick = (slotIdx: number, day: string) => {
    if (!selectedTemplate) return;

    const currentSlots = selectedVersion === 'STANDARD' 
      ? [...selectedTemplate.slots] 
      : [...(selectedTemplate.daylightSlots || selectedTemplate.slots)];

    const targetSlot = currentSlots[slotIdx];
    const statusKey = `${day.toLowerCase()}_status` as keyof ShiftSlotDefinition;
    const activityKey = `${day.toLowerCase()}_activity` as keyof ShiftSlotDefinition;

    // Get current cell value
    const currentVal = (targetSlot[statusKey] || targetSlot.default_weekday_status) as SlotStatusType;
    
    // Rotate to next status option
    const currentOptIdx = STATUS_OPTIONS.findIndex(o => o.value === currentVal);
    const nextOpt = STATUS_OPTIONS[(currentOptIdx + 1) % STATUS_OPTIONS.length];

    currentSlots[slotIdx] = {
      ...targetSlot,
      [statusKey]: nextOpt.value,
      [activityKey]: nextOpt.activity
    };

    const updatedTemplate: ShiftTemplate = {
      ...selectedTemplate,
      slots: selectedVersion === 'STANDARD' ? currentSlots : selectedTemplate.slots,
      daylightSlots: selectedVersion === 'DAYLIGHT' ? currentSlots : (selectedTemplate.daylightSlots || [...selectedTemplate.slots])
    };

    onUpdateShift(updatedTemplate);
  };

  const handleSaveDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    const updatedTemplate: ShiftTemplate = {
      ...selectedTemplate,
      name: editName,
      shift_type: editShiftType,
      working_days: editWorkingDays,
      regions: editRegions,
      iana_timezone: editTimezone,
      dst_transition_strategy: editStrategy,
      requires_daylight: editStrategy !== 'NONE'
    };

    onUpdateShift(updatedTemplate);
    setIsEditing(false);
    alert(`Shift details updated successfully!`);
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
      iana_timezone: createTimezone,
      dst_transition_strategy: createStrategy,
      requires_daylight: createStrategy !== 'NONE',
      slots: slotsList,
      daylightSlots: JSON.parse(JSON.stringify(slotsList)) // Clone for Daylight
    };

    onCreateShift(newTemplate);
    setShiftName('');
    setActiveMode('inspect');
    setSelectedTemplateId(newTemplate.id);
    alert(`Custom shift template "${newTemplate.name}" created successfully!`);
  };

  const handleAddSlot = () => {
    const newId = (slotsList.length + 1).toString();
    setSlotsList([
      ...slotsList,
      {
        id: newId,
        start_time: '12:00 PM',
        end_time: '12:45 PM',
        default_weekday_status: 'AVAILABLE', default_weekday_activity: 'X',
        default_weekend_status: 'OFF_DUTY', default_weekend_activity: 'OFF'
      }
    ]);
  };

  const handleRemoveSlot = (id: string) => {
    if (slotsList.length > 1) {
      setSlotsList(slotsList.filter(s => s.id !== id));
    }
  };

  const handleCreateSlotChange = (slotId: string, field: 'start_time' | 'end_time' | 'default_weekday_status' | 'default_weekend_status', val: string) => {
    setSlotsList(slotsList.map(s => {
      if (s.id === slotId) {
        if (field === 'default_weekday_status' || field === 'default_weekend_status') {
          const opt = STATUS_OPTIONS.find(o => o.value === val) || STATUS_OPTIONS[0];
          const actField = field === 'default_weekday_status' ? 'default_weekday_activity' : 'default_weekend_activity';
          return { ...s, [field]: val as SlotStatusType, [actField]: opt.activity };
        }
        return { ...s, [field]: val };
      }
      return s;
    }));
  };

  // Get coaches assigned to the active shift template
  const assignedCoachesList = useMemo(() => {
    if (!selectedTemplate) return [];
    return coaches.filter(c => 
      c.shift_name === selectedTemplate.name || 
      c.shift_type === (selectedTemplate.name as any) ||
      slots.some(s => s.coach_id === c.id && s.shift_name === selectedTemplate.name)
    );
  }, [coaches, slots, selectedTemplate]);

  // Status cell style resolver
  const getCellClassName = (slot: ShiftSlotDefinition, day: string) => {
    const statusKey = `${day.toLowerCase()}_status` as keyof ShiftSlotDefinition;
    const val = (slot[statusKey] || slot.default_weekday_status) as SlotStatusType;
    
    if (val === 'AVAILABLE') return 'status-blue-available';
    if (val === 'REST_BREAK') return 'status-red-break';
    if (val === 'BATCH_LEVEL_BREAK') return 'status-purple-break';
    if (val === 'REPORT_BUILDING') return 'status-olive-report';
    if (val === 'OFF_DUTY') return 'status-placeholder-cell';
    if (val === 'DEMO_CLASS') return 'status-orange-temp';
    return '';
  };

  const getCellLabelText = (slot: ShiftSlotDefinition, day: string) => {
    const activityKey = `${day.toLowerCase()}_activity` as keyof ShiftSlotDefinition;
    const actVal = slot[activityKey] || slot.default_weekday_activity;
    
    if (actVal === 'X') return 'Available';
    if (actVal === 'BREAK') return 'Break';
    if (actVal === 'DAYLIGHT_BREAK') return 'DL Break';
    if (actVal === 'Report-building time') return 'Report';
    if (actVal === 'OFF') return 'Off';
    if (actVal === 'X Demo') return 'Demo';
    return actVal || '-';
  };

  const daysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="custom-shift-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. Header Card */}
      <div className="section-header-card shadow-lg" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div className="header-icon-box">
            <Settings className="icon-gold" />
          </div>
          <div className="header-text-box">
            <h2>Shift Master DST Configurator</h2>
            <p>Manage shift templates, reference timezones, transition strategies, and Standard/Daylight version timetables.</p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="mode-toggle-group">
          <button 
            type="button"
            className={`mode-btn ${activeMode === 'inspect' ? 'active' : ''}`}
            onClick={() => { setActiveMode('inspect'); setIsEditing(false); }}
          >
            <Eye className="icon-sm" /> Shifts Timetable ({shifts.length})
          </button>
          <button 
            type="button"
            className={`mode-btn ${activeMode === 'create' ? 'active' : ''}`}
            onClick={() => setActiveMode('create')}
          >
            <Plus className="icon-sm" /> Create Shift Template
          </button>
        </div>
      </div>

      {/* 2. Main Layout Split View */}
      {activeMode === 'inspect' ? (
        <div className="shift-master-split" style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
          
          {/* Left Shifts List Column */}
          <div className="shift-sidebar card-glass" style={{ width: '260px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--heading-font)', fontSize: '1rem', fontWeight: 700 }}>Shifts List</h3>
            <div className="search-box">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search shifts..."
                className="search-input"
                style={{ width: '100%' }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="sidebar-shift-list-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '420px', overflowY: 'auto' }}>
              {filteredTemplates.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { setSelectedTemplateId(s.id); setIsEditing(false); }}
                  className={`sidebar-nav-btn ${selectedTemplateId === s.id ? 'active' : ''}`}
                  style={{ padding: '0.55rem 0.75rem', fontSize: '0.78rem', justifyContent: 'space-between' }}
                >
                  <span className="font-bold">{s.name}</span>
                  <ChevronRight className="icon-sm" style={{ opacity: selectedTemplateId === s.id ? 1 : 0.4 }} />
                </button>
              ))}
            </div>
          </div>

          {/* Right Details Timetable Column */}
          {selectedTemplate && (
            <div className="shift-main-details card-glass" style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Card Header (Details & Edit Actions) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--heading-font)', fontSize: '1.35rem', fontWeight: 700 }}>{selectedTemplate.name} Details</h2>
                  <span className="subtext">Configure operational metadata parameters and standard/daylight versions.</span>
                </div>
                {!isEditing ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      type="button" 
                      className="btn-secondary-sm" 
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="icon-sm" /> Edit Parameters
                    </button>
                    {shifts.length > 1 && (
                      <button
                        type="button"
                        className="btn-secondary-sm"
                        style={{ color: 'var(--accent-red)', borderColor: 'rgba(239,68,68,0.3)' }}
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete shift template "${selectedTemplate.name}"?`)) {
                            onDeleteShift(selectedTemplate.id);
                          }
                        }}
                        title="Delete this shift template"
                      >
                        <Trash2 className="icon-sm" /> Delete
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      type="button" 
                      onClick={handleSaveDetailsSubmit} 
                      className="btn-primary"
                    >
                      Save Parameters
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsEditing(false)} 
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Shift Metadata Form/Display Grid */}
              <form onSubmit={e => e.preventDefault()} className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Employment Model</label>
                  {!isEditing ? (
                    <span className="font-bold" style={{ fontSize: '0.88rem' }}>{selectedTemplate.shift_type}</span>
                  ) : (
                    <select
                      value={editShiftType}
                      onChange={e => setEditShiftType(e.target.value as any)}
                      className="select-input"
                    >
                      <option value="Full Time">Full Time</option>
                      <option value="Part Time">Part Time</option>
                    </select>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Shift Category / Working Days</label>
                  {!isEditing ? (
                    <span className="font-bold" style={{ fontSize: '0.88rem' }}>{selectedTemplate.working_days}</span>
                  ) : (
                    <input
                      type="text"
                      value={editWorkingDays}
                      onChange={e => setEditWorkingDays(e.target.value)}
                      className="text-input"
                    />
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Reference Timezone</label>
                  {!isEditing ? (
                    <span className="font-bold font-mono" style={{ fontSize: '0.88rem', color: 'var(--accent-blue)' }}>
                      {selectedTemplate.iana_timezone || 'America/New_York'}
                    </span>
                  ) : (
                    <select
                      value={editTimezone}
                      onChange={e => setEditTimezone(e.target.value)}
                      className="select-input"
                    >
                      {TIMEZONE_OPTIONS.map(tz => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">DST Transition Strategy</label>
                  {!isEditing ? (
                    <span className="font-bold" style={{ fontSize: '0.88rem', color: 'var(--accent-gold)' }}>
                      {selectedTemplate.dst_transition_strategy || 'FULL_SHIFT'}
                    </span>
                  ) : (
                    <select
                      value={editStrategy}
                      onChange={e => setEditStrategy(e.target.value as any)}
                      className="select-input"
                    >
                      <option value="NONE">NONE (Fixed IST)</option>
                      <option value="FULL_SHIFT">FULL_SHIFT (Shift standard by 1 hour)</option>
                      <option value="SPECIAL_TEMPLATE">SPECIAL_TEMPLATE (Custom Daylight slots)</option>
                    </select>
                  )}
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Country Eligibility</label>
                  {!isEditing ? (
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                      {selectedTemplate.regions.map(r => (
                        <span key={r} className="badge-pill blue" style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem' }}>{r}</span>
                      ))}
                    </div>
                  ) : (
                    <div className="checkbox-wrap-grid">
                      {REGION_OPTIONS.map(r => {
                        const checked = editRegions.includes(r);
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => toggleEditRegion(r)}
                            className={`chip-checkbox ${checked ? 'selected' : ''}`}
                          >
                            {r}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </form>

              {/* Version Selector Tabs (Standard vs Daylight) */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontFamily: 'var(--heading-font)', fontSize: '1.05rem', fontWeight: 700 }}>Weekly Timetable Schedule</h3>
                  
                  {/* VERSION TABS */}
                  <div className="view-mode-tabs" style={{ background: 'rgba(9, 14, 26, 0.5)' }}>
                    <button
                      type="button"
                      className={`tab-btn ${selectedVersion === 'STANDARD' ? 'active' : ''}`}
                      onClick={() => setSelectedVersion('STANDARD')}
                      style={{ fontSize: '0.78rem' }}
                    >
                      VERSION_A (Standard Time)
                    </button>
                    <button
                      type="button"
                      className={`tab-btn ${selectedVersion === 'DAYLIGHT' ? 'active' : ''}`}
                      onClick={() => setSelectedVersion('DAYLIGHT')}
                      style={{ fontSize: '0.78rem' }}
                    >
                      VERSION_B (Daylight Time)
                    </button>
                  </div>
                </div>

                {/* Timetable Slots Table */}
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr style={{ background: 'rgba(9,14,26,0.3)' }}>
                        <th style={{ width: '50px' }}>Seq</th>
                        <th style={{ width: '180px' }}>Time Range</th>
                        {daysList.map(day => (
                          <th key={day}>{day.substring(0, 3)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {((selectedVersion === 'STANDARD' ? selectedTemplate.slots : selectedTemplate.daylightSlots) || selectedTemplate.slots).map((slot, sIdx) => (
                        <tr key={slot.id || sIdx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td className="font-mono font-bold" style={{ fontSize: '0.75rem' }}>{sIdx + 1}</td>
                          <td className="font-mono font-bold" style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            {slot.start_time} - {slot.end_time}
                          </td>
                          {daysList.map(day => (
                            <td 
                              key={day} 
                              className="col-center"
                              style={{ padding: '0.35rem 0.25rem' }}
                            >
                              <div
                                onClick={() => handleCellStatusClick(sIdx, day)}
                                className={`status-pill-badge ${getCellClassName(slot, day)}`}
                                style={{ 
                                  cursor: 'pointer', 
                                  fontSize: '0.72rem', 
                                  width: '90%', 
                                  textAlign: 'center',
                                  padding: '0.25rem 0'
                                }}
                                title="Click to rotate status type"
                              >
                                {getCellLabelText(slot, day)}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Assigned Coaches List */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                <h3 style={{ fontFamily: 'var(--heading-font)', fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                  Assigned Coaches ({assignedCoachesList.length})
                </h3>
                {assignedCoachesList.length === 0 ? (
                  <p className="text-muted" style={{ fontSize: '0.8rem' }}>No coaches currently assigned to this shift template.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.85rem' }}>
                    {assignedCoachesList.map(c => (
                      <div 
                        key={c.id} 
                        className="support-box" 
                        style={{ background: 'rgba(255,255,255,0.01)', padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}
                      >
                        <div className="avatar-circle" style={{ width: '30px', height: '30px', fontSize: '0.76rem' }}>
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '0.8rem', fontWeight: 600 }}>{c.display_name}</h4>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            Mgr: {c.trainer_manager || 'NA'} ({c.emp_type})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      ) : (
        /* MODE 2: CREATE SHIFT TEMPLATE FORM */
        <div className="shift-creator-card card-glass shadow-md" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--heading-font)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            Create New Shift Template
          </h3>
          
          <form onSubmit={handleCreateShiftSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">Template Name</label>
                <input
                  type="text"
                  placeholder="e.g. Shift12-FT"
                  value={shiftName}
                  onChange={e => setShiftName(e.target.value)}
                  className="text-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Employment Type</label>
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
                <label className="form-label">Working Days Label</label>
                <input
                  type="text"
                  placeholder="e.g. Mon-Sat"
                  value={workingDays}
                  onChange={e => setWorkingDays(e.target.value)}
                  className="text-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reference Timezone</label>
                <select
                  value={createTimezone}
                  onChange={e => setCreateTimezone(e.target.value)}
                  className="select-input"
                >
                  {TIMEZONE_OPTIONS.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Transition Strategy</label>
                <select
                  value={createStrategy}
                  onChange={e => setCreateStrategy(e.target.value as any)}
                  className="select-input"
                >
                  <option value="NONE">NONE (Fixed IST)</option>
                  <option value="FULL_SHIFT">FULL_SHIFT (Shift standard by 1 hour)</option>
                  <option value="SPECIAL_TEMPLATE">SPECIAL_TEMPLATE (Custom Daylight slots)</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Country Eligibility Regions</label>
                <div className="checkbox-wrap-grid">
                  {REGION_OPTIONS.map(r => {
                    const checked = selectedRegions.includes(r);
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => toggleCreateRegion(r)}
                        className={`chip-checkbox ${checked ? 'selected' : ''}`}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Time Slot Definitions Builder */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontFamily: 'var(--heading-font)', fontSize: '1rem', fontWeight: 700 }}>Time Slot Rows</h4>
                <button
                  type="button"
                  onClick={handleAddSlot}
                  className="btn-secondary-sm"
                >
                  <Plus className="icon-sm" /> Add Slot Row
                </button>
              </div>

              <div className="table-responsive">
                <table className="custom-table slots-builder-table">
                  <thead>
                    <tr style={{ background: 'rgba(9,14,26,0.3)' }}>
                      <th>Start Time</th>
                      <th>End Time</th>
                      <th>Weekday Status</th>
                      <th>Weekend Status</th>
                      <th style={{ width: '80px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slotsList.map((slot) => (
                      <tr key={slot.id}>
                        <td>
                          <input
                            type="text"
                            value={slot.start_time}
                            onChange={e => handleCreateSlotChange(slot.id, 'start_time', e.target.value)}
                            className="text-input-sm"
                            placeholder="e.g. 5:00 PM"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={slot.end_time}
                            onChange={e => handleCreateSlotChange(slot.id, 'end_time', e.target.value)}
                            className="text-input-sm"
                            placeholder="e.g. 5:45 PM"
                          />
                        </td>
                        <td>
                          <select
                            value={slot.default_weekday_status}
                            onChange={e => handleCreateSlotChange(slot.id, 'default_weekday_status', e.target.value)}
                            className="select-input-sm"
                          >
                            {STATUS_OPTIONS.map(o => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            value={slot.default_weekend_status}
                            onChange={e => handleCreateSlotChange(slot.id, 'default_weekend_status', e.target.value)}
                            className="select-input-sm"
                          >
                            {STATUS_OPTIONS.map(o => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <button
                            type="button"
                            disabled={slotsList.length <= 1}
                            onClick={() => handleRemoveSlot(slot.id)}
                            className="btn-danger-icon"
                            style={{ opacity: slotsList.length <= 1 ? 0.3 : 1 }}
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

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <button type="submit" className="btn-primary">
                Publish Shift Template
              </button>
              <button 
                type="button" 
                onClick={() => setActiveMode('inspect')} 
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
