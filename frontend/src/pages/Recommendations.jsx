import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Clock, ArrowRight, TrendingUp, Star, Zap, Loader } from 'lucide-react';
import { recommendationsAPI } from '../services/api';

function RecommendationCard({ rec, index }) {
  const priorityStyle = {
    high:   { color: 'var(--color-error)',   label: 'High Priority', bg: 'rgba(239,68,68,0.12)' },
    medium: { color: 'var(--color-accent)',  label: 'Medium Priority', bg: 'rgba(245,158,11,0.12)' },
    low:    { color: 'var(--color-info)',    label: 'Low Priority',   bg: 'rgba(59,130,246,0.12)' },
  };
  const pStyle = priorityStyle[rec.priority];

  return (
    <div className={`ai-glow-card card animate-in animate-in-${index + 2}`} style={{ padding: 'var(--space-xl)' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="sparkle-icon" style={{ fontSize: 24 }}>✦</span>
          <div>
            <p style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 600, margin: 0, letterSpacing: '0.08em' }}>
              RECOMMENDED FOR YOU
            </p>
            <h3 style={{ margin: 0 }}>{rec.chapter_title}</h3>
          </div>
        </div>
        <span className="badge" style={{ background: pStyle.bg, color: pStyle.color }}>
          {pStyle.label}
        </span>
      </div>

      {/* Course info */}
      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
        From: <span style={{ color: 'var(--color-text)' }}>{rec.course_title}</span>
      </p>

      {/* Reasoning */}
      <div style={{
        background: 'rgba(16,185,129,0.06)',
        border: '1px solid rgba(16,185,129,0.15)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-md)',
        marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <Zap size={14} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 13, color: 'var(--color-text)', margin: 0, lineHeight: 1.6 }}>
            {rec.reason}
          </p>
        </div>
      </div>

      {/* Mastery projection */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <TrendingUp size={14} color="var(--color-primary)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>Mastery Projection</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>CURRENT</p>
            <div style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 28,
              fontWeight: 800,
              color: 'var(--color-accent)',
              lineHeight: 1,
            }}>
              {Math.round(rec.current_mastery)}%
            </div>
            <div className="progress-track" style={{ marginTop: 6, height: 4 }}>
              <div className="progress-fill" style={{
                width: `${rec.current_mastery}%`,
                background: 'var(--color-accent)',
              }} />
            </div>
          </div>
          <ArrowRight size={20} color="var(--color-primary)" />
          <div>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>EXPECTED</p>
            <div style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 28,
              fontWeight: 800,
              color: 'var(--color-primary)',
              lineHeight: 1,
            }}>
              {Math.round(rec.expected_mastery)}%
            </div>
            <div className="progress-track" style={{ marginTop: 6, height: 4 }}>
              <div className="progress-fill" style={{ width: `${rec.expected_mastery}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="badge badge-gray">
            <Clock size={10} /> {rec.estimated_time} min
          </span>
          <span className="badge badge-primary">
            {rec.related_competency}
          </span>
        </div>
        <Link to="/quiz" className="btn btn-primary" id={`start-rec-${rec.id}-btn`}>
          Start Learning <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

export default function Recommendations() {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const data = await recommendationsAPI.getAll();
      setRecommendations(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
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
    <div className="page-content">
      <div className="page-header animate-in animate-in-1">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="sparkle-icon" style={{ fontSize: 28 }}>✦</span>
          <h1>AI Recommendations</h1>
        </div>
        <p>Personalized learning paths crafted by our adaptive intelligence engine based on your performance data</p>
      </div>

      {/* How it works banner */}
      <div className="animate-in animate-in-1" style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.05))',
        border: '1px solid rgba(16,185,129,0.2)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-lg)',
        marginBottom: 'var(--space-xl)',
        display: 'flex',
        gap: 'var(--space-lg)',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <Star size={20} color="var(--color-primary)" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, color: 'var(--color-text)', fontWeight: 600, margin: 0 }}>
            How CourseWeaver's AI works
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
            Our adaptive engine analyzes your quiz scores, time-on-task, competency gaps, and learning velocity to surface exactly what you need next — before you even know you need it.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
        {recommendations.length > 0 ? (
          recommendations.map((rec, i) => (
            <RecommendationCard key={rec.id} rec={rec} index={i} />
          ))
        ) : (
          <div className="card" style={{ padding: 'var(--sp-8)', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>No recommendations available yet. Complete some quizzes to get personalized suggestions!</p>
          </div>
        )}
      </div>

      {/* "Why this?" CTA */}
      <div className="animate-in animate-in-6" style={{
        textAlign: 'center',
        marginTop: 'var(--space-2xl)',
        padding: 'var(--space-xl)',
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
      }}>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 }}>
          🤔 Curious about these recommendations?
        </p>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
          View your full competency map to understand how your learning data drives these suggestions.
        </p>
        <Link to="/competency-map" className="btn btn-secondary">
          View Competency Map
        </Link>
      </div>
    </div>
  );
}
