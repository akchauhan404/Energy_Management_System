import React, { useState, useEffect } from 'react';
import { Layers, Cpu, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { adminApi } from '../../services/api/adminApi';
import { LoadingState, Badge } from '../../components/common/States';

export const Models = () => {
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        const data = await adminApi.getModels();
        setModels(data || {});
      } catch (err) {
        console.error('Failed to load models:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, []);

  if (loading) {
    return <LoadingState message="Loading approved model registries..." />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-theme-border">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-theme-text font-mono flex items-center gap-2">
            <Layers className="w-5 h-5 text-[var(--color-primary)]" />
            Model Artifact Registry
          </h2>
          <p className="text-xs text-theme-muted mt-0.5">
            Production versions of time-series forecasting transformers and reinforcement learning dispatch policies.
          </p>
        </div>
      </div>

      {/* 1. Forecast Model Registry */}
      <div className="glass-panel p-6">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-theme-text uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--color-primary)]" />
            Time-Series Forecasting Models
          </h3>
          <p className="text-xs text-theme-muted mt-0.5">
            Evaluated on held-out test splits with fixed 48-step 30-minute interval resolution.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-theme-border">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-white/[0.03] border-b border-theme-border text-theme-muted uppercase font-mono tracking-wider">
                <th className="py-3 px-4">Model Name</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Architecture</th>
                <th className="py-3 px-4 text-center">Lookback</th>
                <th className="py-3 px-4 text-center">Horizon</th>
                <th className="py-3 px-4 text-center">Interval</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] font-mono">
              {models?.forecastModels?.map((m) => (
                <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-theme-text">
                    {m.name}
                  </td>
                  <td className="py-3.5 px-4 text-[var(--color-primary)]">
                    {m.version}
                  </td>
                  <td className="py-3.5 px-4 font-sans text-theme-text">
                    {m.architecture}
                  </td>
                  <td className="py-3.5 px-4 text-center text-theme-muted">
                    {m.lookback} steps
                  </td>
                  <td className="py-3.5 px-4 text-center text-theme-text font-bold">
                    {m.horizon} steps (24h)
                  </td>
                  <td className="py-3.5 px-4 text-center text-theme-muted">
                    {m.sampling_interval_minutes} min
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Badge variant={m.isApproved ? 'primary' : 'neutral'}>
                      {m.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right text-theme-muted">
                    {new Date(m.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Reinforcement Learning PPO Registry */}
      <div className="glass-panel p-6">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-theme-text uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[var(--color-secondary)]" />
            Reinforcement Learning Dispatch Models (PPO)
          </h3>
          <p className="text-xs text-theme-muted mt-0.5">
            Trained in simulated microgrid environment for dynamic storage and load shifting control.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-theme-border">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-white/[0.03] border-b border-theme-border text-theme-muted uppercase font-mono tracking-wider">
                <th className="py-3 px-4">Model Name</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Algorithm</th>
                <th className="py-3 px-4">Policy Architecture</th>
                <th className="py-3 px-4 text-center">Horizon</th>
                <th className="py-3 px-4 text-center">Interval</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] font-mono">
              {models?.ppoModels?.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-theme-text">
                    {p.name}
                  </td>
                  <td className="py-3.5 px-4 text-[var(--color-secondary)]">
                    {p.version}
                  </td>
                  <td className="py-3.5 px-4 font-sans text-theme-text">
                    {p.algorithm}
                  </td>
                  <td className="py-3.5 px-4 text-theme-muted font-sans">
                    {p.policy}
                  </td>
                  <td className="py-3.5 px-4 text-center text-theme-text font-bold">
                    {p.horizon} steps (24h)
                  </td>
                  <td className="py-3.5 px-4 text-center text-theme-muted">
                    {p.sampling_interval_minutes} min
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Badge variant={p.isApproved ? 'success' : 'neutral'}>
                      {p.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right text-theme-muted">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
