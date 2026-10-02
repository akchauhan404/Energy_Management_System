import React, { useEffect, useRef, useState } from 'react';
import {
  Menu,
  LogOut,
  Shield,
  Check,
  Palette,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Link } from 'react-router-dom';

export const Header = ({ title, subtitle, onToggleMobileSidebar }) => {
  const { user, logout, isAdmin } = useAuth();

  const {
    theme,
    currentThemeObj,
    availableThemes,
    setTheme
  } = useTheme();

  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef(null);

  /* Close popup when clicking outside */
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        themeMenuRef.current &&
        !themeMenuRef.current.contains(event.target)
      ) {
        setThemeMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  /* Close popup with Escape */
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setThemeMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  /* Select theme */
  const handleThemeSelect = (themeId) => {
    setTheme(themeId);
    setThemeMenuOpen(false);
  };

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
                <Shield className="w-3 h-3" />
                ADMIN
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


      {/* Right: Theme, Profile & Logout */}
      <div className="flex items-center gap-3 sm:gap-4">

        {/* ═══════════════════════════════════════════════
            THEME SELECTOR
            ═══════════════════════════════════════════════ */}
        <div
          ref={themeMenuRef}
          className="relative hidden md:block"
        >

          {/* Theme Button */}
          <button
  type="button"
  onClick={() => setThemeMenuOpen((open) => !open)}
  aria-haspopup="true"
  aria-expanded={themeMenuOpen}
  title={`Theme: ${currentThemeObj.name}`}
  className={`relative w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-200 ${
    themeMenuOpen
      ? 'border-[var(--color-primary)]'
      : 'border-theme-border hover:border-[var(--color-primary)]'
  }`}
>
  {/* Color Theme Icon */}
  <Palette className="w-4 h-4 text-[var(--color-primary)]" />
</button>


          {/* Theme Popup */}
          {themeMenuOpen && (
            <div
              className="theme-popover absolute right-0 top-full mt-2 w-[390px] rounded-2xl border border-theme-border bg-[var(--color-surface-strong)] p-3 shadow-2xl"
              role="menu"
            >

              {/* Popup Header */}
              <div className="flex items-center gap-2 px-2 pb-3">

                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--color-border-subtle)',
                    color: 'var(--color-primary)'
                  }}
                >
                  <Palette className="w-4 h-4" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-theme-text">
                    Color Theme
                  </p>

                  <p className="text-[11px] text-theme-muted">
                    Choose your workspace appearance
                  </p>
                </div>

              </div>


              {/* ═══════════════════════════════════════════
                  2 × 3 THEME GRID
                  ═══════════════════════════════════════════ */}
              <div className="grid grid-cols-2 gap-3">

                {availableThemes.map((item) => {
                  const isActive = item.id === theme;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={isActive}
                      onClick={() => handleThemeSelect(item.id)}
                      className={`theme-option ${
                        isActive ? 'theme-option-active' : ''
                      }`}
                    >

                      {/* Theme preview dots */}
                      <div className="flex items-center gap-1.5">
                        {item.dots.map((color, index) => (
                          <span
                            key={index}
                            className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
                            style={{
                              backgroundColor: color
                            }}
                          />
                        ))}
                      </div>


                      {/* Theme information */}
                      <div className="mt-4">

                        <span className="block text-sm font-semibold text-theme-text">
                          {item.name}
                        </span>

                        <span className="block mt-1 text-[10px] uppercase tracking-wider font-mono text-theme-muted">
                          {item.mode}
                        </span>

                        {isActive && (
                          <span className="block mt-1 text-[10px] font-medium text-[var(--color-primary)]">
                            Active theme
                          </span>
                        )}

                      </div>


                      {/* Active check */}
                      {isActive && (
                        <span className="theme-active-check">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}

                    </button>
                  );
                })}


                {/* More Settings */}
                <Link
                  to="/settings"
                  onClick={() => setThemeMenuOpen(false)}
                  className="theme-option theme-more-option"
                >

                  <div className="w-8 h-8 rounded-lg flex items-center justify-center theme-more-icon">
                    <ArrowRight className="w-4 h-4" />
                  </div>

                  <div className="mt-4">

                    <span className="block text-sm font-semibold text-theme-text">
                      More Settings
                    </span>

                    <span className="block mt-1 text-[10px] text-theme-muted">
                      Open theme settings
                    </span>

                  </div>

                </Link>

              </div>

            </div>
          )}
        </div>


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
            {user?.name
              ? user.name.slice(0, 2).toUpperCase()
              : 'US'}
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