import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Users, BookOpen, TrendingUp, Award, ArrowRight, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { coursesAPI, studentsAPI } from '../services/api';

const COURSE_ENROLLMENT_DATA = [
  { month: 'Jan', students: 120 }, { month: 'Feb', students: 150 },
  { month: 'Mar', students: 280 }, { month: 'Apr', students: 310 }
];

const WEEKLY_PROGRESS = [
  { week: 'W1', quizScore: 78 }, { week: 'W2', quizScore: 82 },
  { week: 'W3', quizScore: 76 }, { week: 'W4', quizScore: 85 }
];

function MetricCard({ icon, color, value, label, change, delay }) {
  return (
    <div className={`metric-card animate-in animate-in-${delay}`}>
      <div className="metric-icon" style={{ background: `${color}20` }}>
        {React.cloneElement(icon, { size: 20, color })}
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
      {change && <div className="metric-change up">↑ {change}</div>}
    </div>
  );
}

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

export default function InstructorDashboard() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [coursesData, studentsData] = await Promise.all([
          coursesAPI.getAll(false), // don't filter published only
          studentsAPI.getAll()
        ]);
        setCourses(coursesData || []);
        setStudents(studentsData || []);
      } catch (e) {
        console.error("Error fetching dashboard data", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const atRiskCount = students.filter(s => s.riskLevel === 'high').length;
  const moderateCount = students.filter(s => s.riskLevel === 'moderate').length;

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="page-content">
      <div className="page-header animate-in animate-in-1">
        <h1>Instructor Overview</h1>
        <p>Monitor your courses, student progress, and adaptive learning outcomes</p>
      </div>

      <div className="grid-4" style={{ marginBottom: 'var(--space-xl)' }}>
        <MetricCard icon={<Users />} color="var(--color-info)" value={students.length} label="Total Students" change="API Connected" delay={2} />
        <MetricCard icon={<BookOpen />} color="var(--color-primary)" value={courses.length} label="Active Courses" change="" delay={3} />
        <MetricCard icon={<TrendingUp />} color="var(--color-accent)" value="74%" label="Avg. Completion" change="" delay={4} />
        <MetricCard icon={<Award />} color="#8B5CF6" value="4.8★" label="Avg. Course Rating" change="" delay={5} />
      </div>

      {atRiskCount > 0 && (
        <div className="animate-in animate-in-2" style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-md) var(--space-lg)',
          marginBottom: 'var(--space-xl)',
          display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap'
        }}>
          <AlertTriangle size={20} color="var(--color-error)" />
          <p style={{ margin: 0, flex: 1, color: 'var(--color-text)', fontWeight: 500 }}>
            <span style={{ color: 'var(--color-error)', fontWeight: 700 }}>{atRiskCount} students</span> are at high risk,{' '}
            <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{moderateCount}</span> at moderate risk.
          </p>
          <Link to="/at-risk" className="btn btn-danger btn-sm">
            View At-Risk <ArrowRight size={14} />
          </Link>
        </div>
      )}

      <div className="grid-2" style={{ gap: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
        <div className="card animate-in animate-in-3">
          <div className="card-header">
            <h3 className="card-title">Enrollment Growth</h3>
            <span className="badge badge-success">+18% MoM</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={COURSE_ENROLLMENT_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="students" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card animate-in animate-in-4">
          <div className="card-header">
            <h3 className="card-title">Avg. Quiz Scores</h3>
            <span className="badge badge-primary">Trend</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={WEEKLY_PROGRESS}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[50, 100]} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="quizScore" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ fill: 'var(--color-primary)', r: 4 }} activeDot={{ r: 6 }} name="Score" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="animate-in animate-in-5">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
          <h2 style={{ fontSize: 18 }}>Your Courses</h2>
          <Link to="/course-builder" className="btn btn-primary btn-sm">+ New Course</Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {courses.length === 0 ? <p>No courses found. Create one!</p> : courses.map(course => (
            <div key={course.id} className="card" style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <h3 style={{ fontSize: 15, marginBottom: 4 }}>{course.title}</h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className="badge badge-gray">{course.level || 'Beginner'}</span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {course.enrolled || 0} students
                  </span>
                </div>
              </div>
              <div style={{ minWidth: 120 }}>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `0%` }} />
                </div>
              </div>
              <Link to="/course-builder" className="btn btn-secondary btn-sm">Edit Course</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
