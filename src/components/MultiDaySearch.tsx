import React, { useState, useMemo, useEffect } from 'react';
import type { Coach, Slot } from '../types';
import { Calendar, Award, ShieldAlert, Sparkles, Check, Plus } from 'lucide-react';
import './MultiDaySearch.css';

interface MultiDaySearchProps {
  coaches: Coach[];
  slots: Slot[];
  onBookSearchResult: (coach: Coach, selectedDays: string[], startTime: string, endTime: string) => void;
}

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

import { isNightShiftCoach, getAdjustedSlotDay, isTemporaryOrDemo, timeToMinutes } from '../utils/shiftUtils';
import { isActiveClassSlot, getSlotDurationMinutes } from '../utils/conflictDetector';

export const MultiDaySearch: React.FC<MultiDaySearchProps> = ({
  coaches,
  slots,
  onBookSearchResult
}) => {
  // Custom multi-day, custom-time slot requirements state
  const [slotRequirements, setSlotRequirements] = useState<{ day: string; time: string }[]>(() => {
    const saved = localStorage.getItem('upstep_search_requirements');
    return saved ? JSON.parse(saved) : [
      { day: 'Monday', time: '6:00 PM' },
      { day: 'Friday', time: '2:00 PM' }
    ];
  });

  // Form helper states for adding custom slots
  const [tempDay, setTempDay] = useState('Monday');
  const [tempTime, setTempTime] = useState('5:00 PM');

  const [minRating, setMinRating] = useState<number>(() => {
    const saved = localStorage.getItem('upstep_search_minRating');
    return saved ? parseInt(saved, 10) : 1400;
  });
  const [selectedTier, setSelectedTier] = useState<string>(() => {
    const saved = localStorage.getItem('upstep_search_selectedTier');
    return saved || 'ALL';
  });
  const [canTeachUpto, setCanTeachUpto] = useState<string>(() => {
    const saved = localStorage.getItem('upstep_search_canTeachUpto');
    return saved || 'ALL';
  });
  const [language, setLanguage] = useState<string>(() => {
    const saved = localStorage.getItem('upstep_search_language');
    return saved || 'ALL';
  });
  const [includePurpleSlots, setIncludePurpleSlots] = useState<boolean>(() => {
    const saved = localStorage.getItem('upstep_search_includePurpleSlots');
    return saved ? saved === 'true' : true;
  });

  // Match Mode controls
  const [matchMode, setMatchMode] = useState<'accurate' | 'approx'>(() => {
    const saved = localStorage.getItem('upstep_search_matchMode');
    return (saved as any) || 'accurate';
  });
  const [tolerance, setTolerance] = useState<number>(() => {
    const saved = localStorage.getItem('upstep_search_tolerance');
    return saved ? parseInt(saved, 10) : 30;
  });

  // Persist search states
  useEffect(() => {
    localStorage.setItem('upstep_search_requirements', JSON.stringify(slotRequirements));
  }, [slotRequirements]);

  useEffect(() => {
    localStorage.setItem('upstep_search_minRating', minRating.toString());
  }, [minRating]);

  useEffect(() => {
    localStorage.setItem('upstep_search_selectedTier', selectedTier);
  }, [selectedTier]);

  useEffect(() => {
    localStorage.setItem('upstep_search_canTeachUpto', canTeachUpto);
  }, [canTeachUpto]);

  useEffect(() => {
    localStorage.setItem('upstep_search_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('upstep_search_includePurpleSlots', includePurpleSlots.toString());
  }, [includePurpleSlots]);

  useEffect(() => {
    localStorage.setItem('upstep_search_matchMode', matchMode);
  }, [matchMode]);

  useEffect(() => {
    localStorage.setItem('upstep_search_tolerance', tolerance.toString());
  }, [tolerance]);

  // Add custom slot requirement
  const handleAddSlotRequirement = () => {
    // Prevent duplicate slot requirements
    if (slotRequirements.some(req => req.day === tempDay && req.time === tempTime)) {
      alert(`The slot requirement for ${tempDay} at ${tempTime} has already been added.`);
      return;
    }
    setSlotRequirements([...slotRequirements, { day: tempDay, time: tempTime }]);
  };

  // Remove slot requirement
  const handleRemoveSlotRequirement = (idx: number) => {
    if (slotRequirements.length > 1) {
      setSlotRequirements(slotRequirements.filter((_, i) => i !== idx));
    } else {
      alert("At least one slot requirement is required to search.");
    }
  };

  const handleUpdateRequirement = (idx: number, newDay: string, newTime: string) => {
    setSlotRequirements(prev => {
      const updated = [...prev];
      updated[idx] = { day: newDay, time: newTime };
      return updated;
    });
  };

  // Apply common presets
  const applyPreset = (preset: 'mon-fri' | 'tue-thu' | 'wed-sat' | 'mon-wed-fri' | 'weekend') => {
    const defaultTime = slotRequirements[0]?.time || '5:00 PM';
    switch (preset) {
      case 'mon-fri':
        setSlotRequirements([
          { day: 'Monday', time: defaultTime },
          { day: 'Friday', time: defaultTime }
        ]);
        break;
      case 'tue-thu':
        setSlotRequirements([
          { day: 'Tuesday', time: defaultTime },
          { day: 'Thursday', time: defaultTime }
        ]);
        break;
      case 'wed-sat':
        setSlotRequirements([
          { day: 'Wednesday', time: defaultTime },
          { day: 'Saturday', time: defaultTime }
        ]);
        break;
      case 'mon-wed-fri':
        setSlotRequirements([
          { day: 'Monday', time: defaultTime },
          { day: 'Wednesday', time: defaultTime },
          { day: 'Friday', time: defaultTime }
        ]);
        break;
      case 'weekend':
        setSlotRequirements([
          { day: 'Saturday', time: defaultTime },
          { day: 'Sunday', time: defaultTime }
        ]);
        break;
    }
  };

  // Dynamically extract all unique start times from the slots list, sorted chronologically
  const availableStartTimes = useMemo(() => {
    const times = new Set<string>([
      "8:00 AM", "9:00 AM", "10:00 AM", "10:15 AM", "11:00 AM", "11:45 AM", 
      "12:00 PM", "12:30 PM", "1:00 PM", "2:00 PM", "3:00 PM", "3:30 PM", 
      "4:00 PM", "5:00 PM", "6:00 PM", "6:45 PM", "7:00 PM", "7:30 PM", 
      "8:00 PM", "8:45 PM", "9:00 PM", "11:00 PM", "12:30 AM"
    ]);
    
    // Add any custom times from slots
    slots.forEach(s => {
      if (s.start_time) {
        times.add(s.start_time);
      }
    });

    return Array.from(times).sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
  }, [slots]);

  // Advanced Availability Matching & Scoring Engine
  const scoredResults = useMemo(() => {
    if (slotRequirements.length === 0) return [];

    const results = coaches.map(coach => {
      // 1. Hard filters
      if (coach.standard_rating < minRating) return null;
      if (selectedTier !== 'ALL' && coach.tier !== selectedTier) return null;
      if (canTeachUpto !== 'ALL' && coach.can_teach_upto !== canTeachUpto) return null;
      if (language !== 'ALL' && !coach.languages.toLowerCase().includes(language.toLowerCase())) return null;
      if (!coach.is_active) return null;

      // Find matching slots for this coach matching each requirement
      const isNight = isNightShiftCoach(coach, coach.id, slots);
      const matchingSlots: Slot[] = [];
      const hasAllRequiredSlots = slotRequirements.every(req => {
        const dbDay = getAdjustedSlotDay(req.day, req.time, isNight, 'db');
        const coachSlots = slots.filter(s => s.coach_id === coach.id && s.day_of_week === dbDay);
        
        // Find slot matching req.time (or within tolerance)
        const matched = coachSlots.find(s => {
          // Check slot availability status (Requirement Block & Next Month Block & Level Breaks are open for Demo/Temp/Sub)
          const isFree = s.status_type === 'AVAILABLE';
          const isOpenBlock = includePurpleSlots && (
            s.status_type === 'BATCH_LEVEL_BREAK' || 
            s.status_type === 'INACTIVE' || 
            s.status_type === 'REQUIREMENT_BLOCK' || 
            s.status_type === 'NEXT_MONTH_BLOCK'
          );
          if (!isFree && !isOpenBlock) return false;

          const slotStartMinutes = timeToMinutes(s.start_time);
          const targetMinutes = timeToMinutes(req.time);

          if (matchMode === 'approx') {
            return Math.abs(slotStartMinutes - targetMinutes) <= tolerance;
          } else {
            return slotStartMinutes === targetMinutes;
          }
        });

        if (matched) {
          matchingSlots.push(matched);
          return true;
        }
        return false;
      });

      if (!hasAllRequiredSlots) {
        return null;
      }

      // Calculate current daily class load for capacity check (on the first requested day)
      const targetDay = slotRequirements[0].day;
      let regularCount = 0;
      let demoCount = 0;

      // Filter slots that are part of this day's shift
      const todaySlots = slots.filter(s => {
        if (s.coach_id !== coach.id) return false;

        if (isNight) {
          const slotMins = timeToMinutes(s.start_time);
          if (s.day_of_week === targetDay) {
            return slotMins >= 20 * 60; // 8:00 PM or later
          }
          const nextDay = getAdjustedSlotDay(targetDay, "12:30 AM", true, 'db'); // Monday -> Tuesday
          if (s.day_of_week === nextDay) {
            return slotMins < 8 * 60; // Before 8:00 AM
          }
          return false;
        } else {
          return s.day_of_week === targetDay;
        }
      });

      todaySlots.forEach(s => {
        const isClass = s.status_type === 'SCHEDULED_CLASS' && !isTemporaryOrDemo(s.activity);
        const isTempOrDemo = s.status_type === 'DEMO_CLASS' || 
                             s.status_type === 'TEMPORARY_CLASS' || 
                             s.status_type === 'SUBSTITUTE_CLASS' ||
                             (s.status_type === 'SCHEDULED_CLASS' && isTemporaryOrDemo(s.activity));

        if (isClass) {
          regularCount++;
        } else if (isTempOrDemo) {
          demoCount++;
        }
      });

      // Calculate current weekly active hours for weekly limit check (36h FT / 18h PT)
      let weeklyActiveMins = 0;
      const coachAllSlots = slots.filter(s => s.coach_id === coach.id);
      coachAllSlots.forEach(s => {
        if (isActiveClassSlot(s)) {
          weeklyActiveMins += getSlotDurationMinutes(s.start_time, s.end_time);
        }
      });
      const currentWeeklyHours = +(weeklyActiveMins / 60).toFixed(1);
      const maxWeeklyLimit = coach.emp_type === 'Part Time' ? 18 : 36;
      const isWeeklyExceeded = currentWeeklyHours >= maxWeeklyLimit;

      const currentDailyLoad = regularCount + (demoCount * 0.5);
      const maxDailyClasses = coach.max_daily_classes || 8;
      const isOverCapacity = (currentDailyLoad + matchingSlots.length) > maxDailyClasses || isWeeklyExceeded;

      // 2. Weighted Scoring Logic
      let score = 45 * matchingSlots.length; // Base overlap score

      if (isWeeklyExceeded) score -= 100; // Penalize coaches who reached max weekly hours limit

      if (language !== 'ALL' && coach.languages.toLowerCase().includes(language.toLowerCase())) {
        score += 30;
      }

      if (canTeachUpto !== 'ALL' && coach.can_teach_upto.toLowerCase().includes(canTeachUpto.toLowerCase())) {
        score += 30;
      }

      const pref = (coach.demo_preference || '').toLowerCase();
      if (pref.includes('preference 1')) score += 50;
      else if (pref.includes('preference 2')) score += 40;
      else if (pref.includes('preference 3')) score += 30;

      const tierStr = coach.tier || '';
      if (tierStr === 'Tier 5') score += 50;
      else if (tierStr === 'Tier 4') score += 40;
      else if (tierStr === 'Tier 3') score += 30;
      else if (tierStr === 'Tier 2') score += 20;
      else if (tierStr === 'Tier 1') score += 10;

      return {
        coach,
        score,
        matchingSlots,
        currentDailyLoad,
        isOverCapacity,
        remainingClassCapacity: Math.max(0, maxDailyClasses - currentDailyLoad),
        remainingDemoCapacity: Math.max(0, (maxDailyClasses - currentDailyLoad) * 2)
      };
    }).filter(Boolean);

    // Sort: non-overcapacity first, then higher scores, then FIDE rating descending
    return results.sort((a: any, b: any) => {
      if (a.isOverCapacity && !b.isOverCapacity) return 1;
      if (!a.isOverCapacity && b.isOverCapacity) return -1;
      return (b.score - a.score) || (b.coach.standard_rating - a.coach.standard_rating);
    });
  }, [coaches, slots, slotRequirements, minRating, selectedTier, canTeachUpto, language, includePurpleSlots, matchMode, tolerance]);

  return (
    <div className="search-page-container">
      {/* Search Header */}
      <div className="search-header-card">
        <div className="title-row">
          <Sparkles className="icon-gold" />
          <h2>Smart Coach Finder & Multi-Time Match Recommendation Engine</h2>
        </div>
        <p className="subtitle-text">
          Specify custom slot timings per day (e.g. Monday @ 6 PM, Friday @ 2 PM). The recommendation engine scores and recommends coaches available for all selections.
        </p>

        {/* Dynamic Custom Slot Builder Zone */}
        <div className="custom-slots-builder-zone card-glass" style={{ padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <span className="font-bold" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
              <Calendar className="icon-gold icon-sm" /> 1. Define Day & Time Slot Criteria:
            </span>
            <div className="preset-buttons" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => applyPreset('mon-fri')} className="btn-preset">📅 Mon & Fri</button>
              <button type="button" onClick={() => applyPreset('tue-thu')} className="btn-preset">📅 Tue & Thu</button>
              <button type="button" onClick={() => applyPreset('wed-sat')} className="btn-preset">📅 Wed & Sat</button>
              <button type="button" onClick={() => applyPreset('mon-wed-fri')} className="btn-preset">📅 Mon, Wed, Fri</button>
              <button type="button" onClick={() => applyPreset('weekend')} className="btn-preset">🏖️ Sat & Sun</button>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span className="text-muted" style={{ fontSize: '0.78rem' }}>Day of Week</span>
              <select 
                value={tempDay} 
                onChange={e => setTempDay(e.target.value)} 
                className="select-input"
                style={{ minWidth: '160px' }}
              >
                {ALL_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span className="text-muted" style={{ fontSize: '0.78rem' }}>Start Time</span>
              <select 
                value={tempTime} 
                onChange={e => setTempTime(e.target.value)} 
                className="select-input"
                style={{ minWidth: '160px' }}
              >
                {availableStartTimes.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            <button 
              type="button" 
              onClick={handleAddSlotRequirement} 
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', padding: '0.55rem 1.25rem' }}
            >
              <Plus className="icon-sm" /> Add Slot Requirement
            </button>
          </div>

          {/* Active Slot Requirements Tags Wrap */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', padding: '0.85rem', border: '1px dashed var(--border-color)', borderRadius: '8px', background: 'rgba(28, 37, 65, 0.4)' }}>
            {slotRequirements.map((req, idx) => (
              <div 
                key={idx} 
                className="badge-pill blue"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid #3b82f6', color: '#60a5fa', fontSize: '0.8rem', padding: '0.35rem 0.65rem', borderRadius: '10px' }}
              >
                <span>📅</span>
                <select
                  value={req.day}
                  onChange={e => handleUpdateRequirement(idx, e.target.value, req.time)}
                  style={{ background: 'rgba(15, 23, 42, 0.85)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.5)', borderRadius: '4px', padding: '0.15rem 0.35rem', fontSize: '0.78rem', fontWeight: 'bold' }}
                >
                  {ALL_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <span>@</span>
                <select
                  value={req.time}
                  onChange={e => handleUpdateRequirement(idx, req.day, e.target.value)}
                  style={{ background: 'rgba(15, 23, 42, 0.85)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.5)', borderRadius: '4px', padding: '0.15rem 0.35rem', fontSize: '0.78rem', fontWeight: 'bold' }}
                >
                  {availableStartTimes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button 
                  type="button" 
                  onClick={() => handleRemoveSlotRequirement(idx)} 
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', marginLeft: '0.25rem' }}
                  title="Remove Requirement"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="search-form-grid">
          {/* Match Mode */}
          <div className="form-group">
            <label className="form-label">Match Mode:</label>
            <select 
              value={matchMode} 
              onChange={e => setMatchMode(e.target.value as any)}
              className="select-input"
            >
              <option value="accurate">Accurate (Exact Match)</option>
              <option value="approx">Approx (With Tolerance)</option>
            </select>
          </div>

          {/* Tolerance */}
          {matchMode === 'approx' ? (
            <div className="form-group">
              <label className="form-label">Tolerance Window:</label>
              <select 
                value={tolerance} 
                onChange={e => setTolerance(parseInt(e.target.value, 10))}
                className="select-input"
              >
                <option value={15}>± 15 Minutes</option>
                <option value={30}>± 30 Minutes</option>
                <option value={45}>± 45 Minutes</option>
              </select>
            </div>
          ) : (
            <div className="form-group" style={{ opacity: 0.5 }}>
              <label className="form-label">Tolerance Window (Disabled):</label>
              <select className="select-input" disabled>
                <option>Exact Match Only</option>
              </select>
            </div>
          )}

          {/* Rating Filter */}
          <div className="form-group">
            <label className="form-label">
              <Award className="icon-sm" /> Min Rating: ({minRating})
            </label>
            <input 
              type="range" 
              min="1400" 
              max="2400" 
              step="50"
              value={minRating}
              onChange={e => setMinRating(parseInt(e.target.value, 10))}
              className="range-input"
            />
          </div>

          {/* Tier Filter */}
          <div className="form-group">
            <label className="form-label">Tier Filter:</label>
            <select 
              value={selectedTier} 
              onChange={e => setSelectedTier(e.target.value)}
              className="select-input"
            >
              <option value="ALL">All Tiers</option>
              <option value="Tier 1">Tier 1 (1400-1599)</option>
              <option value="Tier 2">Tier 2 (1600-1799)</option>
              <option value="Tier 3">Tier 3 (1800-1999)</option>
              <option value="Tier 4">Tier 4 (2000-2199)</option>
              <option value="Tier 5">Tier 5 (2200+)</option>
            </select>
          </div>

          {/* Can Teach Upto */}
          <div className="form-group">
            <label className="form-label">Teaching Level:</label>
            <select 
              value={canTeachUpto} 
              onChange={e => setCanTeachUpto(e.target.value)}
              className="select-input"
            >
              <option value="ALL">All Levels</option>
              <option value="Sub-Junior">Sub-Junior</option>
              <option value="Junior">Junior</option>
              <option value="Advanced Part 1">Advanced Part 1</option>
              <option value="Advanced Part 2">Advanced Part 2</option>
              <option value="Senior Part 1">Senior Part 1</option>
              <option value="Senior Part 2">Senior Part 2</option>
            </select>
          </div>

          {/* Language Filter */}
          <div className="form-group">
            <label className="form-label">Language:</label>
            <select 
              value={language} 
              onChange={e => setLanguage(e.target.value)}
              className="select-input"
            >
              <option value="ALL">All Languages</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Marathi">Marathi</option>
            </select>
          </div>

          {/* Purple Slots Checkbox */}
          <div className="form-group full-width checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includePurpleSlots}
                onChange={e => setIncludePurpleSlots(e.target.checked)}
              />
              <span className="checkbox-custom purple"></span>
              <strong>Include Purple Slots (Level Breaks & Inactives)</strong>: Search coaches who have paused/inactive slots available for Demos or Substitute classes.
            </label>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="results-header">
        <h3>
          Matching Recommendations ({scoredResults.length}) for {slotRequirements.map((req, idx) => `${req.day} @ ${req.time}${idx < slotRequirements.length - 1 ? ', ' : ''}`)}
        </h3>
      </div>

      {/* Results Cards Grid */}
      <div className="results-grid">
        {scoredResults.length === 0 ? (
          <div className="no-results-card">
            <ShieldAlert className="icon-lg text-amber" />
            <h4>No Coaches Available</h4>
            <p>No coaches match all slot requirements and filters. Try adding fewer slots, enabling "Include Purple Slots", or switching to Approx Match Mode.</p>
          </div>
        ) : (
          scoredResults.map(({ coach, score, matchingSlots, currentDailyLoad, isOverCapacity, isWeeklyExceeded, currentWeeklyHours, maxWeeklyLimit, remainingClassCapacity, remainingDemoCapacity }: any) => (
            <div key={coach.id} className={`coach-result-card ${isOverCapacity ? 'over-capacity-card' : ''}`}>
              <div className="card-header">
                <div className="coach-avatar-section">
                  <div className="h-10 w-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-sky-400">
                    {coach.display_name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="coach-name">{coach.display_name}</h4>
                    <span className="badge-tier">{coach.tier}</span>
                  </div>
                </div>
                <div className="recommendation-badge" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                  {isOverCapacity && (
                    <span className="badge-pill red animate-pulse" style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem', fontWeight: 800 }}>
                      ⚠️ {isWeeklyExceeded ? `Weekly Max (${maxWeeklyLimit}h)` : 'Over Capacity Limit'}
                    </span>
                  )}
                  <span className="badge-pill green" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                    Match Score: {score} pts
                  </span>
                  <span className="text-[10px] text-zinc-500 font-bold">⭐ {coach.standard_rating} FIDE</span>
                </div>
              </div>

              <div className="card-body">
                <div className="info-row">
                  <span className="label">Relationship Manager:</span>
                  <span className="value font-medium">{coach.trainer_manager}</span>
                </div>
                <div className="info-row">
                  <span className="label">Teaching Upto:</span>
                  <span className="value">{coach.can_teach_upto}</span>
                </div>
                <div className="info-row">
                  <span className="label">Weekly Hours ({coach.emp_type}):</span>
                  <span className="value font-bold" style={{ color: isWeeklyExceeded ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                    {currentWeeklyHours} / {maxWeeklyLimit} hrs {isWeeklyExceeded && '⚠️ Limit Reached'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Daily Capacity Load:</span>
                  <span className="value font-bold" style={{ color: isOverCapacity ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                    {currentDailyLoad} / {coach.max_daily_classes || 8} classes (Capacity Left: {remainingClassCapacity} Cls | {remainingDemoCapacity} Demos)
                  </span>
                </div>

                {/* Daily Availability breakdown */}
                <div className="availability-days-list">
                  <span className="label">Matched Slots:</span>
                  <div className="day-status-pills">
                    {matchingSlots.map((s: any, idx: number) => {
                      const isPurple = s.status_type === 'BATCH_LEVEL_BREAK' || s.status_type === 'INACTIVE';
                      return (
                        <span key={idx} className={`status-pill ${isPurple ? 'purple' : 'green'}`}>
                          {s.day_of_week.slice(0, 3)} {s.start_time}: {isPurple ? 'Level Break' : 'Free'}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="card-footer">
                <button
                  type="button"
                  className="btn-primary full-width"
                  style={isOverCapacity ? { background: 'linear-gradient(135deg, #ef4444, #b91c1c)', borderColor: '#ef4444' } : undefined}
                  onClick={() => {
                    if (isOverCapacity) {
                      if (!confirm(`Warning: ${coach.display_name} is currently at or over their daily capacity class limit. Are you sure you want to override this limit and assign this batch?`)) {
                        return;
                      }
                    }
                    onBookSearchResult(coach, slotRequirements.map(r => r.day), slotRequirements[0].time, '6:00 PM');
                  }}
                >
                  <Check className="icon-sm" /> {isOverCapacity ? 'Force Assign (Over Capacity)' : 'Assign Batch to Coach'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
