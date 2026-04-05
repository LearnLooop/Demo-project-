import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Clock, CheckCircle, XCircle, Trophy, RotateCcw, Loader } from 'lucide-react';
import useStore from '../store/useStore';
import { quizzesAPI } from '../services/api';

const TOTAL_TIME = 90; // seconds per quiz set

function TimerBar({ timeLeft }) {
  const pct = (timeLeft / TOTAL_TIME) * 100;
  const color = timeLeft < 30 ? 'var(--color-error)' : timeLeft < 60 ? 'var(--color-accent)' : 'var(--color-primary)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Clock size={16} color={color} />
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 16,
        fontWeight: 600,
        color,
        minWidth: 36,
        transition: 'color 200ms',
      }}>
        {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
      </span>
    </div>
  );
}

function AnswerOption({ option, index, selected, submitted, correctIndex, onSelect }) {
  let borderColor = 'var(--color-border)';
  let bg = 'transparent';
  let iconEl = null;

  if (submitted) {
    if (index === correctIndex) {
      borderColor = 'var(--color-success)';
      bg = 'rgba(16,185,129,0.1)';
      iconEl = <CheckCircle size={18} color="var(--color-success)" />;
    } else if (index === selected && index !== correctIndex) {
      borderColor = 'var(--color-error)';
      bg = 'rgba(239,68,68,0.1)';
      iconEl = <XCircle size={18} color="var(--color-error)" />;
    }
  } else if (selected === index) {
    borderColor = 'var(--color-primary)';
    bg = 'rgba(16,185,129,0.1)';
  }

  return (
    <button
      id={`answer-option-${index}`}
      onClick={() => !submitted && onSelect(index)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '14px 16px',
        background: bg,
        border: `2px solid ${borderColor}`,
        borderRadius: 'var(--radius-md)',
        cursor: submitted ? 'default' : 'pointer',
        transition: 'all 200ms var(--ease-quick)',
        textAlign: 'left',
        transform: !submitted && selected === index ? 'scale(1.01)' : 'scale(1)',
      }}
      aria-pressed={selected === index}
    >
      <div style={{
        width: 28, height: 28,
        borderRadius: '50%',
        border: `2px solid ${borderColor === 'var(--color-border)' ? 'var(--color-border)' : borderColor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        fontWeight: 600,
        color: borderColor === 'var(--color-border)' ? 'var(--color-text-muted)' : borderColor,
      }}>
        {String.fromCharCode(65 + index)}
      </div>
      <span style={{ flex: 1, fontSize: 14, color: 'var(--color-text)', fontWeight: 500 }}>
        {option}
      </span>
      {iconEl}
    </button>
  );
}

function ResultScreen({ score, onReset }) {
  const isPassing = score >= 60;
  return (
    <div style={{
      textAlign: 'center',
      padding: 'var(--space-2xl)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 'var(--space-lg)',
    }}>
      <div style={{
        width: 100, height: 100,
        borderRadius: '50%',
        background: isPassing ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
        border: `3px solid ${isPassing ? 'var(--color-success)' : 'var(--color-error)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 40,
      }}>
        {isPassing ? '🎉' : '📚'}
      </div>
      <div>
        <h2 style={{ fontSize: 32, marginBottom: 8 }}>{score}%</h2>
        <p style={{ fontSize: 18, color: isPassing ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 600 }}>
          {isPassing ? 'Excellent Work!' : 'Keep Practicing!'}
        </p>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 8 }}>
          {isPassing
            ? 'Your mastery of these concepts is improving. Check your competency map for updated scores.'
            : 'Don\'t worry — review the explanations and try again. Practice makes perfect!'}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
        <button className="btn btn-secondary" onClick={onReset} id="retry-quiz-btn">
          <RotateCcw size={16} /> Try Again
        </button>
        <button className="btn btn-primary" id="view-map-btn">
          <Trophy size={16} /> View Competency Map
        </button>
      </div>
    </div>
  );
}

export default function Quiz() {
  const { quizState, startQuiz, answerQuestion, nextQuestion, prevQuestion, submitQuiz, resetQuiz } = useStore();
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [localAnswered, setLocalAnswered] = useState(false);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchQuiz();
    return () => clearInterval(timerRef.current);
  }, []);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const data = await quizzesAPI.getAvailable();
      setQuizData(data);
      setQuestions(data.questions || []);
      setTimeLeft(data.time_limit || TOTAL_TIME);
      if (!quizState.active) startQuiz(data.id);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch quiz:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quizState.submitted || questions.length === 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [quizState.submitted, questions.length]);

  const { currentIndex, answers, submitted, score, startTime } = quizState;
  const question = questions[currentIndex];
  const selectedOption = answers[currentIndex] ?? null;

  const handleSelect = (optIndex) => {
    if (submitted || !question) return;
    answerQuestion(currentIndex, optIndex);

    // Flash feedback - but don't show correct answer until submitted
    setLocalAnswered(true);
    setTimeout(() => setLocalAnswered(false), 800);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) nextQuestion();
  };

  const handleSubmit = async () => {
    const timeTaken = startTime ? Math.floor((Date.now() - startTime) / 1000) : TOTAL_TIME;
    await submitQuiz(quizData?.id, answers, timeTaken);
  };

  const handleReset = () => {
    resetQuiz();
    setTimeLeft(quizData?.time_limit || TOTAL_TIME);
    fetchQuiz();
  };

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader className="spinner" size={40} />
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="page-content" style={{ maxWidth: 640, margin: '0 auto' }}>
        <div className="card" style={{ padding: 'var(--sp-8)', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>No quiz questions available.</p>
        </div>
      </div>
    );
  }

  if (submitted && score !== null) {
    return (
      <div className="page-content" style={{ maxWidth: 640, margin: '0 auto' }}>
        <div className="card animate-in animate-in-1">
          <ResultScreen score={score} onReset={handleReset} />
        </div>
      </div>
    );
  }

  if (!question) {
    return null;
  }

  const progressPct = ((currentIndex) / questions.length) * 100;

  return (
    <div className="page-content" style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* Header */}
      <div className="animate-in animate-in-1" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-md)',
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 14,
          color: 'var(--color-text-muted)',
        }}>
          Q {currentIndex + 1} <span style={{ color: 'var(--color-primary)' }}>of</span> {questions.length}
        </span>
        <TimerBar timeLeft={timeLeft} />
      </div>

      {/* Progress bar */}
      <div className="progress-track animate-in animate-in-1" style={{ marginBottom: 'var(--space-xl)', height: 4 }}>
        <div className="progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Question card */}
      <div className={`card animate-in animate-in-2 ${shake ? 'shake' : ''}`} style={{ padding: 'var(--space-xl)' }}>
        {/* Question */}
        <div style={{
          background: 'var(--color-overlay-light)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-md)',
          marginBottom: 'var(--space-xl)',
        }}>
          <p style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600, marginBottom: 8 }}>
            QUESTION {currentIndex + 1}
          </p>
          <p style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--color-text)',
            lineHeight: 1.4,
            margin: 0,
          }}>
            {question.text}
          </p>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 'var(--space-xl)' }}>
          {question.options.map((opt, i) => (
            <AnswerOption
              key={i}
              option={opt}
              index={i}
              selected={selectedOption}
              submitted={false}
              correctIndex={-1}
              onSelect={handleSelect}
            />
          ))}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => prevQuestion()}
            disabled={currentIndex === 0}
            id="prev-question-btn"
          >
            <ArrowLeft size={16} /> Previous
          </button>

          {currentIndex === questions.length - 1 ? (
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              id="submit-quiz-btn"
            >
              Submit Quiz <Trophy size={16} />
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleNext}
              id="next-question-btn"
            >
              Next <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Question dots */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 8,
        marginTop: 'var(--space-md)',
      }}>
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              const diff = i - currentIndex;
              if (diff > 0) {
                for (let j = 0; j < diff; j++) handleNext();
              } else if (diff < 0) {
                for (let j = 0; j < Math.abs(diff); j++) prevQuestion();
              }
            }}
            style={{
              width: 10, height: 10,
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
              background: i === currentIndex
                ? 'var(--color-primary)'
                : answers[i] !== undefined
                  ? 'rgba(16,185,129,0.4)'
                  : 'var(--color-border)',
              transition: 'all 200ms var(--ease-quick)',
              transform: i === currentIndex ? 'scale(1.3)' : 'scale(1)',
            }}
            aria-label={`Question ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
