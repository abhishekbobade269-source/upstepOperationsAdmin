import React, { useState, useEffect } from 'react';
import type { Coach, ShiftTemplate } from '../types';
import { 
  UserPlus, Check, User, Award, Briefcase, Sparkles, Upload, 
  Image as ImageIcon, X, Globe, BookOpen, Clock 
} from 'lucide-react';
import '../index.css';

interface CoachOnboardingProps {
  shifts: ShiftTemplate[];
  onAddCoach: (newCoach: Coach, selectedShift: ShiftTemplate) => void;
}

export const CoachOnboarding: React.FC<CoachOnboardingProps> = ({
  shifts,
  onAddCoach
}) => {
  // Section 1: Coach Profile & Identity
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [category, setCategory] = useState('CT3');
  const [lastUpdatedDate, setLastUpdatedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Section 2: Chess Profiles & Ratings
  const [fideId, setFideId] = useState('');
  const [fideProfileLink, setFideProfileLink] = useState('');
  const [standardRating, setStandardRating] = useState<number>(1800);
  const [rapidRating, setRapidRating] = useState<number | ''>('');
  const [blitzRating, setBlitzRating] = useState<number | ''>('');
  const [chessComId, setChessComId] = useState('');
  const [lichessOrgId, setLichessOrgId] = useState('');

  // Section 3: Languages & Communication
  const [fluentLanguages, setFluentLanguages] = useState('');
  const [understandLanguages, setUnderstandLanguages] = useState('');

  // Section 4: Teaching Qualifications & Demos
  const [canTeachUpto, setCanTeachUpto] = useState('Advanced Part 2');
  const [foundationLevelPermanent, setFoundationLevelPermanent] = useState('');
  const [masterLevelPermanent, setMasterLevelPermanent] = useState('');
  const [foundationDemo, setFoundationDemo] = useState<'No' | 'Yes'>('No');
  const [masterDemo, setMasterDemo] = useState<'No' | 'Yes'>('No');

  // Section 5: Materials & Constraints
  const [availableTeachingMaterial, setAvailableTeachingMaterial] = useState('');
  const [coachTeachingMaterial, setCoachTeachingMaterial] = useState('');
  const [coverUpSubstitute, setCoverUpSubstitute] = useState<'No' | 'Yes'>('No');
  const [consecutive5Classes, setConsecutive5Classes] = useState<'No' | 'Yes'>('No');
  const [sessionADay, setSessionADay] = useState<number | ''>('');
  const [workingHours, setWorkingHours] = useState<number | ''>('');

  // Section 6: Shift & Operations Selection
  const [sfCoachName, setSfCoachName] = useState('');
  const [selectedShiftId, setSelectedShiftId] = useState<string>(shifts[0]?.id || 'shift-5-ft');
  const [trainerManager, setTrainerManager] = useState('Vedant Kamble');
  const [empType, setEmpType] = useState<'Full Time' | 'Part Time'>('Full Time');
  const [shiftDays, setShiftDays] = useState<1 | 2>(1);
  const [shiftName, setShiftName] = useState('');
  const [workingDays, setWorkingDays] = useState('');

  // Section 7: Profile Photo
  const [profilePic, setProfilePic] = useState<string>('');

  const selectedShift = shifts.find(s => s.id === selectedShiftId) || shifts[0];

  // Sync Shift fields when template changes
  useEffect(() => {
    if (selectedShift) {
      setShiftName(selectedShift.name);
      setWorkingDays(selectedShift.working_days || 'Monday - Friday');
      
      // Auto-reflect Employment Type (FT -> Full Time, PT -> Part Time)
      if (selectedShift.name.includes('-FT') || selectedShift.name.toLowerCase().includes('full time')) {
        setEmpType('Full Time');
      } else if (selectedShift.name.includes('-PT') || selectedShift.name.toLowerCase().includes('part time')) {
        setEmpType('Part Time');
      }
      
      // Auto-reflect Shift Type (Night -> 2 days/Night Shift, Day -> 1 day/Day Shift)
      if (selectedShift.working_days?.toLowerCase().includes('night')) {
        setShiftDays(2);
      } else {
        setShiftDays(1);
      }
    }
  }, [selectedShiftId, shifts, selectedShift]);

  // Auto-calculate Tier based on rating
  const calculateTier = (rating: number): Coach['tier'] => {
    if (rating >= 2200) return 'Tier 5';
    if (rating >= 2000) return 'Tier 4';
    if (rating >= 1800) return 'Tier 3';
    if (rating >= 1600) return 'Tier 2';
    if (rating >= 1400) return 'Tier 1';
    return 'No Tier';
  };

  const currentTier = calculateTier(standardRating);

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
      languages: fluentLanguages || 'English, Hindi', // Fallback for legacy components
      employee_id: employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      trainer_manager: trainerManager,
      class_hours_per_day: workingHours !== '' ? Number(workingHours) : (empType === 'Full Time' ? 6.0 : 4.5),
      max_daily_classes: sessionADay !== '' ? Number(sessionADay) : (empType === 'Full Time' ? 8 : 6),
      max_daily_demos: empType === 'Full Time' ? 16 : 10,
      employment_model: 'Salaried',
      is_active: true,
      profile_pic: profilePic || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',

      // New properties
      fide_id: fideId.trim() || undefined,
      fide_profile_link: fideProfileLink.trim() || undefined,
      rapid_rating: rapidRating !== '' ? Number(rapidRating) : undefined,
      blitz_rating: blitzRating !== '' ? Number(blitzRating) : undefined,
      foundation_level_permanent: foundationLevelPermanent.trim() || undefined,
      master_level_permanent: masterLevelPermanent.trim() || undefined,
      available_teaching_material: availableTeachingMaterial.trim() || undefined,
      cover_up_substitute: coverUpSubstitute,
      last_updated_date: lastUpdatedDate,
      foundation_demo: foundationDemo,
      master_demo: masterDemo,
      consecutive_5_classes: consecutive5Classes,
      coach_teaching_material: coachTeachingMaterial.trim() || undefined,
      session_a_day: sessionADay !== '' ? Number(sessionADay) : undefined,
      working_hours: workingHours !== '' ? Number(workingHours) : undefined,
      fluent_languages: fluentLanguages.trim() || undefined,
      understand_languages: understandLanguages.trim() || undefined,
      chess_com_id: chessComId.trim() || undefined,
      lichess_org_id: lichessOrgId.trim() || undefined,
      shift_name: shiftName.trim() || undefined,
      working_days: workingDays.trim() || undefined
    };

    onAddCoach(newCoach, selectedShift);
    
    // Reset Form
    setName('');
    setEmployeeId('');
    setFideId('');
    setFideProfileLink('');
    setRapidRating('');
    setBlitzRating('');
    setChessComId('');
    setLichessOrgId('');
    setFluentLanguages('');
    setUnderstandLanguages('');
    setFoundationLevelPermanent('');
    setMasterLevelPermanent('');
    setAvailableTeachingMaterial('');
    setCoachTeachingMaterial('');
    setCoverUpSubstitute('No');
    setConsecutive5Classes('No');
    setFoundationDemo('No');
    setMasterDemo('No');
    setSessionADay('');
    setWorkingHours('');
    setSfCoachName('');
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

      <div className="onboard-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1.9fr 1.1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* FORM CARD */}
        <form onSubmit={handleSubmit} className="onboard-form-card card-glass shadow-md" style={{ padding: '1.5rem' }}>
          
          {/* Section 1: Personal & Identity */}
          <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <User className="icon-sm text-blue" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>1. Coach Profile & Identity</h3>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Coach Full Name:</label>
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
              <label className="form-label">Employee ID:</label>
              <input 
                type="text" 
                placeholder="e.g. EMP-1088" 
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                className="text-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category:</label>
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value)}
                className="select-input"
              >
                <option value="CT1">CT1</option>
                <option value="CT2">CT2</option>
                <option value="CT3">CT3</option>
                <option value="CT4">CT4</option>
                <option value="CT5">CT5</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Last Updated Date:</label>
              <input 
                type="date" 
                value={lastUpdatedDate}
                onChange={e => setLastUpdatedDate(e.target.value)}
                className="text-input"
              />
            </div>
          </div>

          {/* Section 2: Chess Profiles & Ratings */}
          <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1.5rem 0 1rem 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <Award className="icon-sm text-gold" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>2. Chess Profiles & Ratings</h3>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Standard / FIDE Rating:</label>
              <input 
                type="number" 
                value={standardRating}
                onChange={e => setStandardRating(parseInt(e.target.value, 10) || 0)}
                className="text-input"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Rapid Rating:</label>
              <input 
                type="number" 
                placeholder="e.g. 1750"
                value={rapidRating}
                onChange={e => setRapidRating(e.target.value !== '' ? parseInt(e.target.value, 10) : '')}
                className="text-input"
                min="0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Blitz Rating:</label>
              <input 
                type="number" 
                placeholder="e.g. 1700"
                value={blitzRating}
                onChange={e => setBlitzRating(e.target.value !== '' ? parseInt(e.target.value, 10) : '')}
                className="text-input"
                min="0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Fide ID:</label>
              <input 
                type="text" 
                placeholder="FIDE ID Number"
                value={fideId}
                onChange={e => setFideId(e.target.value)}
                className="text-input"
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Fide Profile Link:</label>
              <input 
                type="url" 
                placeholder="https://ratings.fide.com/profile/..."
                value={fideProfileLink}
                onChange={e => setFideProfileLink(e.target.value)}
                className="text-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">chess.com ID:</label>
              <input 
                type="text" 
                placeholder="Chess.com Username"
                value={chessComId}
                onChange={e => setChessComId(e.target.value)}
                className="text-input"
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Lichess.org ID:</label>
              <input 
                type="text" 
                placeholder="Lichess.org Username"
                value={lichessOrgId}
                onChange={e => setLichessOrgId(e.target.value)}
                className="text-input"
              />
            </div>
          </div>

          {/* Section 3: Languages & Communication */}
          <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1.5rem 0 1rem 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <Globe className="icon-sm text-purple" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>3. Languages & Communication</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ lineHeight: '1.4' }}>
                Which languages can you speak fluently? <br />
                <span className="text-muted" style={{ fontSize: '0.78rem', fontWeight: 'normal' }}>
                  Please enter your most fluent language first, followed by second most fluent language, and so on. (Example: English, Bengali, Hindi)
                </span>
              </label>
              <input 
                type="text"
                placeholder="English, Hindi, etc."
                value={fluentLanguages}
                onChange={e => setFluentLanguages(e.target.value)}
                className="text-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ lineHeight: '1.4' }}>
                Which languages can you understand properly? <br />
                <span className="text-muted" style={{ fontSize: '0.78rem', fontWeight: 'normal' }}>
                  Please enter your most comfortable language first, followed by the second most comfortable language, and so on. (Example: English, Bengali, Hindi, Marathi, French)
                </span>
              </label>
              <input 
                type="text"
                placeholder="English, Bengali, Hindi, etc."
                value={understandLanguages}
                onChange={e => setUnderstandLanguages(e.target.value)}
                className="text-input"
              />
            </div>
          </div>

          {/* Section 4: Teaching Qualifications & Demos */}
          <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1.5rem 0 1rem 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <BookOpen className="icon-sm text-green" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>4. Teaching Qualifications & Demos</h3>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Can Teach Upto (Level):</label>
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
              <label className="form-label">Foundation Level (Permanent Class):</label>
              <input 
                type="text" 
                placeholder="e.g. Intermediate L2"
                value={foundationLevelPermanent}
                onChange={e => setFoundationLevelPermanent(e.target.value)}
                className="text-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Master Level (Permanent Class):</label>
              <input 
                type="text" 
                placeholder="e.g. Advanced L4"
                value={masterLevelPermanent}
                onChange={e => setMasterLevelPermanent(e.target.value)}
                className="text-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Foundation Demo(Yes/No):</label>
              <select 
                value={foundationDemo} 
                onChange={e => setFoundationDemo(e.target.value as any)}
                className="select-input"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Master Demo(Yes/No):</label>
              <select 
                value={masterDemo} 
                onChange={e => setMasterDemo(e.target.value as any)}
                className="select-input"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
          </div>

          {/* Section 5: Materials & Constraints */}
          <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1.5rem 0 1rem 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <Clock className="icon-sm text-gold" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>5. Materials & Constraints</h3>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Available Teaching Material:</label>
              <input 
                type="text" 
                placeholder="e.g. Books, PDFs"
                value={availableTeachingMaterial}
                onChange={e => setAvailableTeachingMaterial(e.target.value)}
                className="text-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Coach Teaching Material:</label>
              <input 
                type="text" 
                placeholder="e.g. Lichess Studies"
                value={coachTeachingMaterial}
                onChange={e => setCoachTeachingMaterial(e.target.value)}
                className="text-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Cover up/Substitute:</label>
              <select 
                value={coverUpSubstitute} 
                onChange={e => setCoverUpSubstitute(e.target.value as any)}
                className="select-input"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Consecutive 5 Classes:</label>
              <select 
                value={consecutive5Classes} 
                onChange={e => setConsecutive5Classes(e.target.value as any)}
                className="select-input"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Session a Day (Max):</label>
              <input 
                type="number" 
                placeholder="e.g. 8"
                value={sessionADay}
                onChange={e => setSessionADay(e.target.value !== '' ? parseInt(e.target.value, 10) : '')}
                className="text-input"
                min="1"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Working Hours (Daily Limit):</label>
              <input 
                type="number" 
                step="0.5"
                placeholder="e.g. 6.0"
                value={workingHours}
                onChange={e => setWorkingHours(e.target.value !== '' ? parseFloat(e.target.value) : '')}
                className="text-input"
                min="0.5"
              />
            </div>
          </div>

          {/* Section 6: Shift & Operations Selection */}
          <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1.5rem 0 1rem 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <Briefcase className="icon-sm text-green" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>6. Shift & Operations Selection</h3>
          </div>

          <div className="form-grid-3">
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
              <label className="form-label">Assign Shift Template:</label>
              <select 
                value={selectedShiftId} 
                onChange={e => setSelectedShiftId(e.target.value)}
                className="select-input"
              >
                {shifts.map(shift => (
                  <option key={shift.id} value={shift.id}>
                    {shift.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Shift Name:</label>
              <input 
                type="text"
                placeholder="Auto-populated"
                value={shiftName}
                onChange={e => setShiftName(e.target.value)}
                className="text-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Shift Type:</label>
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

            <div className="form-group">
              <label className="form-label">Working Days:</label>
              <input 
                type="text"
                placeholder="e.g. Monday - Friday"
                value={workingDays}
                onChange={e => setWorkingDays(e.target.value)}
                className="text-input"
                required
              />
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
              <label className="form-label">Employment Type (EMP TYPE):</label>
              <select 
                value={empType} 
                onChange={e => setEmpType(e.target.value as any)}
                className="select-input"
              >
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
              </select>
            </div>
          </div>

          {/* Section 7: Photo File Upload */}
          <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1.5rem 0 1rem 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <ImageIcon className="icon-sm text-purple" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>7. Coach Profile Photo Upload</h3>
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
        <div className="onboard-preview-card card-glass shadow-md" style={{ position: 'sticky', top: '1rem', maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto', padding: '1.5rem' }}>
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
            <h4 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0.25rem 0' }}>{name || 'New Coach Name'}</h4>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              <span className="badge-tier">{currentTier} (FIDE {standardRating})</span>
              <span className="badge-pill blue" style={{ padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>{category}</span>
            </div>
          </div>

          <div className="preview-badges" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--bg-card)', padding: '1rem', borderRadius: '10px', fontSize: '0.82rem' }}>
            {/* Identity & Basic Info */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem' }}>
              <p style={{ fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent-gold)', marginBottom: '0.4rem' }}>Identity & Basic Info</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span className="text-muted">Employee ID:</span>
                <span className="font-bold">{employeeId || '(Not Set)'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span className="text-muted">Salesforce Name:</span>
                <span className="font-bold">{sfCoachName || '(Not Set)'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Last Updated:</span>
                <span>{lastUpdatedDate}</span>
              </div>
            </div>

            {/* Chess & Ratings */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem' }}>
              <p style={{ fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent-gold)', marginBottom: '0.4rem' }}>Chess Profiles & Ratings</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span className="text-muted">Rapid / Blitz:</span>
                <span className="font-bold">
                  {rapidRating || '-'} / {blitzRating || '-'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span className="text-muted">FIDE ID:</span>
                <span className="font-bold">{fideId || '-'}</span>
              </div>
              {fideProfileLink && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span className="text-muted">Profile Link:</span>
                  <a href={fideProfileLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'underline', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px', whiteSpace: 'nowrap' }}>Link</a>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span className="text-muted">Chess.com ID:</span>
                <span className="font-bold">{chessComId || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Lichess.org ID:</span>
                <span className="font-bold">{lichessOrgId || '-'}</span>
              </div>
            </div>

            {/* Languages */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem' }}>
              <p style={{ fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent-gold)', marginBottom: '0.4rem' }}>Languages</p>
              <div style={{ marginBottom: '0.4rem' }}>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.75rem' }}>Fluent:</span>
                <span className="font-bold">{fluentLanguages || '(Not Set)'}</span>
              </div>
              <div>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.75rem' }}>Understand:</span>
                <span className="font-bold">{understandLanguages || '(Not Set)'}</span>
              </div>
            </div>

            {/* Teaching & Demos */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem' }}>
              <p style={{ fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent-gold)', marginBottom: '0.4rem' }}>Teaching & Demos</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span className="text-muted">Can Teach Upto:</span>
                <span>{canTeachUpto}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span className="text-muted">Permanent Found.:</span>
                <span>{foundationLevelPermanent || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span className="text-muted">Permanent Master:</span>
                <span>{masterLevelPermanent || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span className="text-muted">Found. / Master Demo:</span>
                <span className="font-bold">{foundationDemo} / {masterDemo}</span>
              </div>
            </div>

            {/* Materials & Constraints */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem' }}>
              <p style={{ fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent-gold)', marginBottom: '0.4rem' }}>Materials & Constraints</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span className="text-muted">Available Materials:</span>
                <span>{availableTeachingMaterial || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span className="text-muted">Coach Materials:</span>
                <span>{coachTeachingMaterial || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span className="text-muted">Substitute Ready:</span>
                <span>{coverUpSubstitute}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span className="text-muted">Consecutive 5 Classes:</span>
                <span>{consecutive5Classes}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span className="text-muted">Max Sessions/Day:</span>
                <span>{sessionADay || '(Default)'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Working Hours Limit:</span>
                <span>{workingHours ? `${workingHours} hrs` : '(Default)'}</span>
              </div>
            </div>

            {/* Operations & Shift */}
            <div>
              <p style={{ fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent-gold)', marginBottom: '0.4rem' }}>Operations & Shift</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span className="text-muted">Shift Template:</span>
                <span>{selectedShift.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span className="text-muted">Shift Name:</span>
                <span className="font-bold">{shiftName || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span className="text-muted">Shift Type:</span>
                <span className="badge-shift" style={{ color: shiftDays === 2 ? '#c084fc' : '#fbbf24' }}>
                  {shiftDays === 2 ? 'Night Shift' : 'Day Shift'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span className="text-muted">Working Days:</span>
                <span>{workingDays || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span className="text-muted">Manager (RM):</span>
                <span className="font-bold">{trainerManager}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Employment Type:</span>
                <span className="font-bold">{empType}</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
