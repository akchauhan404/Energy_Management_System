import React from 'react';
import { Sliders, Shield, Zap, Lock } from 'lucide-react';
import { Badge } from '../../components/common/States';

export const AdminSettings = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-theme-border">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-theme-text font-mono flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            System Configuration & Model Contracts
          </h2>
          <p className="text-xs text-theme-muted mt-0.5">
            Authoritative parameters, model weights contract, and PPO environment configuration.
          </p>
        </div>
      </div>

      {/* PPO Environment Contract */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-theme-border">
          <div>
            <h3 className="text-sm font-bold text-theme-text uppercase tracking-wider">
              PPO Environment Parameter Contract
            </h3>
            <p className="text-xs text-theme-muted">
              Frozen environment simulation constants governing dispatch policies.
            </p>
          </div>
          <Badge variant="primary">Locked Contract</Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <span className="text-theme-muted block text-[11px]">Time Step</span>
            <span className="text-sm font-bold text-theme-text mt-0.5 block">30 minutes</span>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <span className="text-theme-muted block text-[11px]">Steps / Day</span>
            <span className="text-sm font-bold text-theme-text mt-0.5 block">48 steps</span>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <span className="text-theme-muted block text-[11px]">Initial Battery SOC</span>
            <span className="text-sm font-bold text-theme-text mt-0.5 block">0.50 (50%)</span>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <span className="text-theme-muted block text-[11px]">SOC Min / Max</span>
            <span className="text-sm font-bold text-theme-text mt-0.5 block">0.10 / 0.90</span>
          </div>

          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <span className="text-theme-muted block text-[11px]">Battery Capacity</span>
            <span className="text-sm font-bold text-[var(--color-primary)] mt-0.5 block">10.0 kWh</span>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <span className="text-theme-muted block text-[11px]">Max Power (C/D)</span>
            <span className="text-sm font-bold text-theme-text mt-0.5 block">3.0 kW</span>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <span className="text-theme-muted block text-[11px]">C/D Efficiency</span>
            <span className="text-sm font-bold text-theme-text mt-0.5 block">0.95 (95%)</span>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <span className="text-theme-muted block text-[11px]">Background Peak</span>
            <span className="text-sm font-bold text-[var(--color-accent)] mt-0.5 block">6.0 kW</span>
          </div>
        </div>
      </div>

      {/* Forecast Feature Contract */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-theme-border">
          <div>
            <h3 className="text-sm font-bold text-theme-text uppercase tracking-wider">
              15-Feature Forecast Preprocessing Contract
            </h3>
            <p className="text-xs text-theme-muted">
              Authoritative feature contract enforced between Node.js and Python Transformer inference.
            </p>
          </div>
          <Badge variant="success">15 Features</Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-xs">
          {[
            'energy_kwh (Lag 0)',
            'hour_sin',
            'hour_cos',
            'dow_sin',
            'dow_cos',
            'month_sin',
            'month_cos',
            'lag_1 (30 min)',
            'lag_2 (60 min)',
            'lag_4 (2 hours)',
            'lag_48 (24 hours)',
            'rolling_mean_2',
            'rolling_mean_4',
            'rolling_mean_48',
            'rolling_max_48'
          ].map((feat, idx) => (
            <div key={idx} className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-theme-text">
              <span className="text-theme-muted mr-1.5">{idx + 1}.</span>
              <span>{feat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
