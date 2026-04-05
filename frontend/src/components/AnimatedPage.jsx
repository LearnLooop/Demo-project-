import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

/* =========================================================
   Reusable animation variants
   ========================================================= */

export const pageVariants = {
  initial:  { opacity: 0, y: 18, filter: 'blur(4px)' },
  animate:  { opacity: 1, y: 0,  filter: 'blur(0px)', transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
  exit:     { opacity: 0, y: -10, filter: 'blur(2px)', transition: { duration: 0.25 } },
};

export const staggerContainer = (staggerChildren = 0.07, delayChildren = 0) => ({
  animate: { transition: { staggerChildren, delayChildren } },
});

export const fadeUpItem = {
  initial:  { opacity: 0, y: 20 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export const fadeInItem = {
  initial:  { opacity: 0 },
  animate:  { opacity: 1, transition: { duration: 0.4 } },
};

export const scaleItem = {
  initial:  { opacity: 0, scale: 0.92 },
  animate:  { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] } },
};

export const slideRightItem = {
  initial:  { opacity: 0, x: 30 },
  animate:  { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit:     { opacity: 0, x: -30, transition: { duration: 0.25 } },
};

export const cardHoverProps = {
  whileHover: { y: -3, scale: 1.01, transition: { duration: 0.25 } },
  whileTap:   { scale: 0.98 },
};

export const buttonTapProps = {
  whileTap:   { scale: 0.96 },
  whileHover: { scale: 1.02 },
};

/* =========================================================
   Animated page wrapper with route transitions
   ========================================================= */
export default function AnimatedPage({ children }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={children?.props?.children?.type?.name || Math.random()}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ flex: 1 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/* =========================================================
   Animated counter hook
   ========================================================= */
export function useAnimatedCounter(target, duration = 1500, suffix = '') {
  const [count, setCount] = React.useState(0);
  const [started, setStarted] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  React.useEffect(() => {
    if (!started) return;
    const numTarget = parseFloat(target.toString().replace(/[^0-9.]/g, ''));
    const isFloat = target.toString().includes('.');
    const decimals = isFloat ? (target.toString().split('.')[1] || '').length : 0;
    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4); // ease-out quart
      const current = eased * numTarget;
      setCount(isFloat ? parseFloat(current.toFixed(decimals)) : Math.floor(current));
      if (progress < 1) requestAnimationFrame(step);
      else setCount(numTarget);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [started, target, duration]);

  return { count, ref };
}

/* =========================================================
   Motion Card — glassmorphism card with hover
   ========================================================= */
export function MotionCard({ children, className = '', style = {}, delay = 0, onClick, id }) {
  return (
    <motion.div
      id={id}
      className={`card ${className}`}
      style={style}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, boxShadow: '0 16px 48px rgba(16,185,129,0.18)', borderColor: 'rgba(16,185,129,0.35)' }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

/* =========================================================
   Motion Metric Card
   ========================================================= */
export function MotionMetricCard({ icon, color, bgColor, value, label, change, changeDir, delay = 0 }) {
  const numericValue = parseFloat(value.toString().replace(/[^0-9.]/g, ''));
  const prefix = value.toString().match(/^[^0-9]*/)?.[0] || '';
  const suffix = value.toString().match(/[^0-9.]+$/)?.[0] || '';
  const { count, ref } = useAnimatedCounter(numericValue, 1400);

  return (
    <motion.div
      ref={ref}
      className="metric-card"
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -5, scale: 1.02 }}
      style={{ '--card-accent-color': color }}
    >
      <div className="noise-overlay" />
      <div className="metric-icon" style={{ background: bgColor || `${color}15` }}>
        {React.cloneElement(icon, { size: 22, color })}
      </div>
      <div className="metric-value">
        {prefix}{count}{suffix}
      </div>
      <div className="metric-label">{label}</div>
      {change && (
        <div className={`metric-change ${changeDir}`}>
          {changeDir === 'up' ? '↑' : '↓'} {change}
        </div>
      )}
    </motion.div>
  );
}

/* =========================================================
   Progress Bar with animation
   ========================================================= */
export function AnimatedProgressBar({ value, color, height = 6, showDot = true, delay = 0 }) {
  const [width, setWidth] = React.useState(0);
  React.useEffect(() => {
    const t = setTimeout(() => setWidth(value), 100 + delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return (
    <div className="progress-track" style={{ height }}>
      <div
        className="progress-fill"
        style={{
          width: `${width}%`,
          background: color || undefined,
          transition: `width ${1000 + delay}ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
        }}
      />
    </div>
  );
}

/* =========================================================
   Stagger list wrapper
   ========================================================= */
export function StaggerList({ children, stagger = 0.08, className = '' }) {
  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      variants={{ animate: { transition: { staggerChildren: stagger } } }}
    >
      {React.Children.map(children, (child, i) =>
        child ? (
          <motion.div
            key={i}
            variants={fadeUpItem}
          >
            {child}
          </motion.div>
        ) : null
      )}
    </motion.div>
  );
}
