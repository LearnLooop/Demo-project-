import React, { useState, useEffect } from 'react';
import { studentsAPI } from '../services/api';

const AVATAR_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
];

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await studentsAPI.getAll();
        setStudents(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="page-content">
      <div className="page-header animate-in animate-in-1">
        <h1>Students</h1>
        <p>Overview of all enrolled students across your courses</p>
      </div>
      <div className="card animate-in animate-in-2" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Progress</th>
              <th>Risk Level</th>
              <th>Weakest Skill</th>
              <th>Weekly Time</th>
              <th>Last Active</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr><td colSpan="6" style={{textAlign: "center", padding: "20px"}}>No students found.</td></tr>
            ) : students.map(s => (
              <tr key={s.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      className="avatar-placeholder avatar-placeholder-sm"
                      style={{ background: AVATAR_COLORS[s.id?.charCodeAt(0) % AVATAR_COLORS.length] || AVATAR_COLORS[0] }}
                    >
                      {s.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--color-text)', margin: 0, fontSize: 14 }}>{s.name}</p>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: 12, margin: 0 }}>{s.email}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="progress-track" style={{ flex: 1, height: 4 }}>
                      <div className="progress-fill" style={{ width: `${s.progress || 0}%` }} />
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                      {s.progress || 0}%
                    </span>
                  </div>
                </td>
                <td>
                  <span className={`badge ${
                    s.riskLevel === 'high' ? 'badge-error' :
                    s.riskLevel === 'moderate' ? 'badge-warning' : 'badge-success'
                  }`}>
                    {s.riskLevel === 'high' ? '⚠ High Risk' : s.riskLevel === 'moderate' ? '○ Moderate' : '✓ On Track'}
                  </span>
                </td>
                <td><span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{s.weakest || 'N/A'}</span></td>
                <td>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{s.weeklyTime || 0}h</span>
                </td>
                <td>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {s.lastActive || 'Never'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
