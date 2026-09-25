import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('researcher@energy-ai.local');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    try {
      setSubmitting(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setFormError(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-background pattern-grid flex flex-col justify-center items-center p-4">
      {/* Container Card */}
      <div className="w-full max-w-md glass-panel p-8 relative overflow-hidden">
        {/* Glow Accent */}
        <div 
          className="absolute -top-12 -right-12 w-40 h-40 rounded-full pointer-events-none opacity-20 blur-2xl"
          style={{ backgroundColor: 'var(--color-primary)' }}
        />

        {/* Brand Header */}
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
            AI-Based Energy Consumption Prediction & Optimization
          </p>
        </div>

        {/* Error Alert */}
        {formError && (
          <div className="mb-5 p-3 rounded-lg bg-[var(--state-danger-bg)] border border-[var(--state-danger-border)] text-[var(--state-danger-fg)] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[var(--state-danger-fg)]" />
            <span>{formError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-theme-text mb-1.5 uppercase font-mono">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. researcher@energy-ai.local"
              required
              className="input-theme text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-theme-text mb-1.5 uppercase font-mono">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="input-theme text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-text p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-2.5 text-sm"
            >
              {submitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </div>
        </form>

        {/* Demo Quick Sign-in hints */}
        <div className="mt-6 pt-5 border-t border-theme-border text-center">
          <p className="text-xs text-theme-muted">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-[var(--color-primary)] hover:underline">
              Create Account
            </Link>
          </p>
          <div className="mt-3 flex items-center justify-center gap-2 text-[11px] font-mono text-theme-muted">
            <button
              type="button"
              onClick={() => { setEmail('researcher@energy-ai.local'); setPassword('password123'); }}
              className="hover:underline text-[var(--color-secondary)]"
            >
              [User Demo]
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => { setEmail('admin@energy-ai.local'); setPassword('adminpass123'); }}
              className="hover:underline text-[var(--color-primary)]"
            >
              [Admin Demo]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
