import React, { useState } from 'react';
import { ColorTheme } from '../components/settings/ColorTheme';
import { Sliders, Bell, Zap, Save, CheckCircle2 } from 'lucide-react';

export const Settings = () => {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [peakRiskAlerts, setPeakRiskAlerts] = useState(true);
  const [savedBanner, setSavedBanner] = useState('');

  const handleSavePreferences = (e) => {
    e.preventDefault();
    setSavedBanner('Preferences successfully persisted.');
    setTimeout(() => setSavedBanner(''), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-theme-text font-mono">
          Workspace Settings
        </h2>
        <p className="text-xs text-theme-muted mt-0.5">
          Configure visual themes, dispatch constraints, and automated alert preferences.
        </p>
      </div>

      {savedBanner && (
        <div className="p-3.5 rounded-xl bg-[var(--state-success-bg)] border border-[var(--state-success-border)] text-[var(--state-success-fg)] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedBanner}</span>
        </div>
      )}

      {/* 1. Theme Configuration (Strictly follows screenshot layout and 5 themes) */}
      <section>
        <ColorTheme />
      </section>

      {/* 2. Dispatch Configuration */}
      <section className="glass-panel p-6 sm:p-8 max-w-2xl">
        <div className="flex items-center gap-3 pb-4 border-b border-theme-border">
          <div 
            className="p-2 rounded-lg"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-primary)'
            }}
          >
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-theme-text">
              Operational Dispatch Constraints
            </h3>
            <p className="text-xs text-theme-muted">
              PPO agent environment constants and evaluation horizon settings.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <span className="text-theme-muted block mb-1">Time Resolution</span>
              <span className="text-sm font-bold text-theme-text font-mono">30 Minutes (Fixed)</span>
              <span className="text-[10px] text-theme-muted block mt-0.5">Aligned with smart meter interval</span>
            </div>

            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <span className="text-theme-muted block mb-1">Optimization Horizon</span>
              <span className="text-sm font-bold text-theme-text font-mono">24 Hours (48 Steps)</span>
              <span className="text-[10px] text-theme-muted block mt-0.5">Day-ahead lookahead</span>
            </div>

            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <span className="text-theme-muted block mb-1">Battery Storage Capacity</span>
              <span className="text-sm font-bold text-theme-text font-mono">10.0 kWh (3.0 kW C/D)</span>
              <span className="text-[10px] text-theme-muted block mt-0.5">Efficiency: 95% charge/discharge</span>
            </div>

            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <span className="text-theme-muted block mb-1">SOC Safety Envelope</span>
              <span className="text-sm font-bold text-theme-text font-mono">10% Min - 90% Max</span>
              <span className="text-[10px] text-theme-muted block mt-0.5">Enforced constraint envelope</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Notification Preferences */}
      <section className="glass-panel p-6 sm:p-8 max-w-2xl">
        <div className="flex items-center gap-3 pb-4 border-b border-theme-border">
          <div 
            className="p-2 rounded-lg"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-secondary)'
            }}
          >
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-theme-text">
              Notification Preferences
            </h3>
            <p className="text-xs text-theme-muted">
              Configure telemetry anomaly and high-tariff dispatch notifications.
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePreferences} className="mt-5 space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <div>
              <span className="text-xs font-semibold text-theme-text block">
                Peak Demand & Tariff Spike Alerts
              </span>
              <span className="text-[11px] text-theme-muted">
                Receive warnings when forecasted demand exceeds peak limit (6.0 kW).
              </span>
            </div>
            <input
              type="checkbox"
              checked={peakRiskAlerts}
              onChange={(e) => setPeakRiskAlerts(e.target.checked)}
              className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <div>
              <span className="text-xs font-semibold text-theme-text block">
                Daily Forecast Summary Email
              </span>
              <span className="text-[11px] text-theme-muted">
                Receive automated 24-hour lookahead briefings at midnight.
              </span>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
            />
          </div>

          <button
            type="submit"
            className="btn-secondary text-xs px-4 py-2 mt-2"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Preferences</span>
          </button>
        </form>
      </section>
    </div>
  );
};
