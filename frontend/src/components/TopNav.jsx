import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Search, Bell, X, Check, Loader, MessageCircle } from 'lucide-react';
import useStore from '../store/useStore';
import { notificationsAPI, searchAPI } from '../services/api';

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
  const { toggleSidebar, user, toggleChat, isChatOpen } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  
  const meta = PAGE_META[location.pathname] || { title: 'CourseWeaver', sub: '' };

  // Fetch notifications
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await notificationsAPI.getAll();
        setNotifications(res || []);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };
    if (user) {
      fetchNotifs();
    }
  }, [user]);

  // Handle Search Debounce
  useEffect(() => {
    if (!searchVal.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchAPI.search(searchVal);
        setSearchResults(results || []);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    
    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchVal]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(notifications.map(n => ({...n, read: true})));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchResultClick = (result) => {
    setSearchOpen(false);
    setSearchVal('');
    if (result.type === 'course') {
        const isInstructor = user?.role === 'instructor';
        navigate(isInstructor ? `/course-builder/${result.id}` : `/courses/${result.id}`);
    }
  };

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
            style={{ overflow: 'visible', position: 'relative' }}
          >
            <input
              autoFocus
              className="form-input"
              placeholder="Search courses, topics…"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              style={{ borderRadius: 'var(--r-full)', padding: '7px 16px', fontSize: 13, width: '100%' }}
            />
            {/* Search Dropdown */}
            {searchVal.trim().length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 8,
                background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-md)', maxHeight: 300, overflowY: 'auto', zIndex: 100
              }}>
                {searchLoading ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)' }}><Loader size={16} className="spinner" /></div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(res => (
                    <div 
                      key={`${res.type}-${res.id}`}
                      onClick={() => handleSearchResultClick(res)}
                      style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{res.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', gap: 6, marginTop: 4 }}>
                        <span style={{ textTransform: 'uppercase', fontWeight: 700 }}>{res.type}</span>
                        {res.metadata?.level && <span>• {res.metadata.level}</span>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>No results found</div>
                )}
              </div>
            )}
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
        
        {/* Toggle Live Chat */}
        <motion.button
          className="btn-icon"
          onClick={toggleChat}
          whileTap={{ scale: 0.9 }}
          style={{ background: isChatOpen ? 'var(--color-primary)' : 'transparent', color: isChatOpen ? '#fff' : 'inherit' }}
        >
          <MessageCircle size={18} />
        </motion.button>

        <div style={{ position: 'relative' }}>
          <motion.button
            className="btn-icon"
            whileTap={{ scale: 0.9 }}
            onClick={() => setNotifOpen(!notifOpen)}
            id="notifications-btn"
            aria-label="Notifications"
            style={{ position: 'relative' }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                style={{
                  position: 'absolute', top: -2, right: -2,
                  minWidth: 16, height: 16,
                  borderRadius: '16px',
                  background: 'var(--color-error)',
                  border: '1.5px solid var(--color-bg)',
                  color: '#fff', fontSize: 9, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 4px'
                }}
              >
                {unreadCount}
              </motion.span>
            )}
          </motion.button>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 12,
                  width: 320, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-lg)', zIndex: 100, overflow: 'hidden'
                }}
              >
                <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg)' }}>
                  <h3 style={{ fontSize: 14, margin: 0 }}>Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}>
                      <Check size={12} /> Mark all read
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <div key={n.id} style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', background: n.read ? 'transparent' : 'rgba(16,185,129,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{n.title}</span>
                          {!n.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)' }} />}
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.4 }}>{n.message}</p>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      <Bell size={24} style={{ opacity: 0.2, marginBottom: 8 }} />
                      <div style={{ fontSize: 13 }}>No notifications</div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar */}
        <Link to="/settings" style={{ textDecoration: 'none' }}>
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
              overflow: 'hidden'
            }}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              user?.name?.charAt(0) || 'U'
            )}
          </motion.div>
        </Link>
      </div>
    </header>
  );
}
