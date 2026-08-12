import React, { useState } from 'react';
import type { UserAccount, Role } from '../types';
import { 
  getRegisteredUsers, 
  saveRegisteredUsers, 
  getRoleTitle 
} from '../utils/userStorage';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Briefcase, 
  TrendingUp, 
  Eye, 
  EyeOff, 
  Trash2, 
  Edit3, 
  Key, 
  Check, 
  X
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserAccount[]>(getRegisteredUsers);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('manager');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const cleanUsername = username.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword || !cleanName) {
      setFormError('All fields (Username, Password, Full Name) are required.');
      return;
    }

    if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
      setFormError(`Username "${cleanUsername}" already exists. Please choose a different username.`);
      return;
    }

    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      username: cleanUsername,
      password: cleanPassword,
      name: cleanName,
      role,
      createdAt: new Date().toISOString().slice(0, 10)
    };

    const updated = [...users, newUser];
    setUsers(updated);
    saveRegisteredUsers(updated);

    setUsername('');
    setPassword('');
    setFullName('');
    setFormSuccess(`✅ Success! Created new user account for "${cleanName}" (@${cleanUsername}) as ${getRoleTitle(role)}.`);
  };

  const handleDeleteUser = (userId: string, targetUsername: string) => {
    if (targetUsername.toLowerCase() === 'admin') {
      alert('The primary System Admin account (@admin) cannot be deleted.');
      return;
    }
    if (confirm(`Are you sure you want to delete user account @${targetUsername}? This user will no longer be able to log in.`)) {
      const updated = users.filter(u => u.id !== userId);
      setUsers(updated);
      saveRegisteredUsers(updated);
    }
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const updated = users.map(u => u.id === editingUser.id ? editingUser : u);
    setUsers(updated);
    saveRegisteredUsers(updated);
    setEditingUser(null);
  };

  const adminCount = users.filter(u => u.role === 'admin').length;
  const managerCount = users.filter(u => u.role === 'manager').length;
  const salesCount = users.filter(u => u.role === 'salesperson').length;

  return (
    <div className="audit-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header */}
      <div className="section-header-card shadow-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--accent-gold)' }}>
        <div className="header-icon-box" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid var(--accent-gold)' }}>
          <Users size={24} color="var(--accent-gold)" />
        </div>
        <div className="header-text-box" style={{ flex: 1 }}>
          <h2 style={{ margin: 0 }}>User & Credential Management (System Admin Only)</h2>
          <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
            Create, manage & configure access credentials for <strong>System Admins</strong>, <strong>Ops Managers</strong>, and <strong>Sales Representatives</strong>.
          </p>
        </div>
      </div>

      {/* Metrics Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="metric-card-premium shadow-md" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="metric-header">
            <span className="metric-label-premium">Total Registered Users</span>
            <Users size={18} color="#f59e0b" />
          </div>
          <div className="metric-value-premium" style={{ color: '#f59e0b' }}>{users.length}</div>
        </div>

        <div className="metric-card-premium shadow-md" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="metric-header">
            <span className="metric-label-premium">System Admins</span>
            <ShieldCheck size={18} color="#f59e0b" />
          </div>
          <div className="metric-value-premium" style={{ color: '#f59e0b' }}>{adminCount}</div>
        </div>

        <div className="metric-card-premium shadow-md" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div className="metric-header">
            <span className="metric-label-premium">Ops Managers</span>
            <Briefcase size={18} color="#3b82f6" />
          </div>
          <div className="metric-value-premium" style={{ color: '#3b82f6' }}>{managerCount}</div>
        </div>

        <div className="metric-card-premium shadow-md" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="metric-header">
            <span className="metric-label-premium">Sales Representatives</span>
            <TrendingUp size={18} color="#10b981" />
          </div>
          <div className="metric-value-premium" style={{ color: '#10b981' }}>{salesCount}</div>
        </div>
      </div>

      {/* Add New User Form */}
      <div className="card-glass shadow-md" style={{ borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', padding: '1.25rem 1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--accent-gold)' }}>
          <UserPlus size={18} /> Create New User Credential
        </h3>

        {formError && (
          <div className="login-error-banner" style={{ marginBottom: '1rem' }}>
            ⚠️ {formError}
          </div>
        )}

        {formSuccess && (
          <div className="alert-banner green" style={{ marginBottom: '1rem', padding: '0.65rem 0.85rem', fontSize: '0.82rem', borderRadius: '8px' }}>
            {formSuccess}
          </div>
        )}

        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label font-bold">Full Name:</label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="text-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label font-bold">Username:</label>
              <input
                type="text"
                required
                placeholder="e.g. rahul.sharma"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="text-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label font-bold">Password:</label>
              <input
                type="text"
                required
                placeholder="Set password..."
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="text-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label font-bold">Assign Role:</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as Role)}
                className="select-input"
              >
                <option value="admin">👑 System Admin (Full Access)</option>
                <option value="manager">💼 Ops Manager (Grid Booking & Assignments)</option>
                <option value="salesperson">📈 Salesperson (Same-Day Demo ONLY)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
            <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}>
              <UserPlus size={16} /> Save New User Credential
            </button>
          </div>
        </form>
      </div>

      {/* Users List Table */}
      <div className="card-glass shadow-lg" style={{ borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', padding: '1.25rem 1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Key size={18} color="var(--accent-gold)" /> Registered System Credentials ({users.length})
        </h3>

        <div className="table-responsive">
          <table className="custom-table" style={{ width: '100%', fontSize: '0.86rem' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.65rem 0.85rem' }}>Full Name</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Username</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Assigned Role</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Password</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Created Date</th>
                <th style={{ textAlign: 'center', padding: '0.65rem 0.85rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const isVisible = !!visiblePasswords[u.id];
                return (
                  <tr key={u.id}>
                    <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700 }}>{u.name}</td>
                    <td style={{ padding: '0.75rem 0.85rem', fontFamily: 'monospace', color: '#60a5fa' }}>@{u.username}</td>
                    <td style={{ padding: '0.75rem 0.85rem' }}>
                      <span
                        className="badge-pill"
                        style={{
                          background: u.role === 'admin' ? 'rgba(245,158,11,0.18)' : u.role === 'manager' ? 'rgba(59,130,246,0.18)' : 'rgba(16,185,129,0.18)',
                          color: u.role === 'admin' ? '#f59e0b' : u.role === 'manager' ? '#60a5fa' : '#34d399',
                          border: `1px solid ${u.role === 'admin' ? '#f59e0b' : u.role === 'manager' ? '#3b82f6' : '#10b981'}`,
                          fontWeight: 700,
                          fontSize: '0.74rem',
                          padding: '0.2rem 0.6rem'
                        }}
                      >
                        {u.role === 'admin' ? '👑 System Admin' : u.role === 'manager' ? '💼 Ops Manager' : '📈 Sales Representative'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', fontFamily: 'monospace' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{isVisible ? u.password : '••••••••'}</span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(u.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title={isVisible ? "Hide Password" : "Show Password"}
                        >
                          {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{u.createdAt}</td>
                    <td style={{ textAlign: 'center', padding: '0.75rem 0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => setEditingUser(u)}
                          className="btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          title="Edit User"
                        >
                          <Edit3 size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          className="btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                          title="Delete User"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-card shadow-2xl" style={{ maxWidth: '480px', background: 'var(--bg-card)', border: '1px solid var(--accent-gold)', borderRadius: '14px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>✏️ Edit User Credential</h3>
              <button type="button" onClick={() => setEditingUser(null)} className="btn-secondary" style={{ padding: '0.2rem 0.45rem' }}>
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label font-bold">Full Name:</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="text-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label font-bold">Username:</label>
                <input
                  type="text"
                  required
                  value={editingUser.username}
                  onChange={e => setEditingUser({ ...editingUser, username: e.target.value.toLowerCase().trim() })}
                  className="text-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label font-bold">Password:</label>
                <input
                  type="text"
                  required
                  value={editingUser.password}
                  onChange={e => setEditingUser({ ...editingUser, password: e.target.value })}
                  className="text-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label font-bold">Assigned Role:</label>
                <select
                  value={editingUser.role}
                  onChange={e => setEditingUser({ ...editingUser, role: e.target.value as Role })}
                  className="select-input"
                >
                  <option value="admin">👑 System Admin (Full Access)</option>
                  <option value="manager">💼 Ops Manager (Grid Booking & Assignments)</option>
                  <option value="salesperson">📈 Salesperson (Same-Day Demo ONLY)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setEditingUser(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Check size={14} /> Update Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
