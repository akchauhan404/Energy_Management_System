import React from 'react';

export const LoadingState = ({ message = 'Loading energy data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 glass-panel text-center">
      <div 
        className="w-10 h-10 border-2 rounded-full border-t-transparent animate-spin mb-4"
        style={{ 
          borderColor: 'var(--color-primary)', 
          borderTopColor: 'transparent' 
        }}
      />
      <p className="text-sm font-medium text-theme-muted tracking-wide">
        {message}
      </p>
    </div>
  );
};

export const EmptyState = ({
  icon: Icon,
  title = 'No records found',
  description = 'There is currently no data to display for this view.',
  actionLabel,
  onAction
}) => {
  return (
    <div className="glass-panel p-10 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
      {Icon && (
        <div 
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--color-border-subtle)',
            color: 'var(--color-primary)'
          }}
        >
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-theme-text mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-theme-muted mb-6 leading-relaxed max-w-sm">
        {description}
      </p>
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="btn-primary text-sm px-4 py-2"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export const ErrorState = ({
  message = 'An unexpected error occurred while processing data.',
  onRetry
}) => {
  return (
    <div className="glass-panel p-6 border-[var(--state-danger-border)] bg-[var(--state-danger-bg)] text-center">
      <div className="inline-flex p-3 rounded-full bg-[var(--state-danger-bg)] text-[var(--state-danger-fg)] mb-3">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h4 className="text-base font-semibold text-[var(--state-danger-fg)] mb-1">
        Action Error
      </h4>
      <p className="text-sm text-theme-muted mb-4 max-w-md mx-auto">
        {message}
      </p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="btn-secondary text-xs px-3 py-1.5"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export const Badge = ({ children, variant = 'neutral' }) => {
  const styles = {
    success: 'border-[var(--state-success-border)] bg-[var(--state-success-bg)] text-[var(--state-success-fg)]',
    warning: 'border-[var(--state-warning-border)] bg-[var(--state-warning-bg)] text-[var(--state-warning-fg)]',
    danger: 'border-[var(--state-danger-border)] bg-[var(--state-danger-bg)] text-[var(--state-danger-fg)]',
    info: 'border-[var(--state-info-border)] bg-[var(--state-info-bg)] text-[var(--state-info-fg)]',
    neutral: 'border-[var(--color-border-subtle)] bg-white/5 text-theme-muted',
    primary: 'border-[var(--color-border)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${styles[variant] || styles.neutral}`}>
      {children}
    </span>
  );
};
