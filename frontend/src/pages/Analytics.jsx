import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { analyticsAPI } from '../services/api';

const COURSE_ENROLLMENT_DATA = [
  { month: 'Jan', students: 120 }, { month: 'Feb', students: 150 },
  { month: 'Mar', students: 280 }, { month: 'Apr', students: 310 }
];

const WEEKLY_PROGRESS = [
  { week: 'W1', quizScore: 78, progress: 10 }, { week: 'W2', quizScore: 82, progress: 25 },
  { week: 'W3', quizScore: 76, progress: 40 }, { week: 'W4', quizScore: 85, progress: 60 }
];

const COMPETENCIES = [
  { id: 'c1', name: 'Variables & Types', mastery: 85 },
  { id: 'c2', name: 'Control Flow', mastery: 72 },
  { id: 'c3', name: 'Functions', mastery: 64 },
  { id: 'c5', name: 'Data Structures', mastery: 45 },
];

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

const pieData = [
  { name: 'Completed', value: 52 },
  { name: 'In Progress', value: 30 },
  { name: 'Not Started', value: 18 },
];

export default function Analytics() {
  const topCompetencies = [...COMPETENCIES]
    .sort((a, b) => b.mastery - a.mastery)
    .slice(0, 8);

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
            <span className="badge badge-success">+18% MoM</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={COURSE_ENROLLMENT_DATA}>
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
          <LineChart data={WEEKLY_PROGRESS}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="week" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis domain={[50, 100]} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
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
          <span className="badge badge-gray">Top 8 skills</span>
        </div>
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
      </div>
    </div>
  );
}
