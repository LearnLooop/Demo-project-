import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import useStore from './store/useStore';

import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import ThreeCanvas from './components/ThreeCanvas'; // Added this line
import Confetti from './components/Confetti';
import AIAssistant from './components/AIAssistant';

import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import Courses from './pages/Courses';
import CompetencyMap from './pages/CompetencyMap';
import Recommendations from './pages/Recommendations';
import Quiz from './pages/Quiz';
import InstructorDashboard from './pages/InstructorDashboard';
import CourseBuilder from './pages/CourseBuilder';
import Students from './pages/Students';
import AtRisk from './pages/AtRisk';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import AdminPanel from './pages/AdminPanel'; // Added Admin Panel

import './index.css';

const pageVariants = {
  initial: { opacity: 0, y: 16, filter: 'blur(4px)' },
  animate: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] }
  },
  exit: {
    opacity: 0, y: -10, filter: 'blur(2px)',
    transition: { duration: 0.22 }
  },
};

function AppLayout({ children }) {
  const location = useLocation();
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <TopNav />
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
        <AIAssistant />
      </div>
    </div>
  );
}

function PrivateRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRole && user?.role !== requiredRole) {
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to={user?.role === 'instructor' ? '/instructor' : '/dashboard'} replace />;
  }
  return children;
}

function HomeRedirect() {
  const { isAuthenticated, user } = useStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to={user?.role === 'instructor' ? '/instructor' : '/dashboard'} replace />;
}

function RoutesWithTransitions() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<HomeRedirect />} />

        {/* Student Routes */}
        <Route path="/dashboard" element={
          <PrivateRoute requiredRole="student">
            <AppLayout><StudentDashboard /></AppLayout>
          </PrivateRoute>
        } />
        <Route path="/courses" element={
          <PrivateRoute requiredRole="student">
            <AppLayout><Courses /></AppLayout>
          </PrivateRoute>
        } />
        <Route path="/competency-map" element={
          <PrivateRoute requiredRole="student">
            <AppLayout><CompetencyMap /></AppLayout>
          </PrivateRoute>
        } />
        <Route path="/recommendations" element={
          <PrivateRoute requiredRole="student">
            <AppLayout><Recommendations /></AppLayout>
          </PrivateRoute>
        } />
        <Route path="/quiz" element={
          <PrivateRoute requiredRole="student">
            <AppLayout><Quiz /></AppLayout>
          </PrivateRoute>
        } />

        {/* Instructor Routes */}
        <Route path="/instructor" element={
          <PrivateRoute requiredRole="instructor">
            <AppLayout><InstructorDashboard /></AppLayout>
          </PrivateRoute>
        } />
        <Route path="/course-builder" element={
          <PrivateRoute requiredRole="instructor">
            <AppLayout><CourseBuilder /></AppLayout>
          </PrivateRoute>
        } />
        <Route path="/students" element={
          <PrivateRoute requiredRole="instructor">
            <AppLayout><Students /></AppLayout>
          </PrivateRoute>
        } />
        <Route path="/at-risk" element={
          <PrivateRoute requiredRole="instructor">
            <AppLayout><AtRisk /></AppLayout>
          </PrivateRoute>
        } />
        <Route path="/analytics" element={
          <PrivateRoute requiredRole="instructor">
            <AppLayout><Analytics /></AppLayout>
          </PrivateRoute>
        } />

        {/* Admin Route */}
        <Route path="/admin" element={
          <PrivateRoute requiredRole="admin">
            <AppLayout><AdminPanel /></AppLayout>
          </PrivateRoute>
        } />

        {/* Common Routes */}
        <Route path="/settings" element={
          <PrivateRoute>
            <AppLayout><Settings /></AppLayout>
          </PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const { theme, closeSidebar, initAuth, showConfetti } = useStore();

  React.useEffect(() => {
    initAuth();
  }, [initAuth]);

  React.useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  React.useEffect(() => {
    const handleRouteChange = () => closeSidebar();
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, [closeSidebar]);

  return (
    <BrowserRouter>
      <ThreeCanvas />
      {showConfetti && <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 }}><Confetti active={showConfetti} onComplete={() => {}} /></div>}
      <RoutesWithTransitions />
    </BrowserRouter>
  );
}
