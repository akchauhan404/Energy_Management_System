import React from 'react';
import { Menu, LogOut, User as UserIcon, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Link } from 'react-router-dom';

export const Header = ({ title, subtitle, onToggleMobileSidebar }) => {
  const { user, logout, isAdmin } = useAuth();
  const { currentThemeObj } = useTheme();

  return (
    <header className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-theme-border glass-panel rounded-none sticky top-0 z-30">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-theme-muted hover:text-theme-text hover:bg-white/5"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-theme-text flex items-center gap-2">
            {title}
            {isAdmin && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Shield className="w-3 h-3" /> ADMIN
              </span>
            )}
          </h1>
          {subtitle && (
            <p className="text-xs text-theme-muted hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: Theme Indicator, Profile & Logout */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Active Theme Badge */}
        <Link
          to="/settings"
          className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono text-theme-muted hover:text-theme-text glass-panel-interactive border border-theme-border"
          title="Change Color Theme"
        >
          <div className="flex items-center gap-1">
            {currentThemeObj.dots.map((c, i) => (
              <span 
                key={i} 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: c }} 
              />
            ))}
          </div>
          <span>{currentThemeObj.name}</span>
        </Link>

        {/* User Profile Info */}
        <Link
          to="/profile"
          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
        >
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-mono"
            style={{ 
              backgroundColor: 'var(--color-surface-strong)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-primary)' 
            }}
          >
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
          </div>
          <div className="hidden sm:block text-left text-xs">
            <span className="block font-semibold text-theme-text leading-tight">
              {user?.name || 'User'}
            </span>
            <span className="text-[10px] text-theme-muted font-mono">
              {user?.role || 'RESEARCHER'}
            </span>
          </div>
        </Link>

        {/* Logout */}
        <button
          type="button"
          onClick={logout}
          className="p-2 rounded-lg text-theme-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
