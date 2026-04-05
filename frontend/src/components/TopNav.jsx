import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Search, Bell, X } from 'lucide-react';
import useStore from '../store/useStore';

const PAGE_META = {
  '/dashboard':       { title: 'Dashboard',        sub: 'Your learning overview' },
  '/courses':         { title: 'My Courses',        sub: 'Your enrolled courses' },
  '/competency-map':  { title: 'Competency Map',    sub: 'Visualize your mastery' },
  '/recommendations': { title: 'Recommendations',   sub: 'Personalized for you' },
  '/quiz':            { title: 'Practice Quiz',     sub: 'Test your knowledge' },
  '/instructor':      { title: 'Instructor Overview', sub: 'Monitor your courses' },
  '/course-builder':  { title: 'Course Builder',    sub: 'Create engaging content' },
  '/students':        { title: 'Students',          sub: 'All enrolled students' },
  '/at-risk':         { title: 'At-Risk Students',  sub: 'Students needing attention' },
  '/analytics':       { title: 'Analytics',         sub: 'Data-driven insights' },
  '/settings':        { title: 'Settings',          sub: 'Account preferences' },
};

export default function TopNav() {
  const { toggleSidebar } = useStore();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const meta = PAGE_META[location.pathname] || { title: 'CourseWeaver', sub: '' };

  return (
    <header className="top-nav">
      {/* Mobile menu toggle */}
      <motion.button
        className="btn-icon"
        onClick={toggleSidebar}
        whileTap={{ scale: 0.9 }}
        id="mobile-menu-btn"
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </motion.button>

      {/* Page title */}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ flex: 1 }}
        >
          <div className="top-nav-title">{meta.title}</div>
          {meta.sub && <div className="top-nav-sub">{meta.sub}</div>}
        </motion.div>
      </AnimatePresence>

      {/* Search */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <input
              autoFocus
              className="form-input"
              placeholder="Search courses, topics…"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              style={{ borderRadius: 'var(--r-full)', padding: '7px 16px', fontSize: 13 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <motion.button
          className="btn-icon"
          onClick={() => setSearchOpen(s => !s)}
          whileTap={{ scale: 0.9 }}
          whileHover={{ rotate: searchOpen ? 90 : 0 }}
          id="search-btn"
          aria-label="Toggle search"
        >
          {searchOpen ? <X size={18} /> : <Search size={18} />}
        </motion.button>

        <motion.button
          className="btn-icon"
          whileTap={{ scale: 0.9 }}
          id="notifications-btn"
          aria-label="Notifications"
          style={{ position: 'relative' }}
        >
          <Bell size={18} />
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
            style={{
              position: 'absolute', top: 7, right: 7,
              width: 7, height: 7,
              borderRadius: '50%',
              background: 'var(--color-error)',
              border: '1.5px solid var(--color-bg)',
            }}
          />
        </motion.button>

        {/* Avatar */}
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          style={{
            width: 40, height: 40,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: '#fff',
            cursor: 'pointer',
            border: '2px solid rgba(16,185,129,0.35)',
            boxShadow: '0 0 0 3px rgba(16,185,129,0.1)',
            marginLeft: 4,
          }}
        >
          {useStore.getState().user?.name?.charAt(0) || 'U'}
        </motion.div>
      </div>
    </header>
  );
}
