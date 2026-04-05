import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { analyticsAPI } from '../services/api';

const COLORS = ['#10B981','#3B82F6','#F59E0B','#8B5CF6','#EF4444','#06B6D4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--color-bg-elevated)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: '8px 12px',
      fontSize: 13,
    }}>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, margin: 0, fontWeight: 600 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    analyticsAPI.getOverview()
      .then(data => setOverview(data))
      .catch(err => setError(err?.response?.data?.detail || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-content"><p>Loading analytics…</p></div>;
  if (error) return <div className="page-content"><p style={{ color: 'var(--color-error)' }}>{error}</p></div>;

  const enrollmentData = (overview?.enrollment_trend || []).map(d => ({
    month: d.month, students: d.students,
  }));

  const weeklyData = (overview?.weekly_progress || []).map(d => ({
    week: d.week, quizScore: d.quiz_score, progress: d.progress,
  }));

  const topCompetencies = [...(overview?.competency_averages || [])]
    .sort((a, b) => b.mastery - a.mastery)
    .slice(0, 8);

  // Derive completion distribution from average progress
  const avgProgress = overview?.average_progress ?? 0;
  const pieData = [
    { name: 'Completed',    value: Math.round(avgProgress >= 90 ? 100 : avgProgress * 0.5) },
    { name: 'In Progress',  value: Math.round(avgProgress < 90 && avgProgress > 0 ? 100 - avgProgress : 0) },
    { name: 'Not Started',  value: Math.max(0, 100 - Math.round(avgProgress >= 90 ? 100 : avgProgress * 0.5) - Math.round(avgProgress < 90 && avgProgress > 0 ? 100 - avgProgress : 0)) },
  ].filter(d => d.value > 0);

  return (
    <div className="page-content">
      <div className="page-header animate-in animate-in-1">
        <h1>Analytics</h1>
        <p>Data-driven insights into your courses and students</p>
      </div>

      <div className="grid-2" style={{ gap: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
        <div className="card animate-in animate-in-2">
          <div className="card-header">
            <h3 className="card-title">Enrollment Growth</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={enrollmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="students" fill="var(--color-primary)" radius={[4,4,0,0]} name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card animate-in animate-in-3">
          <div className="card-header">
            <h3 className="card-title">Completion Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%" cy="50%"
                innerRadius={60} outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                }}
                itemStyle={{ color: 'var(--color-text)' }}
              />
              <Legend formatter={(value) => <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card animate-in animate-in-4" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card-header">
          <h3 className="card-title">Quiz Score Trend (6 Weeks)</h3>
          <span className="badge badge-info">Class Average</span>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="week" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone" dataKey="quizScore" stroke="var(--color-primary)"
              strokeWidth={2.5} dot={{ fill: 'var(--color-primary)', r: 4 }} activeDot={{ r: 6 }}
              name="Quiz Score"
            />
            <Line
              type="monotone" dataKey="progress" stroke="var(--color-accent)"
              strokeWidth={2} strokeDasharray="4 4" dot={false}
              name="Avg Progress"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card animate-in animate-in-5">
        <div className="card-header" style={{ marginBottom: 'var(--space-lg)' }}>
          <h3 className="card-title">Competency Mastery Levels</h3>
          <span className="badge badge-gray">Class average – top 8</span>
        </div>
        {topCompetencies.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No competency data available yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {topCompetencies.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <span style={{ fontSize: 13, color: 'var(--color-text)', minWidth: 180 }}>{c.name}</span>
                <div className="progress-track" style={{ flex: 1 }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${c.mastery}%`,
                      background: c.mastery >= 75
                        ? 'linear-gradient(90deg, var(--color-primary), #34d399)'
                        : c.mastery >= 40
                          ? 'linear-gradient(90deg, var(--color-accent), #fcd34d)'
                          : 'linear-gradient(90deg, var(--color-error), #f87171)',
                    }}
                  />
                </div>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  fontWeight: 600,
                  color: c.mastery >= 75 ? 'var(--color-primary)' : c.mastery >= 40 ? 'var(--color-accent)' : 'var(--color-error)',
                  minWidth: 40,
                  textAlign: 'right',
                }}>
                  {c.mastery}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
