import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable, arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Save, Eye, Rocket, GripVertical, Plus, Video, FileText, HelpCircle, Trash2, ChevronDown, ChevronUp, X, CheckCircle } from 'lucide-react';
import { coursesAPI } from '../services/api';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from '../components/Confetti';
import QuizBuilder from '../components/QuizBuilder';

const DEFAULT_CHAPTERS = [
  { id: 'ch-1', title: 'Introduction to the Course', type: 'video',   duration: '15 min', competencies: ['Variables', 'Setup'], content: '', questions: [] },
  { id: 'ch-2', title: 'Core Concepts Overview',     type: 'reading', duration: '20 min', competencies: ['Core Theory'], content: '', questions: [] },
  { id: 'ch-3', title: 'Hands-On Lab',               type: 'video',   duration: '30 min', competencies: ['Practical Skills'], content: '', questions: [] },
  { id: 'ch-4', title: 'Module 1 Assessment',        type: 'quiz',    duration: '10 min', competencies: ['Core Theory', 'Practical Skills'], content: '', questions: [] },
];

const TYPE_ICONS = {
  video:   { icon: <Video size={14} />,     color: 'var(--color-info)',    label: 'Video'   },
  reading: { icon: <FileText size={14} />,  color: 'var(--color-accent)',  label: 'Reading' },
  quiz:    { icon: <HelpCircle size={14} />,color: 'var(--color-primary)', label: 'Quiz'    },
};

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

function toEmbedUrl(url) {
  const id = extractYouTubeId(url);
  if (id) return `https://www.youtube.com/embed/${id}`;
  return url;
}

function YouTubeThumbnail({ url }) {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;
  return (
    <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginTop: 8, cursor: 'pointer' }}>
      <img
        src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
        alt="Video thumbnail"
        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 'var(--radius-md)' }}
      />
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Video size={20} color="#fff" />
      </div>
      <div style={{
        position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.75)',
        color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700
      }}>
        YouTube
      </div>
    </div>
  );
}

function SortableChapter({ chapter, onDelete, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };

  const typeInfo = TYPE_ICONS[chapter.type];

  // Editor modules
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link', 'image', 'video'],
      ['code-block'],
      ['clean']
    ],
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--space-sm)',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          padding: '12px var(--space-md)',
        }}>
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'grab',
              color: 'var(--color-text-muted)',
              display: 'flex',
              padding: 4,
              borderRadius: 4,
            }}
            aria-label="Drag to reorder"
          >
            <GripVertical size={16} />
          </button>

          {/* Type indicator */}
          <div style={{
            width: 28, height: 28,
            borderRadius: 'var(--radius-sm)',
            background: `${typeInfo.color}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            color: typeInfo.color,
          }}>
            {typeInfo.icon}
          </div>

          {/* Title */}
          <input
            className="form-input"
            value={chapter.title}
            onChange={e => onUpdate(chapter.id, { title: e.target.value })}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              padding: '4px 0',
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--color-text)',
            }}
          />

          {/* Type selector */}
          <select
            className="form-select"
            value={chapter.type}
            onChange={e => onUpdate(chapter.id, { type: e.target.value })}
            style={{ width: 100, padding: '4px 28px 4px 8px', fontSize: 12 }}
          >
            <option value="video">Video</option>
            <option value="reading">Reading</option>
            <option value="quiz">Quiz</option>
          </select>

          {/* Duration */}
          <input
            className="form-input"
            value={chapter.duration}
            onChange={e => onUpdate(chapter.id, { duration: e.target.value })}
            style={{ width: 72, padding: '4px 8px', fontSize: 12 }}
            placeholder="Duration"
          />

          <button
            className="btn-icon"
            onClick={() => setExpanded(!expanded)}
            style={{ color: 'var(--color-text-muted)' }}
            aria-label="Toggle settings"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            className="btn-icon"
            onClick={() => onDelete(chapter.id)}
            style={{ color: 'var(--color-error)' }}
            aria-label="Delete chapter"
            id={`delete-chapter-${chapter.id}-btn`}
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Always-visible Video URL input for video chapters */}
        {chapter.type === 'video' && (
          <div style={{
            padding: '0 var(--space-md) 12px',
            borderTop: '1px solid var(--color-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <Video size={14} color="var(--color-info)" />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>YouTube / Video Link</span>
              {chapter.video_url && extractYouTubeId(chapter.video_url) && (
                <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.1)', color: '#EF4444', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>YouTube Detected</span>
              )}
            </div>
            <input
              className="form-input"
              value={chapter.video_url || ''}
              onChange={e => onUpdate(chapter.id, { video_url: e.target.value })}
              onBlur={() => {
                if (chapter.video_url) {
                  const embedUrl = toEmbedUrl(chapter.video_url);
                  if (embedUrl !== chapter.video_url) {
                    onUpdate(chapter.id, { video_url: embedUrl });
                  }
                }
              }}
              placeholder="Paste any YouTube link (e.g. https://youtube.com/watch?v=dQw4w9WgXcQ)"
              style={{ marginTop: 6, fontSize: 13 }}
            />
            <YouTubeThumbnail url={chapter.video_url} />
          </div>
        )}

        {/* Expanded settings */}
        {expanded && (
          <div style={{
            padding: 'var(--space-md)',
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
          }}>
            {chapter.type === 'reading' && (
              <div className="form-group" style={{ marginBottom: 'var(--space-lg)' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Chapter Content (WYSIWYG)</label>
                <div style={{ background: '#fff', color: '#000', borderRadius: '4px', overflow: 'hidden' }}>
                  <ReactQuill 
                    theme="snow" 
                    value={chapter.content || ''} 
                    onChange={(content) => onUpdate(chapter.id, { content })} 
                    modules={modules}
                    style={{ height: '300px', marginBottom: '40px' }}
                  />
                </div>
              </div>
            )}

            {(chapter.type === 'quiz') && (
              <QuizBuilder
                questions={chapter.questions || []}
                onUpdate={(qs) => onUpdate(chapter.id, { questions: qs })}
              />
            )}

            <div className="form-group" style={{ marginTop: 'var(--space-lg)' }}>
              <label className="form-label">Competency Tags (comma-separated)</label>
              <input
                className="form-input"
                value={chapter.competencies.join(', ')}
                onChange={e => onUpdate(chapter.id, {
                  competencies: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                placeholder="e.g. Variables, Functions, OOP"
              />
              {/* Tag preview */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {chapter.competencies.map(tag => (
                  <span key={tag} className="badge badge-primary">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CourseBuilder() {
  const [chapters, setChapters] = useState(DEFAULT_CHAPTERS);
  const [courseTitle, setCourseTitle] = useState('New Adaptive Course');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [materialsLink, setMaterialsLink] = useState('');
  const [classroomLink, setClassroomLink] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [confetti, setConfetti] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const { courseId: routeCourseId } = useParams();
  const navigate = useNavigate();
  const [courseId, setCourseId] = useState(null);

  React.useEffect(() => {
    if (routeCourseId) {
      coursesAPI.getOne(routeCourseId).then(course => {
        setCourseId(course.id);
        setCourseTitle(course.title);
        setDescription(course.description);
        setLevel(course.level || 'Beginner');
        setMaterialsLink(course.materials_link || '');
        setClassroomLink(course.google_classroom_link || '');
        setMeetLink(course.google_meet_link || '');
        
        if (course.units && course.units.length > 0 && course.units[0].chapters) {
          const loadedChapters = course.units[0].chapters.map(ch => ({
            ...ch,
            competencies: ch.competencies || [] // ensure array format
          }));
          setChapters(loadedChapters);
        } else {
          setChapters([]);
        }
      }).catch(err => {
        console.error("Failed to load course", err);
      });
    }
  }, [routeCourseId]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    setChapters(c => {
      const oldIdx = c.findIndex(ch => ch.id === active.id);
      const newIdx = c.findIndex(ch => ch.id === over.id);
      return arrayMove(c, oldIdx, newIdx);
    });
  };

  const addChapter = () => {
    const id = `ch-${Date.now()}`;
    setChapters(c => [...c, {
      id,
      title: 'New Chapter',
      type: 'video',
      duration: '20 min',
      competencies: [],
    }]);
  };

  const deleteChapter = (id) => setChapters(c => c.filter(ch => ch.id !== id));

  const updateChapter = (id, updates) => {
    setChapters(c => c.map(ch => ch.id === id ? { ...ch, ...updates } : ch));
  };

  const handleSave = async () => {
    try {
      const courseData = {
        title: courseTitle,
        description: description || 'New dynamic course.',
        level: level,
        duration: chapters.reduce((a, c) => a + parseInt(c.duration || 0), 0) + ' min',
        adaptive_enabled: true,
        auto_remediation: true,
        grade_gate: false,
        materials_link: materialsLink,
        google_classroom_link: classroomLink,
        google_meet_link: meetLink,
        chaptersData: chapters
      };
      
      if (courseId) {
        await coursesAPI.update(courseId, courseData);
      } else {
        const course = await coursesAPI.create(courseData);
        setCourseId(course.id);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.detail || 'Unknown error. Check console for details.';
      alert(`Failed to save course draft: ${msg}`);
    }
  };

  const handlePublish = async () => {
    try {
      const courseData = {
        title: courseTitle,
        description: description || 'New dynamic course.',
        level: level,
        duration: chapters.reduce((a, c) => a + parseInt(c.duration || 0), 0) + ' min',
        adaptive_enabled: true,
        auto_remediation: true,
        grade_gate: false,
        materials_link: materialsLink,
        google_classroom_link: classroomLink,
        google_meet_link: meetLink,
        chaptersData: chapters
      };
      
      let currentId = courseId;
      if (!currentId) {
        const course = await coursesAPI.create(courseData);
        currentId = course.id;
        setCourseId(currentId);
      } else {
        await coursesAPI.update(currentId, courseData);
      }
      await coursesAPI.update(currentId, { published: true });
      setConfetti(true);
    } catch (e) {
      console.error('Publish error:', e);
      const msg = e?.response?.data?.detail || 'Unknown error. Check console for details.';
      alert(`Failed to publish course: ${msg}`);
    }
  };

  return (
    <div className="page-content">
      <Confetti active={confetti} onComplete={() => setConfetti(false)} />

      <div className="page-header animate-in animate-in-1">
        <h1>Course Builder</h1>
        <p>Create adaptive, intelligent learning experiences with drag-and-drop simplicity</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-xl)', alignItems: 'start' }}>
        {/* Main editor */}
        <div>
          {/* Course details */}
          <div className="card animate-in animate-in-2" style={{ marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ marginBottom: 'var(--space-lg)' }}>Course Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">Course Title</label>
                <input
                  id="course-title-input"
                  className="form-input"
                  value={courseTitle}
                  onChange={e => setCourseTitle(e.target.value)}
                  placeholder="Enter course title..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  id="course-description-input"
                  className="form-textarea"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What will students learn? What makes this course special?"
                />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Level</label>
                  <select
                    className="form-select"
                    value={level}
                    onChange={e => setLevel(e.target.value)}
                    id="course-level-select"
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Enrollment Cap</label>
                  <input className="form-input" type="number" defaultValue={100} min={1} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Google Drive (Course Materials Link)</label>
                <input
                  className="form-input"
                  value={materialsLink}
                  onChange={e => setMaterialsLink(e.target.value)}
                  placeholder="https://drive.google.com/..."
                />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Google Classroom Link</label>
                  <input
                    className="form-input"
                    value={classroomLink}
                    onChange={e => setClassroomLink(e.target.value)}
                    placeholder="https://classroom.google.com/..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Google Meet Link</label>
                  <input
                    className="form-input"
                    value={meetLink}
                    onChange={e => setMeetLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Chapter builder */}
          <div className="card animate-in animate-in-3">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
              <h3>Chapters ({chapters.length})</h3>
              <button className="btn btn-secondary btn-sm" onClick={addChapter} id="add-chapter-btn">
                <Plus size={14} /> Add Chapter
              </button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={chapters.map(c => c.id)} strategy={verticalListSortingStrategy}>
                {chapters.map(ch => (
                  <SortableChapter
                    key={ch.id}
                    chapter={ch}
                    onDelete={deleteChapter}
                    onUpdate={updateChapter}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {chapters.length === 0 && (
              <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--color-text-muted)' }}>
                <p>No chapters yet. Click "Add Chapter" to get started.</p>
              </div>
            )}
          </div>
        </div>

        {/* Settings panel */}
        <div style={{ position: 'sticky', top: 80 }}>
          {/* Preview */}
          <div className="card animate-in animate-in-2" style={{ marginBottom: 'var(--space-md)' }}>
            <h3 style={{ marginBottom: 'var(--space-md)', fontSize: 15 }}>Course Preview</h3>
            <div style={{
              background: 'linear-gradient(135deg, var(--color-bg-elevated), var(--color-bg))',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-md)',
              marginBottom: 'var(--space-md)',
            }}>
              <h4 style={{ fontSize: 14, marginBottom: 6, color: 'var(--color-text)' }}>
                {courseTitle || 'Course Title'}
              </h4>
              <span className="badge badge-gray" style={{ marginBottom: 8, display: 'inline-block' }}>
                {level}
              </span>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
                {chapters.length} chapters · {chapters.reduce((a, c) => a + parseInt(c.duration || 0), 0)} min total
              </p>
            </div>

            {/* Chapter type breakdown */}
            {['video', 'reading', 'quiz'].map(type => {
              const count = chapters.filter(c => c.type === type).length;
              const t = TYPE_ICONS[type];
              return (
                <div key={type} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: t.color }}>{t.icon}</span> {t.label}
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--color-text)' }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Adaptive settings */}
          <div className="card animate-in animate-in-3" style={{ marginBottom: 'var(--space-md)' }}>
            <h3 style={{ marginBottom: 'var(--space-md)', fontSize: 15 }}>Adaptive Settings</h3>
            {[
              { label: 'Enable adaptive paths', key: 'adaptive' },
              { label: 'Auto-recommend remediation', key: 'remediation' },
              { label: 'Grade-gate chapters', key: 'gate' },
            ].map((s, i) => (
              <label key={s.key} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: i < 2 ? 'var(--space-sm)' : 0,
                cursor: 'pointer',
              }}>
                <span style={{ fontSize: 13, color: 'var(--color-text)' }}>{s.label}</span>
                <input
                  type="checkbox"
                  defaultChecked={i < 2}
                  id={`setting-${s.key}-toggle`}
                  style={{ accentColor: 'var(--color-primary)', width: 16, height: 16 }}
                />
              </label>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <button className="btn btn-secondary" onClick={handleSave} id="save-draft-btn" style={{ justifyContent: 'center' }}>
              <Save size={16} /> {saved ? '✓ Saved!' : 'Save Draft'}
            </button>
            <button className="btn btn-ghost" id="preview-course-btn" style={{ justifyContent: 'center' }} onClick={() => setShowPreview(true)}>
              <Eye size={16} /> Preview
            </button>
            <button
              className="btn btn-primary pulse-glow"
              onClick={handlePublish}
              id="publish-course-btn"
              style={{ justifyContent: 'center' }}
            >
              <Rocket size={16} /> Publish Course
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(10px)',
              zIndex: 1000,
              overflowY: 'auto',
              padding: 'var(--sp-8)',
            }}
          >
            <div style={{ maxWidth: 1000, margin: '0 auto', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', paddingBottom: 'var(--sp-8)' }}>
              <div style={{ padding: 'var(--sp-6)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-elevated)', position: 'sticky', top: 0, zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Eye size={24} color="var(--color-primary)" />
                  <h2 style={{ fontSize: 20, margin: 0 }}>Student Preview Mode</h2>
                </div>
                <button onClick={() => setShowPreview(false)} className="btn-icon">
                  <X size={20} />
                </button>
              </div>
              
              <div style={{ padding: 'var(--sp-8)' }}>
                <div className="card" style={{ marginBottom: 'var(--sp-8)' }}>
                  <div style={{ display: 'flex', gap: 'var(--sp-6)', alignItems: 'flex-start' }}>
                    <div style={{
                      width: 80, height: 80, borderRadius: 'var(--r-lg)',
                      background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-bg-elevated))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <Rocket size={36} color="var(--color-primary)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h1 style={{ fontSize: 32, marginBottom: 8 }}>{courseTitle}</h1>
                      <p style={{ fontSize: 16, color: 'var(--color-text-muted)', marginBottom: 'var(--sp-4)' }}>{description}</p>
                      
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <span className="badge badge-gray">{level}</span>
                        <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600 }}>{chapters.length} Chapters</span>
                        <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600 }}>{chapters.reduce((a, c) => a + parseInt(c.duration || 0), 0)} min total</span>
                      </div>
                    </div>
                  </div>
                </div>

                <h2 style={{ fontSize: 24, marginBottom: 'var(--sp-4)' }}>Course Content</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                  {chapters.map((chapter, i) => {
                    const typeInfo = TYPE_ICONS[chapter.type] || TYPE_ICONS.reading;
                    return (
                      <div key={chapter.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', gap: 'var(--sp-4)', alignItems: 'center', marginBottom: chapter.content ? 'var(--sp-4)' : 0 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-bg-elevated)', border: `2px solid var(--color-border)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--color-text-muted)' }}>
                            <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 13, fontWeight: 800 }}>{i + 1}</span>
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
                          {chapter.type === 'quiz' ? (
                            <button className="btn btn-primary btn-sm" disabled>Take Quiz</button>
                          ) : (
                            <button className="btn btn-primary btn-sm" disabled>Mark Complete</button>
                          )}
                        </div>

                        {chapter.content && (
                          <div style={{ background: 'rgba(255,255,255,0.5)', padding: 'var(--sp-5)', borderRadius: 'var(--r-md)', border: '1px solid var(--color-border)', marginTop: 'var(--sp-2)' }}>
                            <div dangerouslySetInnerHTML={{ __html: chapter.content }} style={{ lineHeight: 1.6 }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
