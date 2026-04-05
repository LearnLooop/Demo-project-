import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle } from 'lucide-react';

export default function QuizBuilder({ questions = [], onUpdate }) {
  const addQuestion = () => {
    const newQ = {
      id: `q-${Date.now()}`,
      text: '',
      type: 'MCQ',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 10,
      tags: []
    };
    onUpdate([...questions, newQ]);
  };

  const updateQuestion = (id, updates) => {
    onUpdate(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const deleteQuestion = (id) => {
    onUpdate(questions.filter(q => q.id !== id));
  };

  const handleOptionChange = (questionId, optIndex, value) => {
    onUpdate(questions.map(q => {
      if (q.id === questionId) {
        const newOptions = [...q.options];
        newOptions[optIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  return (
    <div style={{ marginTop: 'var(--space-md)' }}>
      <h4 style={{ marginBottom: 'var(--space-md)' }}>Questions</h4>
      {questions.map((q, idx) => (
        <div key={q.id} style={{
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-md)',
          marginBottom: 'var(--space-md)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
            <span style={{ fontWeight: 600 }}>Question {idx + 1}</span>
            <button className="btn-icon" onClick={() => deleteQuestion(q.id)} style={{ color: 'var(--color-error)' }}>
              <Trash2 size={16} />
            </button>
          </div>

          <textarea
            className="form-textarea"
            placeholder="Enter question text..."
            value={q.text}
            onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
            style={{ marginBottom: 'var(--space-sm)' }}
          />

          <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-sm)' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label" style={{ fontSize: 11 }}>Type</label>
              <select
                className="form-select"
                value={q.type}
                onChange={(e) => updateQuestion(q.id, { type: e.target.value, options: e.target.value === 'TRUE_FALSE' ? ['True', 'False'] : ['', '', '', ''] })}
              >
                <option value="MCQ">Multiple Choice</option>
                <option value="TRUE_FALSE">True / False</option>
              </select>
            </div>
            <div className="form-group" style={{ width: 80 }}>
              <label className="form-label" style={{ fontSize: 11 }}>Points</label>
              <input
                className="form-input"
                type="number"
                value={q.points}
                onChange={(e) => updateQuestion(q.id, { points: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label" style={{ fontSize: 11 }}>Competency Tags</label>
              <input
                className="form-input"
                placeholder="e.g. Variables, Math"
                value={q.tags.join(', ')}
                onChange={(e) => updateQuestion(q.id, { tags: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) })}
              />
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: 11 }}>Options & Correct Answer</label>
            {q.type === 'MCQ' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {q.options.map((opt, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      className={`btn-icon ${q.correct_answer === opt && opt ? 'active' : ''}`}
                      style={{ color: q.correct_answer === opt && opt ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
                      onClick={() => updateQuestion(q.id, { correct_answer: opt })}
                      title="Set as correct answer"
                    >
                      <CheckCircle size={16} />
                    </button>
                    <input
                      className="form-input"
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) => {
                        handleOptionChange(q.id, i, e.target.value);
                        if (q.correct_answer === opt) updateQuestion(q.id, { correct_answer: e.target.value });
                      }}
                      style={{ flex: 1 }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 12 }}>
                {['True', 'False'].map(opt => (
                  <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name={`q-${q.id}-correct`}
                      checked={q.correct_answer === opt}
                      onChange={() => updateQuestion(q.id, { correct_answer: opt })}
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                    <span style={{ fontSize: 13 }}>{opt}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      <button className="btn btn-secondary btn-sm" onClick={addQuestion} style={{ width: '100%', justifyContent: 'center' }}>
        <Plus size={14} /> Add Question
      </button>
    </div>
  );
}
