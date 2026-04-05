import React, { useState, useEffect } from 'react';
import { X, BookOpen, ArrowRight, SortAsc, Loader } from 'lucide-react';
import { competenciesAPI } from '../services/api';

function getMasteryLabel(m) {
  if (m === 100) return { label: 'Mastered',    color: '#10B981', bg: 'rgba(16,185,129,0.85)' };
  if (m >= 75)   return { label: 'Strong',      color: '#34d399', bg: 'rgba(52,211,153,0.75)' };
  if (m >= 25)   return { label: 'In Progress', color: '#10B981', bg: 'rgba(16,185,129,0.45)' };
  if (m >= 1)    return { label: 'Weak',        color: '#F59E0B', bg: 'rgba(245,158,11,0.45)' };
  return              { label: 'Untouched',   color: '#64748B', bg: 'transparent' };
}

function CompetencyCell({ comp, selected, onClick }) {
  const { label, bg } = getMasteryLabel(comp.mastery);
  const isSelected = selected?.id === comp.id;

  return (
    <button
      id={`comp-cell-${comp.id}`}
      onClick={() => onClick(comp)}
      style={{
        background: comp.mastery === 0 ? 'var(--color-bg-elevated)' : bg,
        border: `2px solid ${isSelected ? 'var(--color-primary)' : comp.mastery === 0 ? 'var(--color-border)' : 'transparent'}`,
        borderRadius: 'var(--radius-md)',
        padding: '12px 8px',
        cursor: 'pointer',
        transition: 'all 250ms var(--ease-quick)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        textAlign: 'center',
        boxShadow: isSelected ? '0 0 0 3px rgba(16,185,129,0.3)' : 'none',
        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
      }}
      aria-label={`${comp.name}: ${comp.mastery}% mastery (${label})`}
    >
      <span style={{
        fontFamily: "'Outfit', sans-serif",
        fontSize: 22,
        fontWeight: 800,
        color: comp.mastery === 0 ? 'var(--color-text-muted)' : 'white',
        lineHeight: 1,
        textShadow: comp.mastery > 0 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
      }}>
        {comp.mastery}%
      </span>
      <span style={{
        fontSize: 11,
        fontWeight: 600,
        color: comp.mastery === 0 ? 'var(--color-text-muted)' : 'rgba(255,255,255,0.9)',
        lineHeight: 1.2,
      }}>
        {comp.name}
      </span>
    </button>
  );
}

function SidePanel({ comp, onClose }) {
  if (!comp) return null;
  const { label, color } = getMasteryLabel(comp.mastery);

  return (
    <div className="slide-in-right" style={{
      background: 'var(--color-bg-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-xl)',
      position: 'sticky',
      top: 80,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
        <h3>{comp.name}</h3>
        <button className="btn-icon" onClick={onClose} aria-label="Close panel">
          <X size={18} />
        </button>
      </div>

      {/* Mastery ring */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="var(--color-border)" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="50"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 50}`}
              strokeDashoffset={`${2 * Math.PI * 50 * (1 - comp.mastery / 100)}`}
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 1s var(--ease-smooth)' }}
            />
            <text x="60" y="55" textAnchor="middle" fill="var(--color-text)"
              style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 800 }}>
              {comp.mastery}%
            </text>
            <text x="60" y="74" textAnchor="middle" fill="var(--color-text-muted)" fontSize="11">
              {label}
            </text>
          </svg>
        </div>
      </div>

      <div className="divider" />

      <div style={{ marginBottom: 'var(--space-md)' }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>CATEGORY</p>
        <span className="badge badge-info">{comp.category}</span>
      </div>

      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>RELATED CHAPTERS</p>
        {['Review fundamentals', 'Practice exercises', 'Assessment quiz'].map((ch, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 0',
            borderBottom: i < 2 ? '1px solid rgba(51,65,85,0.4)' : 'none',
          }}>
            <BookOpen size={14} color="var(--color-primary)" />
            <span style={{ fontSize: 13, color: 'var(--color-text)' }}>{ch}</span>
          </div>
        ))}
      </div>

      <button className="btn btn-primary" id="practice-btn" style={{ width: '100%', justifyContent: 'center' }}>
        Practice Now <ArrowRight size={16} />
      </button>
    </div>
  );
}

export default function CompetencyMap() {
  const [selected, setSelected] = useState(null);
  const [sortBy, setSortBy] = useState('default');
  const [loading, setLoading] = useState(true);
  const [competencies, setCompetencies] = useState([]);

  useEffect(() => {
    fetchCompetencies();
  }, []);

  const fetchCompetencies = async () => {
    try {
      setLoading(true);
      const data = await competenciesAPI.getAll();
      setCompetencies(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch competencies:', error);
      setLoading(false);
    }
  };

  const handleClick = (comp) => {
    setSelected(selected?.id === comp.id ? null : comp);
  };

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader className="spinner" size={40} />
      </div>
    );
  }

  const sorted = [...competencies].sort((a, b) => {
    if (sortBy === 'mastery-asc') return a.mastery - b.mastery;
    if (sortBy === 'mastery-desc') return b.mastery - a.mastery;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  const masteredCount = competencies.filter(c => c.mastery === 100).length;
  const avgMastery = competencies.length > 0 
    ? Math.round(competencies.reduce((a, c) => a + c.mastery, 0) / competencies.length)
    : 0;

  return (
    <div className="page-content">
      <div className="page-header animate-in animate-in-1">
        <h1>Competency Map</h1>
        <p>Click any cell to explore related chapters and deepen your mastery</p>
      </div>

      {/* Stats row */}
      <div className="grid-4" style={{ marginBottom: 'var(--space-xl)' }}>
        {[
          { label: 'Total Skills',     value: competencies.length, color: 'var(--color-info)' },
          { label: 'Mastered',         value: masteredCount,        color: 'var(--color-success)' },
          { label: 'In Progress',      value: competencies.filter(c => c.mastery > 0 && c.mastery < 100).length, color: 'var(--color-primary)' },
          { label: 'Avg. Mastery',     value: `${avgMastery}%`,    color: 'var(--color-accent)' },
        ].map((s, i) => (
          <div key={s.label} className={`card animate-in animate-in-${i + 2}`} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: s.color }}>
              {s.value}
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Legend + Sort */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-lg)',
        flexWrap: 'wrap',
        gap: 'var(--space-md)',
      }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Mastered (100%)',    bg: 'rgba(16,185,129,0.85)' },
            { label: 'Strong (75–99%)',    bg: 'rgba(52,211,153,0.7)' },
            { label: 'In Progress (25–74%)', bg: 'rgba(16,185,129,0.4)' },
            { label: 'Weak (1–24%)',       bg: 'rgba(245,158,11,0.4)' },
            { label: 'Untouched (0%)',     bg: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 14, height: 14, borderRadius: 3,
                background: l.bg,
                border: l.border || 'none',
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{l.label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SortAsc size={16} color="var(--color-text-muted)" />
          <select
            className="form-select"
            style={{ width: 180 }}
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            id="competency-sort-select"
          >
            <option value="default">Default Order</option>
            <option value="mastery-desc">Mastery: High → Low</option>
            <option value="mastery-asc">Mastery: Low → High</option>
            <option value="name">Name: A → Z</option>
          </select>
        </div>
      </div>

      {/* Grid + panel */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 300px' : '1fr', gap: 'var(--space-xl)', alignItems: 'start' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 'var(--space-sm)',
        }}>
          {sorted.map((comp, i) => (
            <div key={comp.id} className={`animate-in animate-in-${Math.min(i % 6 + 1, 6)}`}>
              <CompetencyCell comp={comp} selected={selected} onClick={handleClick} />
            </div>
          ))}
        </div>

        {selected && (
          <SidePanel comp={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
}
