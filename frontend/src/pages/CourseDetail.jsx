import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, CheckCircle, Video, FileText, HelpCircle, ArrowLeft, Loader, Users, Star } from 'lucide-react';
import { coursesAPI } from '../services/api';
import { motion } from 'framer-motion';

const TYPE_ICONS = {
  video: { icon: <Video size={16} />, color: 'var(--color-info)' },
  reading: { icon: <FileText size={16} />, color: 'var(--color-accent)' },
  quiz: { icon: <HelpCircle size={16} />, color: 'var(--color-primary)' },
};

function StarRating({ rating, onRate, interactive = false, size = 14 }) {
  const [hoveredStar, setHoveredStar] = React.useState(0);
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

function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getEmbedUrl(url) {
  const id = extractYouTubeId(url);
  if (id) return `https://www.youtube.com/embed/${id}`;
  return url;
}

export default function CourseDetail() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completingChapter, setCompletingChapter] = useState(null);
  const [ratingLoading, setRatingLoading] = useState(false);

  useEffect(() => {
    fetchCourseInfo();
  }, [courseId]);

  const fetchCourseInfo = async () => {
    try {
      setLoading(true);
      const data = await coursesAPI.getOne(courseId);
      setCourse(data);
    } catch (err) {
      console.error('Failed to load course details', err);
    } finally {
      setLoading(false);
    }
  };

  const markComplete = async (chapterId) => {
    try {
      setCompletingChapter(chapterId);
      await coursesAPI.completeChapter(courseId, chapterId);
      await fetchCourseInfo(); // Refresh progress
    } catch (err) {
      console.error('Failed to mark chapter as complete', err);
    } finally {
      setCompletingChapter(null);
    }
  };

  const handleRate = async (stars) => {
    try {
      setRatingLoading(true);
      await coursesAPI.rateCourse(courseId, stars);
      await fetchCourseInfo();
    } catch (err) {
      console.error('Failed to rate course:', err);
    } finally {
      setRatingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader className="spinner" size={40} color="var(--color-primary)" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="page-content">
        <div className="card" style={{ padding: 'var(--sp-8)', textAlign: 'center' }}>
          <h3>Course Not Found</h3>
          <p>This course does not exist or you do not have access.</p>
          <Link to="/courses" className="btn btn-primary" style={{ marginTop: 'var(--sp-4)' }}>Back to Courses</Link>
        </div>
      </div>
    );
  }

  const progress = course.progress || 0;
  const allChapters = course.units?.flatMap(u => u.chapters) || [];
  const completedCount = allChapters.filter(c => c.completed).length;

  return (
    <div className="page-content" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--sp-4)' }}>
        <Link to="/courses" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--color-text-muted)' }}>
          <ArrowLeft size={16} /> Back to My Courses
        </Link>
      </div>

      <div className="card" style={{ marginBottom: 'var(--sp-8)' }}>
        <div style={{ display: 'flex', gap: 'var(--sp-6)', alignItems: 'flex-start' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 'var(--r-lg)',
            background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-bg-elevated))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <BookOpen size={36} color="var(--color-primary)" />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 32, marginBottom: 8 }}>{course.title}</h1>
            <p style={{ fontSize: 16, color: 'var(--color-text-muted)', marginBottom: 'var(--sp-4)' }}>{course.description}</p>

            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <span className="badge badge-gray">{course.level || 'Beginner'}</span>
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600 }}>{allChapters.length} Chapters</span>
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600 }}>{course.duration || '0 min'} total</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600 }}>
                <Users size={14} /> {course.enrollment_count || 0} enrolled
              </span>
              {course.average_rating != null && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#F59E0B', fontWeight: 600 }}>
                  <Star size={14} fill="currentColor" /> {course.average_rating} ({course.rating_count || 0} ratings)
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 'var(--sp-6)', paddingTop: 'var(--sp-6)', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)' }}>Course Progress</span>
            <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>{Math.round(progress)}%</span>
          </div>
          <div className="progress-track" style={{ height: 8 }}>
            <div className="progress-fill" style={{ width: `${progress}%`, background: 'var(--color-primary)' }} />
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
            {completedCount} of {allChapters.length} chapters completed
          </p>
        </div>

        {/* Student Rating */}
        {course.is_enrolled && (
          <div style={{
            marginTop: 'var(--sp-6)', paddingTop: 'var(--sp-6)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap'
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 16px',
              background: 'var(--color-bg-elevated)',
              borderRadius: 'var(--r-lg)',
              border: '1px solid var(--color-border)'
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rate this course:</span>
              <StarRating rating={course.user_rating} onRate={handleRate} interactive={!ratingLoading} size={20} />
              {course.user_rating && (
                <span style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 700 }}>{course.user_rating}/5</span>
              )}
              {ratingLoading && <Loader size={14} className="spinner" />}
            </div>
          </div>
        )}
      </div>

      {(course.materials_link || course.google_classroom_link || course.google_meet_link) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 'var(--sp-8)', gap: 'var(--sp-4)' }}>
          {course.materials_link && (
            <a href={course.materials_link} target="_blank" rel="noreferrer" className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: 'var(--sp-5)', textDecoration: 'none', background: 'var(--color-bg-elevated)', transition: 'transform 0.2s', border: '1px solid var(--color-border)' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <BookOpen size={24} />
              </div>
              <h4 style={{ margin: 0, color: 'var(--color-text)' }}>Course Materials</h4>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>Google Drive</p>
            </a>
          )}
          {course.google_classroom_link && (
            <a href={course.google_classroom_link} target="_blank" rel="noreferrer" className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: 'var(--sp-5)', textDecoration: 'none', background: 'var(--color-bg-elevated)', transition: 'transform 0.2s', border: '1px solid var(--color-border)' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Users size={24} />
              </div>
              <h4 style={{ margin: 0, color: 'var(--color-text)' }}>Classroom Portal</h4>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>Google Classroom</p>
            </a>
          )}
          {course.google_meet_link && (
            <a href={course.google_meet_link} target="_blank" rel="noreferrer" className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: 'var(--sp-5)', textDecoration: 'none', background: 'var(--color-bg-elevated)', transition: 'transform 0.2s', border: '1px solid var(--color-border)' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Video size={24} />
              </div>
              <h4 style={{ margin: 0, color: 'var(--color-text)' }}>Live Session</h4>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>Google Meet</p>
            </a>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
        <h2 style={{ fontSize: 24, margin: 0 }}>Course Content</h2>
        {!course.is_enrolled && (
           <span style={{ color: 'var(--color-error)', fontWeight: 600, padding: 'var(--sp-2) var(--sp-4)', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--r-md)' }}>
             Enroll to access full materials
           </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
        {allChapters.map((chapter, i) => {
          const typeInfo = TYPE_ICONS[chapter.type] || TYPE_ICONS.reading;
          return (
            <motion.div
              key={chapter.id}
              className="card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', gap: 'var(--sp-4)', alignItems: 'center', marginBottom: chapter.content ? 'var(--sp-4)' : 0 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: chapter.completed ? 'var(--color-success)' : 'var(--color-bg-elevated)',
                  border: `2px solid ${chapter.completed ? 'var(--color-success)' : 'var(--color-border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: chapter.completed ? '#fff' : 'var(--color-text-muted)'
                }}>
                  {chapter.completed ? <CheckCircle size={20} /> : <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 13, fontWeight: 800 }}>{i + 1}</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ color: typeInfo.color }}>{typeInfo.icon}</div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {chapter.type} • {chapter.duration || 'N/A'}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 18, margin: 0 }}>{chapter.title}</h3>
                </div>

                {course.is_enrolled ? (
                  chapter.type === 'quiz' ? (
                    <Link to={`/quiz?chapter=${chapter.id}`} className="btn btn-primary btn-sm">Take Quiz</Link>
                  ) : (
                    (chapter.video_url || chapter.content) ? (
                      <button 
                        className={`btn ${chapter.completed ? 'btn-secondary' : 'btn-primary'} btn-sm`} 
                        onClick={() => markComplete(chapter.id)}
                        disabled={completingChapter === chapter.id || chapter.completed}
                      >
                        {completingChapter === chapter.id ? <Loader size={14} className="spinner" /> : (chapter.completed ? 'Completed' : 'Mark Complete')}
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Pending content upload</span>
                    )
                  )
                ) : (
                  <span style={{ fontSize: 13, color: 'var(--color-primary)' }}>Lock</span>
                )}
              </div>

              {chapter.video_url && (
                <div style={{ marginTop: 'var(--sp-4)', borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                  {extractYouTubeId(chapter.video_url) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                      <div style={{ width: 24, height: 24, borderRadius: 4, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Video size={14} color="#EF4444" />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>YouTube Video</span>
                    </div>
                  )}
                  <iframe
                    width="100%"
                    height="400"
                    src={getEmbedUrl(chapter.video_url)}
                    title={chapter.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ display: 'block' }}
                  />
                </div>
              )}

              {chapter.content && (
                <div style={{
                  background: 'rgba(255,255,255,0.5)',
                  padding: 'var(--sp-5)',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--color-border)',
                  marginTop: 'var(--sp-2)'
                }}>
                  <div dangerouslySetInnerHTML={{ __html: chapter.content }} style={{ lineHeight: 1.6 }} />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
