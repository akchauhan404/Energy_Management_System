import React from 'react';

export const MetricCard = ({
  title,
  value,
  unit = '',
  delta,
  deltaType = 'neutral', // 'positive' (good reduction or gain), 'negative', 'neutral'
  subtitle,
  icon: Icon
}) => {
  return (
    <div className="glass-panel-interactive p-5 relative overflow-hidden">
      {/* Subtle background glow accent */}
      <div 
        className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none opacity-10 blur-xl"
        style={{ backgroundColor: 'var(--color-primary)' }}
      />

      <div className="flex items-start justify-between">
        <span className="eyebrow">
          {title}
        </span>
        {Icon && (
          <div 
            className="p-2 rounded-lg"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-primary)'
            }}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-theme-text font-mono tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="text-xs sm:text-sm font-medium text-theme-muted font-mono">
            {unit}
          </span>
        )}
      </div>

      {(delta !== undefined || subtitle) && (
        <div className="mt-3 flex items-center justify-between gap-2 text-xs">
          {delta !== undefined && (
            <span
              className={`font-mono font-medium px-2 py-0.5 rounded text-[11px] border ${
                deltaType === 'positive'
                  ? 'border-[var(--state-success-border)] bg-[var(--state-success-bg)] text-[var(--state-success-fg)]'
                  : deltaType === 'negative'
                  ? 'border-[var(--state-danger-border)] bg-[var(--state-danger-bg)] text-[var(--state-danger-fg)]'
                  : 'border-[var(--color-border-subtle)] bg-white/5 text-[var(--color-muted)]'
              }`}
            >
              {delta}
            </span>
          )}
          {subtitle && (
            <span className="text-theme-muted truncate max-w-[180px]">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
