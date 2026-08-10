import React, { useState } from 'react';
import type { Coach, ShiftTemplate } from '../types';
import { UserPlus, Check, User, Award, Briefcase, Sparkles, Upload, Image as ImageIcon, X } from 'lucide-react';

interface CoachOnboardingProps {
  shifts: ShiftTemplate[];
  onAddCoach: (newCoach: Coach, selectedShift: ShiftTemplate) => void;
}

export const CoachOnboarding: React.FC<CoachOnboardingProps> = ({
  shifts,
  onAddCoach
}) => {
  const [name, setName] = useState('');
  const [sfCoachName, setSfCoachName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [standardRating, setStandardRating] = useState<number>(1800);
  const [category] = useState('CT3');
  const [canTeachUpto, setCanTeachUpto] = useState('Advanced Part 2');
  const [languages, setLanguages] = useState('English, Hindi');
  const [empType, setEmpType] = useState<'Full Time' | 'Part Time'>('Full Time');
  const [shiftDays, setShiftDays] = useState<1 | 2>(1);
  const [trainerManager, setTrainerManager] = useState('Vedant Kamble');
  const [selectedShiftId, setSelectedShiftId] = useState<string>(shifts[0]?.id || 'shift-5-ft');
  const [profilePic, setProfilePic] = useState<string>('');

  // Auto-calculate Tier
  const calculateTier = (rating: number): Coach['tier'] => {
    if (rating >= 2200) return 'Tier 5';
    if (rating >= 2000) return 'Tier 4';
    if (rating >= 1800) return 'Tier 3';
    if (rating >= 1600) return 'Tier 2';
    if (rating >= 1400) return 'Tier 1';
    return 'No Tier';
  };

  const currentTier = calculateTier(standardRating);
  const selectedShift = shifts.find(s => s.id === selectedShiftId) || shifts[0];

  // Handle Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCoach: Coach = {
      id: Date.now(),
      name: name.trim(),
      display_name: name.trim(),
      sf_coach_name: sfCoachName.trim() || name.trim(),
      category: category,
      emp_type: empType,
      shift_days: shiftDays,
      shift_type: shiftDays === 2 ? 'Night Shift' : 'Day Shift',
      standard_rating: standardRating,
      tier: currentTier,
      can_teach_upto: canTeachUpto,
      demo_preference: 'Preference 1',
      demo_preference_color: '#00ff00',
      languages: languages,
      employee_id: employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      trainer_manager: trainerManager,
      class_hours_per_day: empType === 'Full Time' ? 6.0 : 4.5,
      max_daily_classes: empType === 'Full Time' ? 8 : 6,
      max_daily_demos: empType === 'Full Time' ? 16 : 10,
      employment_model: 'Salaried',
      is_active: true,
      profile_pic: profilePic || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
    };

    onAddCoach(newCoach, selectedShift);
    
    // Reset Form
    setName('');
    setSfCoachName('');
    setEmployeeId('');
    setProfilePic('');
    alert(`Coach ${newCoach.display_name} onboarded successfully! Schedule grid generated from shift "${selectedShift.name}".`);
  };

  return (
    <div className="onboard-container">
      {/* Header */}
      <div className="section-header-card shadow-lg">
        <div className="header-icon-box">
          <UserPlus className="icon-gold" />
        </div>
        <div className="header-text-box">
          <h2>Onboard New Coach & Instantiate Schedule Grid</h2>
          <p>Register a new coach in the operations database. Their initial Weekday & Weekend schedules will automatically instantiate from the selected shift template.</p>
        </div>
      </div>

      <div className="onboard-grid-layout" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* FORM CARD */}
        <form onSubmit={handleSubmit} className="onboard-form-card card-glass shadow-md">
          {/* Section 1: Personal & Identity */}
          <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <User className="icon-sm text-blue" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>1. Coach Profile & Identity</h3>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Full Display Name:</label>
              <input 
                type="text" 
                placeholder="e.g. Rahul Sharma" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="text-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Salesforce Coach Name:</label>
              <input 
                type="text" 
                placeholder="Official SF Name" 
                value={sfCoachName}
                onChange={e => setSfCoachName(e.target.value)}
                className="text-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Employee ID:</label>
              <input 
                type="text" 
                placeholder="e.g. EMP-1088" 
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                className="text-input"
              />
            </div>
          </div>

          {/* Section 2: Ratings & Teaching Level */}
          <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1.25rem 0 1rem 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <Award className="icon-sm text-gold" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>2. Rating & Teaching Qualifications</h3>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Standard / FIDE Rating:</label>
              <input 
                type="number" 
                value={standardRating}
                onChange={e => setStandardRating(parseInt(e.target.value, 10) || 0)}
                className="text-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Teaching Level (Can Teach Upto):</label>
              <select 
                value={canTeachUpto} 
                onChange={e => setCanTeachUpto(e.target.value)}
                className="select-input"
              >
                <option value="Sub-Junior">Sub-Junior</option>
                <option value="Junior">Junior</option>
                <option value="Advanced Part 1">Advanced Part 1</option>
                <option value="Advanced Part 2">Advanced Part 2</option>
                <option value="Senior Part 1">Senior Part 1</option>
                <option value="Senior Part 2">Senior Part 2</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Languages Spoken:</label>
              <input 
                type="text" 
                value={languages}
                onChange={e => setLanguages(e.target.value)}
                className="text-input"
              />
            </div>
          </div>

          {/* Section 3: Operations & Shift Setup */}
          <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1.25rem 0 1rem 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <Briefcase className="icon-sm text-green" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>3. Operations Manager & Shift Selection</h3>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Assign Shift Template:</label>
              <select 
                value={selectedShiftId} 
                onChange={e => setSelectedShiftId(e.target.value)}
                className="select-input"
              >
                {shifts.map(shift => (
                  <option key={shift.id} value={shift.id}>
                    {shift.name} ({shift.shift_type} | {shift.working_days})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Relationship Manager (RM):</label>
              <input 
                type="text" 
                value={trainerManager}
                onChange={e => setTrainerManager(e.target.value)}
                className="text-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Employment Type:</label>
              <select 
                value={empType} 
                onChange={e => setEmpType(e.target.value as any)}
                className="select-input"
              >
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Shift Type (Shift Days):</label>
              <select 
                value={shiftDays} 
                onChange={e => setShiftDays(parseInt(e.target.value, 10) as 1 | 2)}
                className="select-input font-bold"
                style={{ color: shiftDays === 2 ? '#c084fc' : '#fbbf24' }}
              >
                <option value="1">☀️ Day Shift (Shift Days: 1)</option>
                <option value="2">🌙 Night Shift (Shift Days: 2)</option>
              </select>
            </div>
          </div>

          {/* Section 4: Photo File Upload */}
          <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1.25rem 0 1rem 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <ImageIcon className="icon-sm text-purple" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>4. Coach Profile Photo Upload</h3>
          </div>

          <div className="photo-upload-zone" style={{ background: 'var(--bg-card)', border: '2px dashed var(--border-color)', borderRadius: '10px', padding: '1.25rem', textAlign: 'center', position: 'relative' }}>
            {profilePic ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <img 
                  src={profilePic} 
                  alt="Uploaded Coach" 
                  style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-gold)' }}
                />
                <div style={{ textAlign: 'left' }}>
                  <span style={{ display: 'block', fontWeight: '600', color: 'var(--accent-green)', fontSize: '0.88rem' }}>✓ Photo Uploaded Successfully</span>
                  <span className="text-muted" style={{ fontSize: '0.78rem' }}>Click below to change image file</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setProfilePic('')}
                  className="btn-danger-icon"
                  style={{ marginLeft: 'auto' }}
                  title="Remove Photo"
                >
                  <X className="icon-sm" />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="icon-gold" style={{ width: '32px', height: '32px', margin: '0 auto 0.5rem auto', opacity: 0.8 }} />
                <p style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Upload Coach Photo File</p>
                <p className="text-muted" style={{ fontSize: '0.78rem', marginBottom: '0.75rem' }}>PNG, JPG, JPEG or WEBP (Max 5MB)</p>
                <label className="btn-secondary-sm" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                  Choose Image File
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            )}
          </div>

          <div className="form-actions mt-4">
            <button type="submit" className="btn-primary btn-lg full-width shadow-md">
              <Check className="icon-sm" /> Complete Onboarding & Generate Schedule Grid
            </button>
          </div>
        </form>

        {/* LIVE PREVIEW CARD */}
        <div className="onboard-preview-card card-glass shadow-md">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <Sparkles className="icon-gold icon-sm" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700' }}>Live Onboarding Preview</h3>
          </div>

          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <img 
              src={profilePic || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} 
              alt="Preview Avatar" 
              style={{ width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-gold)', margin: '0 auto 0.75rem auto' }}
            />
            <h4 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{name || 'New Coach Name'}</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sfCoachName || 'Salesforce Official Name'}</p>
          </div>

          <div className="preview-badges" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', background: 'var(--bg-card)', padding: '1rem', borderRadius: '10px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Auto Tier:</span>
              <span className="badge-tier">{currentTier} (FIDE {standardRating})</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Assigned Shift:</span>
              <span className="badge-shift">{selectedShift.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Manager (RM):</span>
              <span className="font-bold">{trainerManager}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Teaching Upto:</span>
              <span>{canTeachUpto}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Shift Regions:</span>
              <span className="badge-pill blue">{selectedShift.regions.join(', ')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
