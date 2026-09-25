import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name || !email || !password || !confirmPassword) {
      setFormError('Please complete all required fields.');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setFormError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-background pattern-grid flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md glass-panel p-8 relative overflow-hidden">
        <div 
          className="absolute -top-12 -right-12 w-40 h-40 rounded-full pointer-events-none opacity-20 blur-2xl"
          style={{ backgroundColor: 'var(--color-primary)' }}
        />

        <div className="text-center mb-8">
          <div 
            className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-3"
            style={{ 
              backgroundColor: 'var(--color-surface-strong)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-primary)'
            }}
          >
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-theme-text font-mono">
            ENERGY<span style={{ color: 'var(--color-primary)' }}>.AI</span>
          </h2>
          <p className="text-xs text-theme-muted mt-1">
            Create an account to access energy forecasting and dispatch
          </p>
        </div>

        {formError && (
          <div className="mb-5 p-3 rounded-lg bg-[var(--state-danger-bg)] border border-[var(--state-danger-border)] text-[var(--state-danger-fg)] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[var(--state-danger-fg)]" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-theme-text mb-1.5 uppercase font-mono">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              required
              className="input-theme text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-theme-text mb-1.5 uppercase font-mono">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@energy-ai.local"
              required
              className="input-theme text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-theme-text mb-1.5 uppercase font-mono">
              Password (min 8 chars)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter strong password"
              required
              className="input-theme text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-theme-text mb-1.5 uppercase font-mono">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              required
              className="input-theme text-sm"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-2.5 text-sm"
            >
              {submitting ? 'Creating Account...' : 'Register'}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-5 border-t border-theme-border text-center">
          <p className="text-xs text-theme-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[var(--color-primary)] hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
