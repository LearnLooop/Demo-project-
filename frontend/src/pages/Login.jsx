import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import useStore from '../store/useStore';

// We drop the strict structure and dynamically validate inside onSubmit 
// so we don't have to mount two separate Zod schemas.
const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  name: z.string().optional(),
});

export default function Login() {
  const navigate = useNavigate();
  const { login, register: registerUser } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [showPwd, setShowPwd] = useState(false);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Custom role state specifically for Sign Up
  const [selectedRole, setSelectedRole] = useState('student');

  const { register, handleSubmit, formState: { errors }, reset } = useForm({ 
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '' }
  });

  const onSubmit = async (data) => {
    setLoading(true); setServerError('');
    
    // Dynamic Registration Override
    if (!isLogin) {
      if (!data.name || data.name.trim() === '') {
        setServerError('Name is definitively required to sign up.');
        setLoading(false);
        return;
      }
      const result = await registerUser(data.email, data.password, data.name, selectedRole);
      if (result.success) {
        navigate(result.role === 'instructor' ? '/instructor' : '/dashboard');
      } else {
        setServerError(result.error);
      }
    } else {
      // Standard Login Flow
      const result = await login(data.email, data.password);
      if (result.success) {
        navigate(result.role === 'instructor' ? '/instructor' : '/dashboard');
      } else {
        setServerError(result.error);
      }
    }
    setLoading(false);
  };

  const fillDemo = (role) => {
    setIsLogin(true);
    onSubmit({ email: `${role}@demo.com`, password: 'demo' });
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setServerError('');
    reset(); // Clear fields when swapping
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--sp-4)', position: 'relative', overflow: 'hidden',
    }}>

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 10 }}>
        {/* Logo Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 'var(--sp-8)' }}>
          <h1 style={{ fontSize: 48, fontWeight: 900, marginBottom: 8, color: 'var(--color-text)', letterSpacing: '-0.06em' }}>
            CourseWeaver.
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 16, fontWeight: 500 }}>
            The highly creative platform for learning.
          </p>
        </motion.div>

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
          style={{ 
            padding: 'var(--sp-8)', 
            background: 'rgba(255,255,255,0.4)', 
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid rgba(255,255,255,0.9)', 
            borderRadius: 'var(--r-2xl)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.06), inset 0 2px 0 rgba(255,255,255,0.8)' 
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-6)' }}>
            <h2 style={{ fontSize: 24, margin: 0 }}>
              {isLogin ? 'Sign in to continue' : 'Create an Account'}
            </h2>
            <button 
              onClick={toggleMode} 
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
            >
               {isLogin ? <><UserPlus size={16}/> Sign Up</> : <><LogIn size={16}/> Sign In</>}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {isLogin && (
              <motion.div key="demo" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ display: 'flex', gap: 'var(--sp-3)', marginBottom: 'var(--sp-6)' }}>
                <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => fillDemo('student')} style={{ flex: 1, background: 'rgba(255,255,255,0.8)', border: '1px solid var(--color-border-bright)', padding: '12px', borderRadius: 'var(--r-full)', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: 'var(--color-text)', boxShadow: 'var(--shadow-sm)' }}>
                  🎓 Student Demo
                </motion.button>
                <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => fillDemo('instructor')} style={{ flex: 1, background: 'rgba(255,255,255,0.8)', border: '1px solid var(--color-border-bright)', padding: '12px', borderRadius: 'var(--r-full)', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: 'var(--color-text)', boxShadow: 'var(--shadow-sm)' }}>
                  🏫 Instructor Demo
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit(onSubmit)}>
            
            {/* Dynamic Registration Fields */}
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div key="signup-fields" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <div className="form-group" style={{ marginBottom: 'var(--sp-4)' }}>
                    <label className="form-label" htmlFor="login-name">Full Name</label>
                    <input id="login-name" type="text" className="form-input" placeholder="Alex Johnson" {...register('name')} style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 'var(--r-lg)' }} />
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: 'var(--sp-6)' }}>
                    <label className="form-label">I want to register as a:</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        type="button"
                        onClick={() => setSelectedRole('student')}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', borderRadius: 'var(--r-lg)', border: `2px solid ${selectedRole === 'student' ? 'var(--color-primary)' : 'var(--color-border)'}`, background: selectedRole === 'student' ? 'rgba(0,0,0,0.03)' : 'transparent', fontWeight: 600, cursor: 'pointer', color: 'var(--color-text)' }}
                      >
                        👨‍🎓 Student
                      </button>
                      <button 
                        type="button"
                        onClick={() => setSelectedRole('instructor')}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', borderRadius: 'var(--r-lg)', border: `2px solid ${selectedRole === 'instructor' ? 'var(--color-primary)' : 'var(--color-border)'}`, background: selectedRole === 'instructor' ? 'rgba(0,0,0,0.03)' : 'transparent', fontWeight: 600, cursor: 'pointer', color: 'var(--color-text)' }}
                      >
                        🧑‍🏫 Instructor
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="form-group" style={{ marginBottom: 'var(--sp-4)' }}>
              <label className="form-label" htmlFor="login-email">Email</label>
              <input id="login-email" type="email" className={`form-input ${errors.email ? 'error' : ''}`} placeholder="you@example.com" {...register('email')} style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 'var(--r-lg)' }} />
              {errors.email && <span className="form-error" style={{ color: 'var(--color-error)' }}>{errors.email.message}</span>}
            </div>

            <div className="form-group" style={{ marginBottom: 'var(--sp-6)' }}>
              <label className="form-label" htmlFor="login-password">Password</label>
              <div style={{ position: 'relative' }}>
                <input id="login-password" type={showPwd ? 'text' : 'password'} className={`form-input ${errors.password ? 'error' : ''}`} placeholder="••••••••" {...register('password')} style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 'var(--r-lg)' }} />
                <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 12, top: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <span className="form-error" style={{ color: 'var(--color-error)' }}>{errors.password.message}</span>}
            </div>

            {serverError && (
              <div style={{ background: 'rgba(213,0,0,0.1)', color: 'var(--color-error)', padding: '12px', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 600, marginBottom: 'var(--sp-4)' }}>
                {serverError}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: 16 }}>
              {loading ? <span className="spinner" /> : <>{isLogin ? 'Access Account' : 'Create Account'} <ArrowRight size={18} /></>}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
