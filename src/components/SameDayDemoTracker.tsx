import React, { useState, useMemo } from 'react';
import type { Coach, Slot, SameDayDemoRequest } from '../types';
import { INITIAL_SAME_DAY_DEMO_REQUESTS } from '../mockSameDayDemoData';
import { Search, Filter, Plus, CheckCircle, Clock, AlertCircle, UserCheck, ShieldCheck, X } from 'lucide-react';
import './CoachProfile.css';

interface SameDayDemoTrackerProps {
  coaches: Coach[];
  slots: Slot[];
}

export const SameDayDemoTracker: React.FC<SameDayDemoTrackerProps> = ({
  coaches
}) => {
  // Requests State
  const [requests, setRequests] = useState<SameDayDemoRequest[]>(INITIAL_SAME_DAY_DEMO_REQUESTS);

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // New Request Modal State (Sales Side)
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState<boolean>(false);
  const [newRequestForm, setNewRequestForm] = useState<{
    student_name: string;
    sales_person_name: string;
    country_name: string;
    slot_requested: string;
    sales_remark: string;
    coach_preference: string;
  }>({
    student_name: '',
    sales_person_name: '',
    country_name: 'India',
    slot_requested: '',
    sales_remark: '',
    coach_preference: ''
  });

  // Ops Assign Coach Modal State (Operations Side)
  const [assigningRequest, setAssigningRequest] = useState<SameDayDemoRequest | null>(null);
  const [assignForm, setAssignForm] = useState<{
    coach_id: number | '';
    slot_allotted: string;
    demo_no: string;
    demo_status: 'Assigned on Portal' | 'Not Update on portal' | 'Pending' | 'Released';
    operations_remark: string;
    sales_confirmation: 'Pending' | 'Confirm' | 'Rejected';
  }>({
    coach_id: '',
    slot_allotted: '',
    demo_no: '',
    demo_status: 'Assigned on Portal',
    operations_remark: 'Assigned on portal',
    sales_confirmation: 'Confirm'
  });

  // Filtered Requests
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSrn = req.srn_no.toLowerCase().includes(q);
        const matchStudent = req.student_name.toLowerCase().includes(q);
        const matchSales = req.sales_person_name.toLowerCase().includes(q);
        const matchCountry = req.country_name.toLowerCase().includes(q);
        const matchCoach = (req.coach_assigned_name || '').toLowerCase().includes(q);
        const matchDemoNo = (req.demo_no || '').toLowerCase().includes(q);
        if (!matchSrn && !matchStudent && !matchSales && !matchCountry && !matchCoach && !matchDemoNo) return false;
      }

      // 2. Country Filter
      if (countryFilter !== 'ALL' && req.country_name.toLowerCase() !== countryFilter.toLowerCase()) {
        return false;
      }

      // 3. Status Filter
      if (statusFilter !== 'ALL' && req.demo_status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [requests, searchQuery, countryFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    let pending = 0;
    let assigned = 0;
    let notUpdated = 0;
    let released = 0;

    requests.forEach(r => {
      if (r.demo_status === 'Pending') pending++;
      else if (r.demo_status === 'Assigned on Portal') assigned++;
      else if (r.demo_status === 'Not Update on portal') notUpdated++;
      else if (r.demo_status === 'Released') released++;
    });

    return {
      total: requests.length,
      pending,
      assigned,
      notUpdated,
      released
    };
  }, [requests]);

  // Submit New Request (Sales)
  const handleCreateNewRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `sdd-${Date.now()}`;
    const nextSrnNum = 115450 + requests.length;
    const newSrn = `SRN${nextSrnNum}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const newReq: SameDayDemoRequest = {
      id: newId,
      srn_no: newSrn,
      demo_date: todayStr,
      student_name: newRequestForm.student_name,
      sales_person_name: newRequestForm.sales_person_name,
      country_name: newRequestForm.country_name,
      slot_requested: newRequestForm.slot_requested,
      sales_remark: newRequestForm.sales_remark,
      coach_preference: newRequestForm.coach_preference,
      sales_confirmation: 'Pending',
      demo_status: 'Pending',
      created_at: new Date().toISOString()
    };

    setRequests([newReq, ...requests]);
    setIsNewRequestModalOpen(false);
    setNewRequestForm({
      student_name: '',
      sales_person_name: '',
      country_name: 'India',
      slot_requested: '',
      sales_remark: '',
      coach_preference: ''
    });
  };

  // Open Ops Assign Coach Modal
  const handleOpenAssignModal = (req: SameDayDemoRequest) => {
    setAssigningRequest(req);
    const existingCoach = coaches.find(c => c.display_name === req.coach_assigned_name);
    setAssignForm({
      coach_id: existingCoach ? existingCoach.id : '',
      slot_allotted: req.slot_allotted || '',
      demo_no: req.demo_no || `Demo-${Math.floor(70000 + Math.random() * 2000)}`,
      demo_status: req.demo_status === 'Pending' ? 'Assigned on Portal' : req.demo_status,
      operations_remark: req.operations_remark || 'Assigned on portal',
      sales_confirmation: req.sales_confirmation === 'Pending' ? 'Confirm' : req.sales_confirmation
    });
  };

  // Save Ops Coach Allocation
  const handleSaveAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningRequest) return;

    const selectedCoach = coaches.find(c => c.id === assignForm.coach_id);

    setRequests(prev => prev.map(r => {
      if (r.id === assigningRequest.id) {
        return {
          ...r,
          demo_no: assignForm.demo_no,
          slot_allotted: assignForm.slot_allotted,
          coach_assigned_id: selectedCoach ? selectedCoach.id : undefined,
          coach_assigned_name: selectedCoach ? selectedCoach.display_name : r.coach_assigned_name,
          demo_status: assignForm.demo_status,
          operations_remark: assignForm.operations_remark,
          sales_confirmation: assignForm.sales_confirmation
        };
      }
      return r;
    }));

    setAssigningRequest(null);
  };

  // Mark Request as Released (Cancelled by Sales)
  const handleReleaseRequest = (reqId: string) => {
    if (window.confirm('Are you sure you want to mark this demo requirement as Released / Cancelled?')) {
      setRequests(prev => prev.map(r => {
        if (r.id === reqId) {
          return {
            ...r,
            demo_status: 'Released',
            operations_remark: 'Released by Sales'
          };
        }
        return r;
      }));
    }
  };

  return (
    <div className="audit-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header Banner */}
      <div className="section-header-card shadow-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--accent-gold)' }}>
        <div className="header-icon-box" style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6' }}>
          <span style={{ fontSize: '1.8rem' }}>⚡</span>
        </div>
        <div className="header-text-box" style={{ flex: 1 }}>
          <h2>Same-Day Demo Requirement Tracker</h2>
          <p>
            Real-time operational tracker for high-priority &amp; urgent demo booking requests raised by Sales / RMs (1–2 hour turn-around).
            Sales submits requirements, Operations filters matching coaches from Master Schedule, allocates slots, confirms coach status, and updates Salesforce Portal.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsNewRequestModalOpen(true)}
          className="btn-primary shadow-md"
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)', fontSize: '0.88rem', padding: '0.65rem 1.1rem' }}
        >
          <Plus className="icon-sm" /> ➕ Submit Same-Day Request
        </button>
      </div>

      {/* KPI Metrics Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="summary-metric-box shadow-sm" style={{ borderColor: 'var(--accent-gold)' }}>
          <div className="metric-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.2)' }}>
            <Clock className="icon-gold" />
          </div>
          <div>
            <span className="metric-count" style={{ color: 'var(--accent-gold)' }}>{stats.total}</span>
            <span className="metric-desc">Total Same-Day Requirements</span>
          </div>
        </div>

        <div className="summary-metric-box shadow-sm" style={{ borderColor: '#eab308' }}>
          <div className="metric-icon-wrap" style={{ background: 'rgba(234, 179, 8, 0.2)' }}>
            <AlertCircle className="icon" style={{ color: '#eab308' }} />
          </div>
          <div>
            <span className="metric-count" style={{ color: '#eab308' }}>{stats.pending}</span>
            <span className="metric-desc">⏳ Pending Ops Allocation</span>
          </div>
        </div>

        <div className="summary-metric-box green-border shadow-sm">
          <div className="metric-icon-wrap green-bg">
            <CheckCircle className="icon text-green" />
          </div>
          <div>
            <span className="metric-count text-green">{stats.assigned}</span>
            <span className="metric-desc">🟢 Assigned on Portal</span>
          </div>
        </div>

        <div className="summary-metric-box red-border shadow-sm">
          <div className="metric-icon-wrap red-bg">
            <UserCheck className="icon text-red" />
          </div>
          <div>
            <span className="metric-count text-red">{stats.notUpdated}</span>
            <span className="metric-desc">🔴 Not Updated on Portal</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card-glass" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '280px', flex: 1 }}>
            <Search className="icon-sm text-muted" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search SRN, Demo No, Student Name, Sales Person, Coach..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="text-input"
              style={{ paddingLeft: '2.2rem', fontSize: '0.85rem', width: '100%' }}
            />
          </div>

          {/* Country Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter className="icon-xs text-muted" />
            <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Country:</span>
            <select
              value={countryFilter}
              onChange={e => setCountryFilter(e.target.value)}
              className="select-input-sm"
            >
              <option value="ALL">All Countries</option>
              <option value="India">🇮🇳 India</option>
              <option value="USA">🇺🇸 USA</option>
              <option value="UK">🇬🇧 UK</option>
              <option value="AUS">🇦🇺 AUS</option>
              <option value="SIN">🇸🇬 SIN</option>
              <option value="UAE">🇦🇪 UAE</option>
              <option value="Other Countries">🌍 Other Countries</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="select-input-sm"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">⏳ Pending Ops Allocation</option>
              <option value="Assigned on Portal">🟢 Assigned on Portal</option>
              <option value="Not Update on portal">🔴 Not Update on portal</option>
              <option value="Released">⚪ Released / Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Same-Day Demo Requirements Table (Matching Screenshot 2 Specs) */}
      <div className="card-glass" style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              {/* Top Group Headers */}
              <tr>
                <th colSpan={9} style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', textAlign: 'center', fontSize: '0.88rem', fontWeight: 'bold', padding: '0.5rem', borderRight: '2px solid var(--border-color)' }}>
                  📋 Sales &amp; Demo Requirement Inputs (Salesperson / RM)
                </th>
                <th colSpan={5} style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', textAlign: 'center', fontSize: '0.88rem', fontWeight: 'bold', padding: '0.5rem' }}>
                  ⚙️ Operations Allocation &amp; Portal Sync (Ops Team)
                </th>
              </tr>
              {/* Column Headings */}
              <tr style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)', fontWeight: 'bold' }}>
                <th style={{ padding: '0.65rem', borderRight: '1px solid var(--border-color)' }}>SRN No.</th>
                <th style={{ padding: '0.65rem', borderRight: '1px solid var(--border-color)' }}>Demo No</th>
                <th style={{ padding: '0.65rem', borderRight: '1px solid var(--border-color)' }}>Demo Date</th>
                <th style={{ padding: '0.65rem', borderRight: '1px solid var(--border-color)' }}>Salesperson</th>
                <th style={{ padding: '0.65rem', borderRight: '1px solid var(--border-color)' }}>Country</th>
                <th style={{ padding: '0.65rem', borderRight: '1px solid var(--border-color)' }}>Slot Requested</th>
                <th style={{ padding: '0.65rem', borderRight: '1px solid var(--border-color)', minWidth: '160px' }}>Sales Remark</th>
                <th style={{ padding: '0.65rem', borderRight: '1px solid var(--border-color)' }}>Coach Preference</th>
                <th style={{ padding: '0.65rem', borderRight: '2px solid var(--border-color)' }}>Sales Confirm</th>

                {/* Operations Section */}
                <th style={{ padding: '0.65rem', borderRight: '1px solid var(--border-color)' }}>Slot Allotted</th>
                <th style={{ padding: '0.65rem', borderRight: '1px solid var(--border-color)', minWidth: '150px' }}>Coach Assigned</th>
                <th style={{ padding: '0.65rem', borderRight: '1px solid var(--border-color)' }}>Demo Status</th>
                <th style={{ padding: '0.65rem', borderRight: '1px solid var(--border-color)' }}>Ops Remark</th>
                <th style={{ padding: '0.65rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={14} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No same-day demo requests found matching active filters.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req, idx) => {
                  const isPending = req.demo_status === 'Pending';
                  const isAssigned = req.demo_status === 'Assigned on Portal';
                  const isNotUpdated = req.demo_status === 'Not Update on portal';
                  const isReleased = req.demo_status === 'Released';

                  return (
                    <tr
                      key={req.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        background: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)'
                      }}
                    >
                      {/* SRN No */}
                      <td className="font-mono font-bold" style={{ padding: '0.65rem', borderRight: '1px solid var(--border-color)' }}>
                        {req.srn_no}
                      </td>

                      {/* Demo No */}
                      <td className="font-mono" style={{ padding: '0.65rem', borderRight: '1px solid var(--border-color)', color: req.demo_no ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
                        {req.demo_no || '—'}
                      </td>

                      {/* Demo Date */}
                      <td style={{ padding: '0.65rem', borderRight: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>
                        <span className="badge-pill yellow" style={{ fontSize: '0.72rem' }}>
                          {req.demo_date}
                        </span>
                      </td>

                      {/* Sales Person */}
                      <td style={{ padding: '0.65rem', borderRight: '1px solid var(--border-color)', fontWeight: 600 }}>
                        {req.sales_person_name}
                      </td>

                      {/* Country */}
                      <td style={{ padding: '0.65rem', borderRight: '1px solid var(--border-color)' }}>
                        <span className="badge-pill blue" style={{ fontSize: '0.72rem' }}>
                          {req.country_name}
                        </span>
                      </td>

                      {/* Slot Requested */}
                      <td className="font-mono font-bold" style={{ padding: '0.65rem', borderRight: '1px solid var(--border-color)', color: '#3b82f6' }}>
                        {req.slot_requested}
                      </td>

                      {/* Sales Remark */}
                      <td style={{ padding: '0.65rem', borderRight: '1px solid var(--border-color)', fontSize: '0.78rem' }}>
                        {req.sales_remark ? (
                          <span style={{ background: 'rgba(245, 158, 11, 0.12)', padding: '0.2rem 0.4rem', borderRadius: '4px', color: 'var(--text-main)' }}>
                            💬 {req.sales_remark}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>

                      {/* Coach Preference */}
                      <td style={{ padding: '0.65rem', borderRight: '1px solid var(--border-color)', fontSize: '0.78rem' }}>
                        {req.coach_preference || <span className="text-muted">—</span>}
                      </td>

                      {/* Sales Confirmation */}
                      <td style={{ padding: '0.65rem', borderRight: '2px solid var(--border-color)', textAlign: 'center' }}>
                        {req.sales_confirmation === 'Confirm' ? (
                          <span className="badge-pill green" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
                            Confirm
                          </span>
                        ) : (
                          <span className="badge-pill yellow" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Operations Section */}
                      {/* Slot Allotted */}
                      <td className="font-mono font-bold" style={{ padding: '0.65rem', borderRight: '1px solid var(--border-color)', textAlign: 'center', color: req.slot_allotted ? '#10b981' : 'var(--text-muted)' }}>
                        {req.slot_allotted || '—'}
                      </td>

                      {/* Coach Assigned */}
                      <td style={{ padding: '0.65rem', borderRight: '1px solid var(--border-color)', fontWeight: 700 }}>
                        {req.coach_assigned_name ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span>👑</span>
                            <span style={{ color: 'var(--text-main)' }}>{req.coach_assigned_name}</span>
                          </div>
                        ) : (
                          <span className="text-muted" style={{ fontStyle: 'italic' }}>Pending Allocation</span>
                        )}
                      </td>

                      {/* Demo Status */}
                      <td style={{ padding: '0.65rem', borderRight: '1px solid var(--border-color)', textAlign: 'center' }}>
                        {isAssigned && (
                          <span style={{ background: '#10b981', color: '#ffffff', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 'bold' }}>
                            Assigned on Portal
                          </span>
                        )}
                        {isNotUpdated && (
                          <span style={{ background: '#ef4444', color: '#ffffff', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 'bold' }}>
                            Not Update on portal
                          </span>
                        )}
                        {isPending && (
                          <span style={{ background: '#f59e0b', color: '#ffffff', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 'bold' }}>
                            Pending
                          </span>
                        )}
                        {isReleased && (
                          <span style={{ background: '#64748b', color: '#ffffff', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 'bold' }}>
                            Released
                          </span>
                        )}
                      </td>

                      {/* Ops Remark */}
                      <td style={{ padding: '0.65rem', borderRight: '1px solid var(--border-color)', fontSize: '0.78rem' }}>
                        {req.operations_remark || <span className="text-muted">—</span>}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.65rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenAssignModal(req)}
                            className="btn-primary-sm"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                            title="Assign Coach & Allot Slot"
                          >
                            <UserCheck className="icon-xs" /> Assign
                          </button>
                          {!isReleased && (
                            <button
                              type="button"
                              onClick={() => handleReleaseRequest(req.id)}
                              className="btn-secondary-sm"
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.4rem', color: '#ef4444' }}
                              title="Release / Cancel Request"
                            >
                              Release
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Submit New Same-Day Request (Sales Side) */}
      {isNewRequestModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-card shadow-2xl" style={{ maxWidth: '520px', background: 'var(--bg-card)', border: '1px solid var(--accent-gold)', borderRadius: '14px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>➕ Submit Same-Day Demo Requirement</h3>
              <button type="button" onClick={() => setIsNewRequestModalOpen(false)} className="btn-secondary" style={{ padding: '0.2rem 0.5rem' }}>
                <X className="icon-sm" />
              </button>
            </div>

            <form onSubmit={handleCreateNewRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label font-bold">Student Name / ID:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Advik Tripathi"
                    value={newRequestForm.student_name}
                    onChange={e => setNewRequestForm({ ...newRequestForm, student_name: e.target.value })}
                    className="text-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label font-bold">Salesperson / RM Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jeenal"
                    value={newRequestForm.sales_person_name}
                    onChange={e => setNewRequestForm({ ...newRequestForm, sales_person_name: e.target.value })}
                    className="text-input"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label font-bold">Target Country:</label>
                  <select
                    value={newRequestForm.country_name}
                    onChange={e => setNewRequestForm({ ...newRequestForm, country_name: e.target.value })}
                    className="select-input"
                  >
                    <option value="India">🇮🇳 India</option>
                    <option value="USA">🇺🇸 USA</option>
                    <option value="UK">🇬🇧 UK</option>
                    <option value="AUS">🇦🇺 Australia (AUS)</option>
                    <option value="SIN">🇸🇬 Singapore (SIN)</option>
                    <option value="UAE">🇦🇪 UAE</option>
                    <option value="Other Countries">🌍 Other Countries</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label font-bold">Slot Requested (Time Bracket):</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 6-8pm, 5pm to 6pm, 09:00"
                    value={newRequestForm.slot_requested}
                    onChange={e => setNewRequestForm({ ...newRequestForm, slot_requested: e.target.value })}
                    className="text-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label font-bold">Sales Remarks / Constraints:</label>
                <input
                  type="text"
                  placeholder="e.g. good friendly interactive coach, chess.com 1200, 2 kids"
                  value={newRequestForm.sales_remark}
                  onChange={e => setNewRequestForm({ ...newRequestForm, sales_remark: e.target.value })}
                  className="text-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label font-bold">Coach Preference (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. Tushar S, Senior Coach"
                  value={newRequestForm.coach_preference}
                  onChange={e => setNewRequestForm({ ...newRequestForm, coach_preference: e.target.value })}
                  className="text-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsNewRequestModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Submit Urgent Requirement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Ops Coach Allocation Modal (Operations Side) */}
      {assigningRequest && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-card shadow-2xl" style={{ maxWidth: '580px', background: 'var(--bg-card)', border: '1px solid var(--accent-gold)', borderRadius: '14px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>👑 Assign Coach &amp; Update Salesforce</h3>
              <button type="button" onClick={() => setAssigningRequest(null)} className="btn-secondary" style={{ padding: '0.2rem 0.5rem' }}>
                <X className="icon-sm" />
              </button>
            </div>

            {/* Request Summary Box */}
            <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                <span>SRN: <strong>{assigningRequest.srn_no}</strong></span>
                <span>Student: <strong>{assigningRequest.student_name}</strong></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                <span>Country: <strong>{assigningRequest.country_name}</strong></span>
                <span>Slot Requested: <strong style={{ color: '#3b82f6' }}>{assigningRequest.slot_requested}</strong></span>
              </div>
              {assigningRequest.sales_remark && (
                <div style={{ color: 'var(--accent-gold)', fontStyle: 'italic', marginTop: '0.2rem' }}>
                  Sales Remark: "{assigningRequest.sales_remark}"
                </div>
              )}
            </div>

            <form onSubmit={handleSaveAllocation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label font-bold">Select Available Coach:</label>
                <select
                  value={assignForm.coach_id}
                  onChange={e => setAssignForm({ ...assignForm, coach_id: Number(e.target.value) })}
                  required
                  className="select-input"
                >
                  <option value="">-- Choose Coach from Master Schedule --</option>
                  {coaches.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.display_name} (FIDE {c.standard_rating} | {c.can_teach_upto} | {c.emp_type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label font-bold">Demo ID / No.:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Demo-71559"
                    value={assignForm.demo_no}
                    onChange={e => setAssignForm({ ...assignForm, demo_no: e.target.value })}
                    className="text-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label font-bold">Exact Slot Allotted:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 19:30, 21:10, 15:55"
                    value={assignForm.slot_allotted}
                    onChange={e => setAssignForm({ ...assignForm, slot_allotted: e.target.value })}
                    className="text-input"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label font-bold">Salesforce Demo Status:</label>
                  <select
                    value={assignForm.demo_status}
                    onChange={e => setAssignForm({ ...assignForm, demo_status: e.target.value as any })}
                    className="select-input"
                  >
                    <option value="Assigned on Portal">🟢 Assigned on Portal</option>
                    <option value="Not Update on portal">🔴 Not Update on portal</option>
                    <option value="Pending">⏳ Pending</option>
                    <option value="Released">⚪ Released</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label font-bold">Salesperson Confirmation:</label>
                  <select
                    value={assignForm.sales_confirmation}
                    onChange={e => setAssignForm({ ...assignForm, sales_confirmation: e.target.value as any })}
                    className="select-input"
                  >
                    <option value="Confirm">✅ Confirm</option>
                    <option value="Pending">⏳ Pending</option>
                    <option value="Rejected">❌ Rejected</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label font-bold">Operations Remarks:</label>
                <input
                  type="text"
                  placeholder="e.g. Assigned on portal, 40 min, IMP DEMO"
                  value={assignForm.operations_remark}
                  onChange={e => setAssignForm({ ...assignForm, operations_remark: e.target.value })}
                  className="text-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setAssigningRequest(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                  <ShieldCheck className="icon-sm" /> Save &amp; Sync to Salesforce
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
