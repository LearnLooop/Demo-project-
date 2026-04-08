import React, { useState, useRef } from 'react';
import { Bell, Lock, Palette, User, Save, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import { usersAPI } from '../services/api';

export default function Settings() {
  const { user, setUser, theme, setTheme } = useStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for the forms
  const [profileForm, setProfileForm] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ')[1] || '',
    email: user?.email || '',
    bio: user?.bio || ''
  });
  const [pendingAvatar, setPendingAvatar] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPassword: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      setPendingAvatar(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCancel = () => {
    setProfileForm({
      firstName: user?.name?.split(' ')[0] || '',
      lastName: user?.name?.split(' ')[1] || '',
      email: user?.email || '',
      bio: user?.bio || ''
    });
    setPendingAvatar(null);
    setPasswordForm({ current: '', newPassword: '', confirm: '' });
    setPasswordError('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setPasswordError('');
    try {
      if (activeTab === 'profile') {
        const payload = {
          name: `${profileForm.firstName} ${profileForm.lastName}`.trim(),
          bio: profileForm.bio || null
        };
        if (pendingAvatar) {
            payload.avatar = pendingAvatar;
        }
        const updatedUser = await usersAPI.updateProfile(payload);
        setUser(updatedUser);
        setPendingAvatar(null);
      } else if (activeTab === 'security') {
        if (!passwordForm.current || !passwordForm.newPassword || !passwordForm.confirm) {
            setPasswordError('All password fields are required');
            setIsSaving(false);
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirm) {
            setPasswordError('New passwords do not match');
            setIsSaving(false);
            return;
        }
        if (passwordForm.newPassword.length < 4) {
           setPasswordError('Password must be at least 4 characters');
           setIsSaving(false);
           return;
        }
        await usersAPI.changePassword(passwordForm.current, passwordForm.newPassword);
        setPasswordForm({ current: '', newPassword: '', confirm: '' });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      if (activeTab === 'security') {
          setPasswordError(e.response?.data?.detail || 'Failed to update password');
      }
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'profile',       label: 'Profile',       icon: <User size={16} /> },
    { id: 'notifications', label: 'Notifications',  icon: <Bell size={16} /> },
    { id: 'security',      label: 'Security',       icon: <Lock size={16} /> },
    { id: 'appearance',    label: 'Appearance',     icon: <Palette size={16} /> },
  ];

  return (
    <div className="page-content" style={{ maxWidth: 880, zIndex: 10, position: 'relative' }}>
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 'var(--sp-8)' }}>
        <h1 style={{ fontSize: 40, marginBottom: 'var(--sp-2)' }}>Settings</h1>
        <p style={{ fontSize: 16, fontWeight: 500 }}>Manage your account preferences and learning configuration</p>
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-6)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--sp-3)', overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 16px',
              background: activeTab === tab.id ? 'var(--color-text)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--color-text-muted)',
              border: 'none',
              borderRadius: 'var(--r-full)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 14,
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 200ms ease',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Content */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card" style={{ padding: 'var(--sp-8)' }}>
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-8)' }}>
            
            {/* Avatar Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-6)' }}>
              <div style={{
                  width: 80, height: 80,
                  fontSize: 28, fontWeight: 900,
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                  color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%',
                  boxShadow: 'var(--shadow-md)',
                  overflow: 'hidden'
              }}>
                {pendingAvatar ? (
                  <img src={pendingAvatar} alt="Pending Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : user?.avatar ? (
                  <img src={user.avatar} alt={user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  user?.name?.charAt(0) || 'U'
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 24, margin: '0 0 4px', letterSpacing: '-0.02em' }}>{user?.name}</h3>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)', fontWeight: 500 }}>{user?.email}</p>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileChange} 
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary" style={{ padding: '10px 20px', fontSize: 13 }} onClick={() => fileInputRef.current?.click()}>
                  <Upload size={16} /> Choose Image
                </button>
                {pendingAvatar && (
                  <button className="btn btn-secondary" style={{ padding: '10px 20px', fontSize: 13, background: 'rgba(213,0,0,0.1)', color: 'var(--color-error)' }} onClick={() => setPendingAvatar(null)}>
                    Discard
                  </button>
                )}
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--color-border-bright)' }} />

            {/* Profile Form */}
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input className="form-input" value={profileForm.firstName} onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input className="form-input" value={profileForm.lastName} onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={profileForm.email} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <input className="form-input" value={user?.role} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea 
                className="form-input" 
                placeholder="Tell us about yourself..." 
                value={profileForm.bio}
                onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                style={{ resize: 'vertical', minHeight: 120 }}
              />
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
            {[
              { label: 'Email notifications for new recommendations', defaultChecked: true },
              { label: 'Weekly progress digest',                       defaultChecked: true },
              { label: 'Quiz reminders',                               defaultChecked: false },
              { label: 'Course completion certificates',               defaultChecked: true },
              { label: 'In-app achievement alerts',                    defaultChecked: true },
              { label: 'At-risk student alerts (instructors only)',   defaultChecked: user?.role === 'instructor' },
            ].map((n, i) => (
              <label key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: 'var(--sp-4)', background: 'rgba(255,255,255,0.4)', borderRadius: 'var(--r-md)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>{n.label}</span>
                <input
                  type="checkbox"
                  defaultChecked={n.defaultChecked}
                  style={{ accentColor: 'var(--color-primary)', width: 18, height: 18 }}
                />
              </label>
            ))}
          </div>
        )}

        {activeTab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
            {passwordError && (
               <div style={{ background: 'rgba(213,0,0,0.1)', color: 'var(--color-error)', padding: '12px', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 600 }}>
                 {passwordError}
               </div>
            )}
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={passwordForm.current} onChange={e => setPasswordForm({...passwordForm, current: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={passwordForm.confirm} onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})} />
            </div>
            <div style={{
              background: 'rgba(0,200,83,0.1)',
              border: '1px solid rgba(0,200,83,0.3)',
              borderRadius: 'var(--r-md)',
              padding: 'var(--sp-5)',
              marginTop: 'var(--sp-2)'
            }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-soft)', margin: 0 }}>
                🔒 Two-factor authentication is <strong style={{ color: 'var(--color-success)' }}>enabled</strong> for your account.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-8)' }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 800, marginBottom: 'var(--sp-4)', color: 'var(--color-text-faint)', letterSpacing: '0.1em' }}>APP THEME</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--sp-4)' }}>
                {[
                  { id: 'theme-minimal', label: 'Minimal Clean',  bg: '#F7F7F5', border: '#FF4B2B', text: '#0A0A0A' },
                  { id: 'theme-neo',     label: 'Neo Brutalism',  bg: '#E5FE40', border: '#0A0A0A', text: '#0A0A0A' },
                ].map(t => {
                  const isActive = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      style={{
                        background: t.bg,
                        border: `2px solid ${isActive ? t.border : 'var(--color-border)'}`,
                        borderRadius: 'var(--r-lg)',
                        padding: 'var(--sp-5)',
                        cursor: 'pointer',
                        color: t.text,
                        fontSize: 15,
                        fontWeight: isActive ? 800 : 600,
                        textAlign: 'left',
                        boxShadow: isActive ? '0 8px 24px rgba(0,0,0,0.1)' : 'var(--shadow-sm)',
                        transition: 'all 200ms',
                        position: 'relative'
                      }}
                    >
                      {t.label}
                      {isActive && <div style={{ position: 'absolute', top: 12, right: 12, width: 10, height: 10, borderRadius: '50%', background: t.border }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Global Save Footer */}
        <div style={{ marginTop: 'var(--sp-8)', borderTop: '1px solid var(--color-border-bright)', paddingTop: 'var(--sp-6)', display: 'flex', gap: 'var(--sp-3)' }}>
          <button className="btn btn-primary" onClick={handleSave} style={{ fontSize: 16 }} disabled={isSaving}>
            <Save size={18} /> {isSaving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
          </button>
          <button className="btn btn-secondary" onClick={handleCancel} style={{ fontSize: 16 }}>Cancel</button>
        </div>
      </motion.div>
    </div>
  );
}
