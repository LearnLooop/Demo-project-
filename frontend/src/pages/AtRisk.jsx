import React, { useState, useEffect } from 'react';
import { X, Send, BookOpen, AlertTriangle, Clock, TrendingDown, Mail } from 'lucide-react';
import { studentsAPI, messagesAPI } from '../services/api';
import useStore from '../store/useStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useForm } from 'react-hook-form';

const AVATAR_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
];

const WEEKLY_PROGRESS = [
  { week: 'W1', quizScore: 78 }, { week: 'W2', quizScore: 82 },
  { week: 'W3', quizScore: 76 }, { week: 'W4', quizScore: 85 }
];

function RiskBadge({ level }) {
  const styles = {
    high:     { bg: 'rgba(239,68,68,0.15)',  color: 'var(--color-error)',   label: '⚠ High Risk' },
    moderate: { bg: 'rgba(245,158,11,0.15)', color: 'var(--color-accent)',  label: '○ Moderate' },
    good:     { bg: 'rgba(16,185,129,0.12)', color: 'var(--color-primary)', label: '✓ On Track' },
  };
  const s = styles[level] || styles.good;
  return (
    <span className="badge" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function StudentDrawer({ student, onClose }) {
  const { register, handleSubmit, reset } = useForm();
  const { openChatWith } = useStore();
  const [sent, setSent] = useState(false);
  if (!student) return null;

  const onSendNudge = async (data) => {
    try {
      await messagesAPI.sendMessage(student.id, data.message);
      setSent(true);
      setTimeout(() => { 
        setSent(false); 
        reset(); 
        onClose();
        openChatWith({ id: student.id, name: student.name, role: 'student', avatar: student.avatar, lastActive: student.lastActive, progress: student.progress });
      }, 800);
    } catch (err) {
      console.error(err);
      alert('Failed to send message');
    }
  };

  const weeklyData = WEEKLY_PROGRESS.map((w, i) => ({
    week: w.week,
    score: Math.max(10, w.quizScore - (student.riskLevel === 'high' ? 25 : 10) + Math.floor(Math.random() * 5)),
  }));

  return (
    <div
      className="slide-in-right"
      style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-xl)',
        position: 'sticky',
        top: 80,
        maxHeight: '85vh',
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            className="avatar-placeholder avatar-placeholder-md"
            style={{ background: AVATAR_COLORS[student.id?.charCodeAt(0) % AVATAR_COLORS.length] || AVATAR_COLORS[0] }}
          >
            {student.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 15 }}>{student.name}</h3>
            <RiskBadge level={student.riskLevel} />
          </div>
        </div>
        <button className="btn-icon" onClick={onClose} aria-label="Close drawer">
          <X size={18} />
        </button>
      </div>

      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>QUIZ SCORE TREND</p>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="week" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6 }}
              itemStyle={{ color: 'var(--color-primary)' }}
              labelStyle={{ color: 'var(--color-text-muted)' }}
            />
            <Line
              type="monotone" dataKey="score" stroke="var(--color-error)"
              strokeWidth={2} dot={{ fill: 'var(--color-error)', r: 3 }}
              name="Score"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
        {[
          { label: 'Progress', value: `${student.progress || 0}%`, icon: <TrendingDown size={14} /> },
          { label: 'Weekly Time', value: `${student.weeklyTime || 0}h`, icon: <Clock size={14} /> },
          { label: 'Last Active', value: student.lastActive || 'N/A', icon: <Clock size={14} /> },
          { label: 'Weakest Skill', value: student.weakest || 'N/A', icon: <AlertTriangle size={14} /> },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--color-bg-elevated)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-sm) var(--space-md)',
          }}>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: '0 0 2px' }}>{s.label}</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="divider" />

      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-sm)' }}>
          <Mail size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Send Nudge
        </p>
        <form onSubmit={handleSubmit(onSendNudge)}>
          <textarea
            className="form-textarea"
            style={{ minHeight: 80, marginBottom: 'var(--space-sm)', fontSize: 13 }}
            placeholder={`Hi ${student.name?.split(' ')[0] || 'there'}, I noticed you've been struggling...`}
            {...register('message')}
          />
          <button
            type="submit"
            className={`btn ${sent ? 'btn-primary' : 'btn-primary'} btn-sm`}
            id={`send-nudge-${student.id}-btn`}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {sent ? '✓ Sent!' : <><Send size={14} /> Send Nudge</>}
          </button>
        </form>
      </div>

      <div style={{ marginTop: 'var(--space-md)', display: 'flex', gap: 'var(--space-sm)' }}>
        <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
          <BookOpen size={14} /> Assign Chapter
        </button>
        <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
          View Profile
        </button>
      </div>
    </div>
  );
}

export default function AtRisk() {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [filter, setFilter] = useState('all');
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

  const filtered = filter === 'all' ? students : students.filter(s => s.riskLevel === filter);
  const highCount = students.filter(s => s.riskLevel === 'high').length;
  const modCount  = students.filter(s => s.riskLevel === 'moderate').length;
  const goodCount = students.filter(s => s.riskLevel === 'good').length;

  if (loading) return <div>Loading at-risk dashboard...</div>;

  return (
    <div className="page-content">
      <div className="page-header animate-in animate-in-1">
        <h1>At-Risk Student Dashboard</h1>
        <p>Identify struggling students and take targeted action before they fall behind</p>
      </div>

      <div className="grid-3" style={{ marginBottom: 'var(--space-xl)' }}>
        {[
          { label: 'High Risk',  count: highCount, color: 'var(--color-error)',   bg: 'rgba(239,68,68,0.12)',  icon: '🔴' },
          { label: 'Moderate',   count: modCount,  color: 'var(--color-accent)',  bg: 'rgba(245,158,11,0.12)', icon: '🟡' },
          { label: 'On Track',   count: goodCount, color: 'var(--color-primary)', bg: 'rgba(16,185,129,0.12)', icon: '🟢' },
        ].map((s, i) => (
          <button
            key={s.label}
            id={`filter-${s.label.toLowerCase().replace(' ','-')}-btn`}
            onClick={() => setFilter(s.label === 'High Risk' ? 'high' : s.label === 'Moderate' ? 'moderate' : 'good')}
            className={`card animate-in animate-in-${i + 2}`}
            style={{
              textAlign: 'center',
              border: filter === (s.label === 'High Risk' ? 'high' : s.label === 'Moderate' ? 'moderate' : 'good')
                ? `2px solid ${s.color}` : '1px solid var(--color-border)',
              cursor: 'pointer',
              background: s.bg,
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 32, fontWeight: 800, color: s.color }}>
              {s.count}
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{s.label}</div>
          </button>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: selectedStudent ? '1fr 340px' : '1fr',
        gap: 'var(--space-xl)',
        alignItems: 'start',
      }}>
        <div className="card animate-in animate-in-3" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>Student List</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {['all', 'high', 'moderate', 'good'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                  id={`filter-${f}-tab`}
                >
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Risk Level</th>
                <th>Progress</th>
                <th>Weakest Skill</th>
                <th>Last Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="6" style={{textAlign: "center", padding: "20px"}}>No students found in this category.</td></tr>
              ) : filtered.map(student => (
                <tr
                  key={student.id}
                  onClick={() => setSelectedStudent(selectedStudent?.id === student.id ? null : student)}
                  style={{
                    cursor: 'pointer',
                    background: selectedStudent?.id === student.id ? 'rgba(16,185,129,0.05)' : '',
                  }}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        className="avatar-placeholder avatar-placeholder-sm"
                        style={{ background: AVATAR_COLORS[student.id?.charCodeAt(0) % AVATAR_COLORS.length] || AVATAR_COLORS[0] }}
                      >
                        {student.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, color: 'var(--color-text)', margin: 0, fontSize: 14 }}>{student.name}</p>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: 12, margin: 0 }}>{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td><RiskBadge level={student.riskLevel} /></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 100 }}>
                      <div className="progress-track" style={{ flex: 1, height: 4 }}>
                        <div className="progress-fill" style={{ width: `${student.progress || 0}%` }} />
                      </div>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                        {student.progress || 0}%
                      </span>
                    </div>
                  </td>
                  <td><span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{student.weakest || 'N/A'}</span></td>
                  <td>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {student.lastActive || 'Never'}
                    </span>
                  </td>
                  <td>
                    <button
                      id={`view-student-${student.id}-btn`}
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStudent(selectedStudent?.id === student.id ? null : student);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedStudent && (
          <StudentDrawer student={selectedStudent} onClose={() => setSelectedStudent(null)} />
        )}
      </div>
    </div>
  );
}
