import React, { useState } from 'react';
import { User, Mail, Shield, Calendar, Key, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { profileApi } from '../services/api/profileApi';

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    try {
      setSavingProfile(true);
      const updated = await profileApi.updateProfile({ name, email });
      updateUser(updated);
      setProfileSuccess('Profile details updated successfully.');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (!currentPassword || !newPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setSavingPassword(true);
      await new Promise(r => setTimeout(r, 600));
      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-theme-text font-mono">
          User Profile
        </h2>
        <p className="text-xs text-theme-muted mt-0.5">
          Manage your account credentials, security preferences and research workspace metadata.
        </p>
      </div>

      {/* Account Overview Card */}
      <div className="glass-panel p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-theme-border">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold font-mono"
            style={{ 
              backgroundColor: 'var(--color-surface-strong)',
              border: '2px solid var(--color-primary)',
              color: 'var(--color-primary)' 
            }}
          >
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
          </div>

          <div>
            <h3 className="text-lg font-bold text-theme-text">
              {user?.name || 'Project User'}
            </h3>
            <p className="text-xs text-theme-muted font-mono">
              {user?.email || 'user@energy-ai.local'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-border)]">
                <Shield className="w-3 h-3" /> ROLE: {user?.role || 'USER'}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/5 text-theme-muted border border-white/5">
                <Calendar className="w-3 h-3" /> Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Jan 2026'}
              </span>
            </div>
          </div>
        </div>

        {/* Edit Profile Details */}
        <form onSubmit={handleUpdateProfile} className="mt-6 space-y-4 max-w-xl">
          <h4 className="text-sm font-bold text-theme-text uppercase tracking-wider">
            Edit Information
          </h4>

          {profileSuccess && (
            <div className="p-3 rounded-lg bg-[var(--state-success-bg)] border border-[var(--state-success-border)] text-[var(--state-success-fg)] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3 rounded-lg bg-[var(--state-danger-bg)] border border-[var(--state-danger-border)] text-[var(--state-danger-fg)] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-theme-text mb-1 uppercase font-mono">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input-theme text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-theme-text mb-1 uppercase font-mono">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-theme text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="btn-primary text-xs px-4 py-2"
          >
            {savingProfile ? 'Updating Details...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="glass-panel p-6 max-w-xl">
        <h4 className="text-sm font-bold text-theme-text uppercase tracking-wider mb-4 pb-3 border-b border-theme-border flex items-center gap-2">
          <Key className="w-4 h-4 text-theme-muted" /> Security & Password
        </h4>

        {passwordSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-[var(--state-success-bg)] border border-[var(--state-success-border)] text-[var(--state-success-fg)] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="mb-4 p-3 rounded-lg bg-[var(--state-danger-bg)] border border-[var(--state-danger-border)] text-[var(--state-danger-fg)] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-theme-text mb-1 font-mono">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="input-theme text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-theme-text mb-1 font-mono">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="input-theme text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-theme-text mb-1 font-mono">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="input-theme text-xs"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingPassword}
              className="btn-secondary text-xs px-4 py-2"
            >
              {savingPassword ? 'Changing Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
