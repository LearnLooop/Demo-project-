import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, Users, Star, Lock, CheckCircle, Play, ChevronDown, ChevronUp, Loader } from 'lucide-react';
import { coursesAPI } from '../services/api';
import { Link } from 'react-router-dom';
import useStore from '../store/useStore';

function LevelBadge({ level }) {
  const colors = {
    Beginner:     { bg: 'rgba(16,185,129,0.15)',  color: 'var(--color-primary)' },
    Intermediate: { bg: 'rgba(245,158,11,0.15)',  color: 'var(--color-accent)' },
    Advanced:     { bg: 'rgba(239,68,68,0.15)',   color: 'var(--color-error)' },
  };
  const c = colors[level] || colors.Beginner;
  return (
    <span className="badge" style={{ background: c.bg, color: c.color }}>
      {level}
    </span>
  );
}

function ChapterItem({ chapter, index }) {
  const typeIcons = { video: '▶', reading: '📄', quiz: '🧠' };
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 0',
      borderBottom: '1px solid rgba(51,65,85,0.4)',
    }}>
      <div style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: chapter.completed
          ? 'rgba(16,185,129,0.2)'
          : 'var(--color-bg-elevated)',
        border: '1px solid ' + (chapter.completed ? 'var(--color-primary)' : 'var(--color-border)'),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: 11,
      }}>
        {chapter.completed
          ? <CheckCircle size={14} color="var(--color-primary)" />
          : <span style={{ color: 'var(--color-text-muted)', fontFamily: "'JetBrains Mono'" }}>{String(index + 1).padStart(2, '0')}</span>
        }
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, color: chapter.completed ? 'var(--color-text-muted)' : 'var(--color-text)', fontWeight: 500, margin: 0 }}>
          {typeIcons[chapter.type]} {chapter.title}
        </p>
      </div>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--color-text-muted)' }}>
        {chapter.duration}
      </span>
    </div>
  );
}

function CourseCard({ course, index, onEnroll }) {
  const [expanded, setExpanded] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const isEnrolled = course.progress !== undefined && course.progress >= 0;
  
  const handleEnroll = async () => {
    setEnrolling(true);
    await onEnroll(course.id);
    setEnrolling(false);
  };

  return (
    <div className={`card animate-in animate-in-${index + 2}`} style={{ padding: 'var(--space-xl)' }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-bg-elevated))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <BookOpen size={24} color="var(--color-primary)" />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ marginBottom: 6 }}>{course.title}</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <LevelBadge level={course.level} />
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-text-muted)' }}>
              <Clock size={12} /> {course.duration}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-text-muted)' }}>
              <Users size={12} /> {course.enrolled?.toLocaleString() || 0} enrolled
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-accent)' }}>
              <Star size={12} fill="currentColor" /> {course.rating || 0}
            </span>
          </div>
        </div>
      </div>

      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
        {course.description}
      </p>

      {/* Progress (only if enrolled) */}
      {isEnrolled && (
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Progress</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--color-primary)', fontWeight: 600 }}>
              {Math.round(course.progress || 0)}%
            </span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${course.progress || 0}%` }} />
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
            {course.chapters?.filter(c => c.completed).length || 0} / {course.chapters?.length || 0} chapters completed
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
        {isEnrolled ? (
          <Link to="/quiz" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
            <Play size={14} /> Continue Learning
          </Link>
        ) : (
          <button 
            className="btn btn-primary btn-sm" 
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={handleEnroll}
            disabled={enrolling}
          >
            {enrolling ? <Loader className="spinner" size={14} /> : '📚'} {enrolling ? 'Enrolling...' : 'Enroll Now'}
          </button>
        )}
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          id={`course-chapters-btn-${course.id}`}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          Chapters
        </button>
      </div>

      {/* Chapters Dropdown */}
      {expanded && (
        <div style={{ marginTop: 'var(--space-md)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-md)' }}>
          {course.chapters?.map((ch, i) => (
            <ChapterItem key={ch.id} chapter={ch} index={i} />
          )) || <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--sp-4)' }}>No chapters available</p>}
        </div>
      )}
    </div>
  );
}

export default function Courses() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await coursesAPI.getAll();
      setCourses(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      setError('Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      await coursesAPI.enroll(courseId);
      // Refresh courses to show enrollment
      await fetchCourses();
    } catch (err) {
      console.error('Failed to enroll:', err);
      alert('Failed to enroll in course. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader className="spinner" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <div className="card" style={{ padding: 'var(--sp-8)', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-error)', marginBottom: 'var(--sp-4)' }}>{error}</p>
          <button className="btn btn-primary" onClick={fetchCourses}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header animate-in animate-in-1">
        <h1>My Courses</h1>
        <p>Track your progress across all enrolled courses</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        {courses.length > 0 ? (
          courses.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} onEnroll={handleEnroll} />
          ))
        ) : (
          <div className="card" style={{ padding: 'var(--sp-8)', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>No courses available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
