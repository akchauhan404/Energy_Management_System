import React from 'react';
import { Palette, Monitor, Check, Info } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ColorTheme = () => {
  const {
    theme,
    selectedThemeId,
    currentThemeObj,
    followSystem,
    setTheme,
    setFollowSystem,
    availableThemes
  } = useTheme();

  return (
    <div className="glass-panel p-6 sm:p-8 max-w-2xl">
      {/* Header with Palette Icon and Title */}
      <div className="flex items-center gap-3 pb-4 border-b border-theme-border">
        <div 
          className="p-2 rounded-lg"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--color-border-subtle)',
            color: 'var(--color-primary)'
          }}
        >
          <Palette className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-theme-text">
            Color Theme
          </h2>
          <p className="text-xs sm:text-sm text-theme-muted mt-0.5">
            Personalize your workspace with energy-aware glassmorphic color palettes.
          </p>
        </div>
      </div>

      {/* Follow System Preference Card */}
      <div className="mt-6 p-4 rounded-xl glass-panel-interactive flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div 
            className="p-2 rounded-lg mt-0.5 text-theme-muted"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
          >
            <Monitor className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <label 
              htmlFor="system-pref-toggle" 
              className="text-sm font-semibold text-theme-text block cursor-pointer"
            >
              Follow system preference
            </label>
            <span className="text-xs text-theme-muted block mt-0.5">
              Automatically switch between light and dark themes
            </span>
          </div>
        </div>

        {/* Accessible Switch Toggle */}
        <button
          id="system-pref-toggle"
          type="button"
          role="switch"
          aria-checked={followSystem}
          aria-label="Follow system preference for color theme"
          onClick={() => setFollowSystem(!followSystem)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 ${
            followSystem ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-surface-raised)]'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              followSystem ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* 5 Theme Cards Grid */}
      <div 
        className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5"
        role="radiogroup"
        aria-label="Color theme selection"
      >
        {availableThemes.map((item) => {
          const isSelected = item.id === theme;

          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${item.name} theme`}
              onClick={() => setTheme(item.id)}
              className={`relative text-left p-4 rounded-xl transition-all duration-200 outline-none flex flex-col justify-between h-28 group ${
                isSelected
                  ? 'border-2 shadow-glow-primary scale-[1.01]'
                  : 'glass-panel-interactive border border-theme-border opacity-90 hover:opacity-100 hover:scale-[1.01]'
              }`}
              style={{
                borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border-subtle)',
                backgroundColor: isSelected ? 'var(--color-surface-strong)' : 'var(--color-surface)'
              }}
            >
              {/* Top Row: Preview Dots + Checkmark Badge */}
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  {item.dots.map((dotColor, dotIdx) => (
                    <span
                      key={dotIdx}
                      className="w-4 h-4 rounded-full border border-black/20 shadow-sm"
                      style={{ backgroundColor: dotColor }}
                    />
                  ))}
                </div>

                {isSelected && (
                  <span 
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      color: item.mode === 'light' ? '#ffffff' : '#07111f'
                    }}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                  </span>
                )}
              </div>

              {/* Bottom Row: Theme Title */}
              <div>
                <span className="text-sm font-semibold tracking-tight text-theme-text block">
                  {item.name}
                </span>
                <span className="text-[11px] text-theme-muted uppercase tracking-wider font-mono">
                  {item.mode}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Theme Information Panel */}
      <div 
        className="mt-6 p-3.5 rounded-xl flex items-center gap-2.5 text-xs sm:text-sm font-medium"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--color-border-subtle)',
          color: 'var(--color-text)'
        }}
      >
        <Info className="w-4 h-4 text-theme-muted shrink-0" aria-hidden="true" />
        <span>
          Active: <strong className="font-bold text-theme-text">{currentThemeObj.name}</strong>
          {followSystem ? (
            <span className="text-theme-muted ml-1.5">
              (Synchronized to operating system preference)
            </span>
          ) : (
            <span className="text-theme-muted ml-1.5">
              (Custom selection preserved)
            </span>
          )}
        </span>
      </div>
    </div>
  );
};
