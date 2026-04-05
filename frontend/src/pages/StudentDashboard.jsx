import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp, Award, Clock, BookOpen, Sparkles,
  ArrowRight, BarChart2, Map, Play, Zap, Star, Loader
} from 'lucide-react';
import useStore from '../store/useStore';
import { coursesAPI, recommendationsAPI, competenciesAPI } from '../services/api';
import { MotionMetricCard, useAnimatedCounter, AnimatedProgressBar } from '../components/AnimatedPage';

function CountUpNumber({ value, suffix = '', prefix = '', duration = 1400, decimals = 0 }) {
  const num = parseFloat(value.toString().replace(/[^0-9.]/g, ''));
  const { count, ref } = useAnimatedCounter(num, duration);
  return <span ref={ref}>{prefix}{decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}{suffix}</span>;
}

function WelcomeHero({ name }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        marginBottom: 'var(--sp-10)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 'var(--sp-6)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div>
        <h1 style={{ marginBottom: 'var(--sp-2)', fontSize: 'clamp(40px, 5vw, 64px)' }}>
          {greeting}, <span style={{ color: 'var(--color-primary)' }}>{name?.split(' ')[0]}</span>.
        </h1>
        <p style={{ fontSize: 18, color: 'var(--color-text-muted)', maxWidth: 500, fontWeight: 500 }}>
          Your learning journey is ready. Dive back in and master new skills today.
        </p>
      </div>

      <Link to="/courses" style={{ position: 'relative', zIndex: 1 }}>
        <motion.button className="btn btn-primary btn-lg" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Play size={18} fill="#ffffff" /> Continue Learning
        </motion.button>
      </Link>
    </motion.div>
  );
}

function AIRecommendationCard({ rec }) {
  const navigate = useNavigate();
  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      whileHover={{ y: -4 }}
      style={{ borderTop: '6px solid var(--color-primary)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-4)' }}>
        <div>
          <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Next Recommended Step
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginTop: 4 }}>
            <Sparkles size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{rec.chapter_title}</h3>
          </div>
        </div>
        <span className={`badge ${rec.priority === 'high' ? 'badge-error' : 'badge-warning'}`}>
          {rec.priority === 'high' ? '🔴' : '🟡'} {rec.priority} PRIORITY
        </span>
      </div>

      <p style={{ fontSize: 15, color: 'var(--color-text-soft)', marginBottom: 'var(--sp-6)', lineHeight: 1.6 }}>
        {rec.reason}
      </p>

      {/* Mastery Projection */}
      <div style={{ marginBottom: 'var(--sp-6)', background: 'rgba(255,255,255,0.7)', padding: 'var(--sp-5)', borderRadius: 'var(--r-lg)', border: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-3)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Mastery Projection
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: 'var(--color-text)', fontWeight: 800 }}>
              {Math.round(rec.current_mastery)}%
            </span>
            <ArrowRight size={14} color="var(--color-text-faint)" />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: 'var(--color-primary)', fontWeight: 800 }}>
              {Math.round(rec.expected_mastery)}%
            </span>
          </div>
        </div>
        <div style={{ position: 'relative', height: 12, background: 'var(--color-border-bright)', borderRadius: 99, overflow: 'hidden' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${rec.current_mastery}%` }} transition={{ duration: 1.2, delay: 0.5 }} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 99, background: 'var(--color-text)' }} />
          <motion.div initial={{ width: 0 }} animate={{ width: `${rec.expected_mastery}%` }} transition={{ duration: 1.4, delay: 0.8 }} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 99, background: 'var(--color-primary)', opacity: 0.4 }} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-soft)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={16} color="var(--color-primary)" /> ~{rec.estimated_time} mins
        </span>
        <motion.button className="btn btn-primary btn-sm" whileHover={{ scale: 1.05 }} onClick={() => navigate('/recommendations')}>
          Start Module <ArrowRight size={14} />
        </motion.button>
      </div>
    </motion.div>
  );
}

function CourseProgressRow({ course, index }) {
  const progress = Math.round(course.progress || 0);
  const nextChapterIndex = course.chapters ? Math.floor(course.chapters.length * progress / 100) : 0;
  const nextChapter = course.chapters?.[nextChapterIndex];
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, delay: 0.3 + index * 0.1 }}
      whileHover={{ y: -2, backgroundColor: 'rgba(255,255,255,0.7)' }}
      style={{
        display: 'flex', alignItems: 'center', gap: 'var(--sp-4)',
        padding: 'var(--sp-5)', borderRadius: 'var(--r-lg)',
        borderBottom: '1px solid var(--color-border)', cursor: 'pointer', flexWrap: 'wrap',
      }}
    >
      <div style={{
        width: 48, height: 48, background: 'rgba(255,255,255,0.9)', borderRadius: 'var(--r-md)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border-bright)',
      }}>
        <BookOpen size={24} color={['var(--color-primary)', 'var(--color-info)', 'var(--color-accent)'][index % 3]} />
      </div>

      <div style={{ flex: 1, minWidth: 120 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', marginBottom: 2 }}>{course.title}</div>
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>
          Next: {nextChapter?.title?.slice(0, 30) || 'Continue studying'}
        </div>
      </div>

      <div style={{ minWidth: 120, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Progress</span>
          <span style={{ fontSize: 14, fontFamily: "'JetBrains Mono', monospace", fontWeight: 800 }}>{progress}%</span>
        </div>
        <AnimatedProgressBar value={progress} delay={index * 150} />
      </div>

      <Link to="/courses">
        <motion.span whileHover={{ x: 4 }} style={{ fontSize: 14, color: 'var(--color-primary)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'var(--sp-4)' }}>
          Go <ArrowRight size={16} />
        </motion.span>
      </Link>
    </motion.div>
  );
}

function QuickActionCard({ icon, label, description, to, delay }) {
  return (
    <Link to={to}>
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', alignItems: 'flex-start' }}
      >
        <div style={{ width: 44, height: 44, background: 'var(--color-text)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: 4 }}>
          {React.cloneElement(icon, { size: 20 })}
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>{label}</div>
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{description}</div>
      </motion.div>
    </Link>
  );
}

export default function StudentDashboard() {
  const { user } = useStore();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [competencies, setCompetencies] = useState([]);
  const [stats, setStats] = useState({
    avgProgress: 0,
    masteredCount: 0,
    weeklyHours: 0,
    avgMastery: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [coursesData, recsData, compsData] = await Promise.all([
        coursesAPI.getAll(),
        recommendationsAPI.getAll(),
        competenciesAPI.getAll()
      ]);

      setCourses(coursesData.filter(c => c.progress > 0));
      setRecommendations(recsData);
      setCompetencies(compsData);

      // Calculate stats
      const enrolledCourses = coursesData.filter(c => c.progress > 0);
      const avgProgress = enrolledCourses.length > 0
        ? enrolledCourses.reduce((sum, c) => sum + c.progress, 0) / enrolledCourses.length
        : 0;

      const masteredCount = compsData.filter(c => c.mastery >= 80).length;
      const avgMastery = compsData.length > 0
        ? compsData.reduce((sum, c) => sum + c.mastery, 0) / compsData.length
        : 0;

      // Estimate weekly hours based on progress
      const weeklyHours = Math.max(1, Math.floor(avgProgress / 10));

      setStats({
        avgProgress: avgProgress.toFixed(0),
        masteredCount,
        weeklyHours: weeklyHours.toFixed(1),
        avgMastery: avgMastery.toFixed(0)
      });

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader className="spinner" size={40} />
      </div>
    );
  }

  return (
    <div className="page-content" style={{ position: 'relative', zIndex: 10 }}>
      <WelcomeHero name={user?.name} />

      {/* Metric Cards */}
      <div className="grid-4" style={{ marginBottom: 'var(--sp-10)' }}>
        <MotionMetricCard icon={<TrendingUp />} color="var(--color-primary)" value={`${stats.avgProgress}%`} label="Course Progress" change="8% this week" changeDir="up" delay={0.1} />
        <MotionMetricCard icon={<Award />}      color="var(--color-accent)"  value={stats.masteredCount}    label="Competencies Mastered" change="Keep learning!" changeDir="up" delay={0.2} />
        <MotionMetricCard icon={<Clock />}      color="var(--color-info)"    value={stats.weeklyHours}  label="Hours This Week"       change="Great pace!" changeDir="up" delay={0.3} />
        <MotionMetricCard icon={<BarChart2 />}  color="var(--color-success)" value={`${stats.avgMastery}%`}  label="Avg. Mastery Score"    change="3% improvement" changeDir="up" delay={0.4} />
      </div>

      {/* Main content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--sp-8)', marginBottom: 'var(--sp-10)', alignItems: 'start' }}>
        
        {/* Left: Courses */}
        <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <div className="card-header" style={{ marginBottom: 'var(--sp-6)' }}>
            <div>
              <h3 style={{ fontSize: 24, marginBottom: 4 }}>In Progress</h3>
              <p style={{ fontSize: 14, margin: 0, fontWeight: 500 }}>Resume your learning path</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {courses.length > 0 ? (
              courses.map((course, i) => <CourseProgressRow key={course.course_id} course={course} index={i} />)
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--sp-8)' }}>
                No courses in progress. <Link to="/courses" style={{ color: 'var(--color-primary)' }}>Browse courses</Link>
              </p>
            )}
          </div>
        </motion.div>

        {/* Right: AI Rec */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
          {recommendations.length > 0 && <AIRecommendationCard rec={recommendations[0]} />}

          <motion.div
            className="card"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-5)', background: 'var(--color-text)', color: '#fff' }}
          >
             <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }} style={{ fontSize: 40, lineHeight: 1 }}>
              🔥
            </motion.div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--color-accent)', lineHeight: 1.2 }}>
                <CountUpNumber value={7} duration={1000} /> Day Streak
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 500, marginTop: 4 }}>Consistency is key. Great job!</div>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <h3 style={{ fontSize: 24, marginBottom: 'var(--sp-6)' }}>Explore More</h3>
        <div className="grid-4">
          <QuickActionCard icon={<Zap />} label="Quick Quiz" description="5 short questions to test skills" to="/quiz" delay={0.65} />
          <QuickActionCard icon={<Map />} label="Competency Map" description="View your skill knowledge graph" to="/competency-map" delay={0.7} />
          <QuickActionCard icon={<Sparkles />} label="AI Path" description="Unlock your custom curriculum" to="/recommendations" delay={0.75} />
          <QuickActionCard icon={<Star />} label="Certificates" description="Download your achievements" to="/courses" delay={0.8} />
        </div>
      </motion.div>
    </div>
  );
}
