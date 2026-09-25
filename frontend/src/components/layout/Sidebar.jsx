import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  TrendingUp,
  Cpu,
  User,
  Settings,
  Shield,
  Layers,
  FileSpreadsheet,
  Activity,
  Award,
  Sliders,
  Zap,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ mobileOpen, onCloseMobile }) => {
  const { user, isAdmin } = useAuth();

  const userNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Energy Data', path: '/energy-data', icon: Database },
    { label: 'Forecast', path: '/forecast', icon: TrendingUp },
    { label: 'Optimization', path: '/optimization', icon: Cpu },
  ];

  const secondaryNavItems = [
    { label: 'Profile', path: '/profile', icon: User },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const adminNavItems = [
    { label: 'Admin Overview', path: '/admin', icon: Shield, end: true },
    { label: 'Datasets', path: '/admin/datasets', icon: FileSpreadsheet },
    { label: 'Models', path: '/admin/models', icon: Layers },
    { label: 'Training', path: '/admin/training', icon: Activity },
    { label: 'Forecast Metrics', path: '/admin/forecast-performance', icon: TrendingUp },
    { label: 'PPO Metrics', path: '/admin/ppo-performance', icon: Award },
    { label: 'Admin Settings', path: '/admin/settings', icon: Sliders },
  ];

  const renderNavLinks = (items) => (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.path}>
          <NavLink
            to={item.path}
            end={item.end}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                isActive
                  ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/25 font-semibold shadow-sm'
                  : 'border-transparent text-theme-muted hover:text-theme-text hover:bg-white/[0.04]'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 w-64 glass-panel rounded-none border-r border-theme-border z-50 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Logo */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-theme-border">
            <NavLink to="/dashboard" className="flex items-center gap-2.5">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ 
                  backgroundColor: 'var(--color-surface-strong)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-primary)'
                }}
              >
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-theme-text font-mono">
                  ENERGY<span style={{ color: 'var(--color-primary)' }}>.AI</span>
                </span>
                <span className="text-[10px] text-theme-muted tracking-wider uppercase font-mono">
                  Predict & Optimize
                </span>
              </div>
            </NavLink>

            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-theme-muted hover:text-theme-text"
              aria-label="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
            <div>
              <span className="eyebrow block px-3 mb-2">
                Main
              </span>
              {renderNavLinks(userNavItems)}
            </div>

            <div className="pt-2 border-t border-theme-border">
              <span className="eyebrow block px-3 mb-2">
                System
              </span>
              {renderNavLinks(secondaryNavItems)}
            </div>

            {isAdmin && (
              <div className="pt-2 border-t border-theme-border">
                <span className="eyebrow block px-3 mb-2 flex items-center gap-1.5 text-[var(--color-secondary)]">
                  <Shield className="w-3 h-3" /> Admin Suite
                </span>
                {renderNavLinks(adminNavItems)}
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-theme-border text-center">
          <div className="text-[11px] font-mono text-theme-muted">
            Energy Management v2.4
          </div>
          <div className="text-[10px] text-theme-muted mt-0.5">
            PyTorch + Stable-Baselines3
          </div>
        </div>
      </aside>
    </>
  );
};
