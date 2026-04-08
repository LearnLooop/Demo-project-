import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, Users, Star, Lock, CheckCircle, Play, ChevronDown, ChevronUp, Loader, MessageCircle } from 'lucide-react';
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

function StarRating({ rating, onRate, interactive = false, size = 14 }) {
  const [hoveredStar, setHoveredStar] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          size={size}
          fill={(hoveredStar || rating || 0) >= star ? '#F59E0B' : 'none'}
          color={(hoveredStar || rating || 0) >= star ? '#F59E0B' : 'var(--color-text-muted)'}
          style={{ cursor: interactive ? 'pointer' : 'default', transition: 'all 0.15s' }}
          onMouseEnter={() => interactive && setHoveredStar(star)}
          onMouseLeave={() => interactive && setHoveredStar(0)}
          onClick={() => interactive && onRate && onRate(star)}
        />
      ))}
    </div>
  );
}

function CourseCard({ course, index, onEnroll, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [rating, setRating] = useState(false);
  const { openChatWith } = useStore();
  const isEnrolled = course.is_enrolled === true;
  
  const handleEnroll = async () => {
    setEnrolling(true);
    await onEnroll(course.id);
    setEnrolling(false);
  };

  const handleRate = async (stars) => {
    try {
      setRating(true);
      await coursesAPI.rateCourse(course.id, stars);
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error('Failed to rate:', err);
    } finally {
      setRating(false);
    }
  };

  return (
    <div className={`card animate-in animate-in-${index + 2}`} style={{ padding: 'var(--space-xl)', marginBottom: 32 }}>
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
              <Users size={12} /> {course.enrollment_count || 0} enrolled
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-accent)' }}>
              <Star size={12} fill={course.average_rating ? 'currentColor' : 'none'} /> 
              {course.average_rating ? `${course.average_rating} (${course.rating_count})` : 'No ratings'}
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
        </div>
      )}

      {/* Student Rating Section */}
      {isEnrolled && (
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: 12, 
          marginBottom: 'var(--space-md)', padding: '8px 12px', 
          background: 'var(--color-bg-elevated)', borderRadius: 'var(--r-md)', 
          border: '1px solid var(--color-border)' 
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Your Rating:</span>
          <StarRating rating={course.user_rating} onRate={handleRate} interactive={!rating} size={18} />
          {course.user_rating && (
            <span style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 700 }}>{course.user_rating}/5</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
        {isEnrolled ? (
          <Link to={`/courses/${course.id}`} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
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
          onClick={() => {
            openChatWith({ id: course.instructor_id, name: 'Instructor', role: 'instructor' });
          }}
          title="Chat with your instructor"
        >
          <MessageCircle size={14} /> Chat
        </button>
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
          {(() => { const chapters = course.units?.flatMap(u => u.chapters || []) || []; return chapters.length > 0 ? chapters.map((ch, i) => (
            <ChapterItem key={ch.id} chapter={ch} index={i} />
          )) : <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--sp-4)' }}>No chapters available</p>; })()}
        </div>
      )}
    </div>
  );
}

export default function Courses() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('my_courses');

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
      setActiveTab('my_courses');
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

  const myCourses = courses.filter(c => c.is_enrolled === true);
  const availableCourses = courses.filter(c => !c.is_enrolled);
  const displayedCourses = activeTab === 'my_courses' ? myCourses : availableCourses;

  return (
    <div className="page-content">
      <div className="page-header animate-in animate-in-1">
        <h1>Course Hub</h1>
        <p>Explore newly available courses or track your enrolled progress</p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--sp-4)', marginBottom: 'var(--sp-6)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--sp-4)' }}>
        <button 
          className={`btn ${activeTab === 'my_courses' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('my_courses')}
        >
          My Courses ({myCourses.length})
        </button>
        <button 
           className={`btn ${activeTab === 'available' ? 'btn-primary' : 'btn-secondary'}`}
           onClick={() => setActiveTab('available')}
        >
          Available Courses ({availableCourses.length})
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        {displayedCourses.length > 0 ? (
          displayedCourses.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} onEnroll={handleEnroll} onRefresh={fetchCourses} />
          ))
        ) : (
          <div className="card" style={{ padding: 'var(--sp-8)', textAlign: 'center' }}>
             <p style={{ color: 'var(--color-text-muted)' }}>
               {activeTab === 'my_courses' ? "You aren't enrolled in any courses yet." : "No new courses available right now."}
             </p>
          </div>
        )}
      </div>
    </div>
  );
}
