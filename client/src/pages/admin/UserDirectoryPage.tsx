import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { User, UserRole } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Users, Search, RefreshCw, Shield, UserX, UserCheck } from 'lucide-react';

export const UserDirectoryPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ users: User[] }>('/admin/users');
      setUsers(res.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const targetStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const confirmChange = window.confirm(`Are you sure you want to change user status to "${targetStatus}"?`);
    if (!confirmChange) return;

    setActionLoading(userId);
    try {
      await api.post(`/admin/users/${userId}/status`, { status: targetStatus });
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                          u.email.toLowerCase().includes(search.toLowerCase()) ||
                          u.mobile.includes(search);
    if (roleFilter !== 'All') return matchesSearch && u.role === roleFilter.toLowerCase();
    return matchesSearch;
  });

  return (
    <div className="container" style={{ maxWidth: '1050px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.8rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Hostel User Directory & Access Control</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Total registered accounts across students, food vendors, delivery couriers, and administrators
          </span>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={fetchUsers}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.4rem' }}
            placeholder="Search by student name, roll/email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {['All', 'Student', 'Vendor', 'Delivery', 'Admin'].map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: `1px solid ${roleFilter === r ? 'var(--primary)' : 'var(--border)'}`,
                backgroundColor: roleFilter === r ? 'var(--primary)' : '#ffffff',
                color: roleFilter === r ? '#ffffff' : 'var(--text-main)',
                cursor: 'pointer'
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading user records...
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '0.75rem 1rem' }}>User Name</th>
                <th style={{ padding: '0.75rem 1rem' }}>Role</th>
                <th style={{ padding: '0.75rem 1rem' }}>University Email / Mobile</th>
                <th style={{ padding: '0.75rem 1rem' }}>Hostel Block/Room</th>
                <th style={{ padding: '0.75rem 1rem' }}>Wallet Balance</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{u.name}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className={`role-pill ${u.role}`}>{u.role}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div>{u.email}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.mobile}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {u.hostel_block ? `${u.hostel_block} - ${u.room_number || ''}` : 'Campus Facility'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>
                    ₹{Number(u.wallet_balance || 0).toFixed(2)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <StatusBadge status={u.status} />
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    {u.role !== 'admin' && (
                      <button
                        type="button"
                        className={`btn btn-sm ${u.status === 'active' ? 'btn-secondary' : 'btn-primary'}`}
                        disabled={actionLoading === u.id}
                        onClick={() => handleToggleStatus(u.id, u.status)}
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                      >
                        {u.status === 'active' ? <UserX size={12} /> : <UserCheck size={12} />}
                        <span>{u.status === 'active' ? 'Suspend' : 'Activate'}</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
