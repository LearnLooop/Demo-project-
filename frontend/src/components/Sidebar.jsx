import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, LayoutDashboard, BookOpen, Map,
  Lightbulb, HelpCircle, Users, AlertTriangle,
  BarChart2, Settings, PlusSquare, LogOut, Shield, User
} from 'lucide-react';
import useStore from '../store/useStore';

const AVATAR_COLORS = [
  '#10B981','#3B82F6','#8B5CF6','#F59E0B','#EF4444','#06B6D4',
];

function NavItem({ to, icon, label, badge, onClick }) {
  const baseStyle = ({ isActive }) => [
    'nav-item',
    isActive ? 'active' : '',
  ].join(' ');

  const inner = (
    <AnimatePresence>
      <motion.span
        className="nav-icon"
        whileHover={{ rotate: 5, scale: 1.1 }}
        transition={{ type: 'spring', stiffness: 400 }}
      >
        {icon}
      </motion.span>
    </AnimatePresence>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="nav-item" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        {inner}
        <span style={{ flex: 1 }}>{label}</span>
        {badge && <span className="nav-badge">{badge}</span>}
      </button>
    );
  }

  return (
    <NavLink to={to} className={baseStyle} end>
      {inner}
      <span style={{ flex: 1 }}>{label}</span>
      {badge && <motion.span
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
        className="nav-badge"
      >
        {badge}
      </motion.span>}
    </NavLink>
  );
}

export default function Sidebar() {
  const { user, logout, isSidebarOpen, toggleSidebar } = useStore();
  const navigate = useNavigate();
  const isInstructor = user?.role === 'instructor';
  const isAdmin = user?.role === 'admin';
  const isStudent = user?.role === 'student';
  const avatarColor = AVATAR_COLORS[(user?.name?.charCodeAt(0) || 0) % AVATAR_COLORS.length] || AVATAR_COLORS[0];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 1024 && isSidebarOpen) toggleSidebar();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isSidebarOpen, toggleSidebar]);

  return (
    <>
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(2px)',
              zIndex: 45,
            }}
            className="mobile-overlay-visible"
          />
        )}
      </AnimatePresence>

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="nav-logo">
          <motion.div
            className="nav-logo-icon"
            whileHover={{ rotate: -5, scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <GraduationCap size={20} color="#fff" />
          </motion.div>
          <div className="nav-logo-text">
            Course<span>Weaver</span>
          </div>
        </div>

        <nav className="nav-section">
          {isStudent && (
            <>
              <div className="nav-section-label">Main</div>
              <NavItem to="/dashboard"      icon={<LayoutDashboard size={17} />} label="Dashboard" />
              <NavItem to="/courses"        icon={<BookOpen size={17} />}        label="My Courses" />
              <NavItem to="/competency-map" icon={<Map size={17} />}             label="Competency Map" />
              <NavItem to="/recommendations" icon={<Lightbulb size={17} />}     label="Recommendations" badge={2} />
              <NavItem to="/quiz"           icon={<HelpCircle size={17} />}      label="Practice Quiz" />
            </>
          )}

          {isInstructor && (
            <>
              <div className="nav-section-label">Teaching</div>
              <NavItem to="/instructor"    icon={<LayoutDashboard size={17} />} label="Overview" />
              <NavItem to="/course-builder" icon={<PlusSquare size={17} />}     label="Course Builder" />
              <NavItem to="/students"      icon={<Users size={17} />}            label="Students" />
              <NavItem to="/at-risk"       icon={<AlertTriangle size={17} />}   label="At-Risk Students" badge={3} />
              <NavItem to="/analytics"     icon={<BarChart2 size={17} />}        label="Analytics" />
            </>
          )}

          {isAdmin && (
            <>
              <div className="nav-section-label">Administration</div>
              <NavItem to="/admin" icon={<Shield size={17} />} label="Admin Panel" />
            </>
          )}

          <div className="nav-section-label">Account</div>
          <NavItem to="/settings" icon={<Settings size={17} />} label="Settings" />
          <NavItem to="/settings" icon={<User size={17} />} label="Profile" />
          <NavItem to="#" icon={<LogOut size={17} />} label="Logout" onClick={handleLogout} />
        </nav>

        <div
          style={{
            padding: '16px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{ width: 36, height: 36, borderRadius: '50%', background: avatarColor, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              user?.name?.charAt(0) || 'U'
            )}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'User'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}
