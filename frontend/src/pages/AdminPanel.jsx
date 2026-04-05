import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Shield, Users } from 'lucide-react';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAdminData() {
      try {
        const res = await api.get('/api/users/admin/list');
        setUsers(res.data);
      } catch (err) {
        setError(err?.response?.data?.detail || 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    }
    fetchAdminData();
  }, []);

  if (loading) return <div className="page-content">Loading admin panel...</div>;

  return (
    <div className="page-content">
      <div className="page-header animate-in animate-in-1">
        <h1><Shield size={28} style={{ color: 'var(--color-primary)', marginRight: 12, verticalAlign: 'middle' }} />Admin Panel</h1>
        <p>System-wide administration and management</p>
      </div>

      {error && (
        <div className="card animate-in animate-in-2" style={{ color: 'var(--color-error)', marginBottom: 'var(--space-xl)' }}>
          {error}
        </div>
      )}

      <div className="grid-3" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card animate-in animate-in-2">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Users color="var(--color-info)" />
            <h3 style={{ margin: 0 }}>Total Users</h3>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>{users.length}</div>
        </div>
      </div>

      <div className="card animate-in animate-in-3">
        <h3>User Management</h3>
        <table className="data-table" style={{ marginTop: 'var(--space-md)' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan="5">No users found.</td></tr>
            ) : users.map(u => (
              <tr key={u.user_id}>
                <td style={{ fontFamily: 'monospace' }}>{u.user_id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge ${u.role === 'admin' ? 'badge-primary' : u.role === 'instructor' ? 'badge-warning' : 'badge-gray'}`}>
                    {u.role}
                  </span>
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
