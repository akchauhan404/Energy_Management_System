import React, { useState, useEffect } from 'react';
import { TrendingUp, Info, AlertTriangle, Layers, Activity } from 'lucide-react';
import { ActualVsForecastChart } from '../../components/charts/ActualVsForecastChart';
import { adminApi } from '../../services/api/adminApi';
import { LoadingState, Badge } from '../../components/common/States';

export const ForecastPerformance = () => {
  const [loading, setLoading] = useState(true);
  const [perfData, setPerfData] = useState(null);

  useEffect(() => {
    const fetchPerf = async () => {
      try {
        setLoading(true);
        const data = await adminApi.getForecastPerformance();
        setPerfData(data);
      } catch (err) {
        console.error('Failed to load forecast performance:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPerf();
  }, []);

  if (loading) {
    return <LoadingState message="Loading forecast model benchmark evaluation metrics..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-theme-border">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-theme-text font-mono flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[var(--color-primary)]" />
            Forecast Model Evaluation Benchmarks
          </h2>
          <p className="text-xs text-theme-muted mt-0.5">
            Empirical comparative analysis across deep-learning architectures and statistical baselines on held-out LCL test data.
          </p>
        </div>
      </div>

      {/* Mandatory Scientific Statement (Master Document Section 39 & 41) */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-semibold text-amber-200 mb-0.5">
            Comparative Benchmark Disclosure:
          </strong>
          <span>
            The GRU baseline benchmark currently achieves the lowest numerical error across test metrics (MAE: 53.2501 vs 61.7247; RMSE: 76.4766 vs 89.4116; R²: 0.9638 vs 0.9505). The Horizon-Specific Multi-Scale Transformer remains the selected project forecasting artifact due to its multi-scale attention mechanisms and direct Captum feature attribution capability.
          </span>
        </div>
      </div>

      {/* Top Metric Cards: Transformer vs GRU Head-to-Head */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 border-l-4 border-l-[var(--color-primary)]">
          <span className="text-xs text-theme-muted uppercase tracking-wider font-mono block">
            Transformer MAE / RMSE
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[var(--color-primary)]">
              61.72
            </span>
            <span className="text-xs font-mono text-theme-muted">
              / 89.41 RMSE
            </span>
          </div>
          <span className="text-[11px] text-theme-muted block mt-1">
            MAPE: 5.158% • sMAPE: 5.004%
          </span>
        </div>

        <div className="glass-panel p-5 border-l-4 border-l-[var(--color-secondary)]">
          <span className="text-xs text-theme-muted uppercase tracking-wider font-mono block">
            GRU Benchmark MAE / RMSE
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[var(--color-secondary)]">
              53.25
            </span>
            <span className="text-xs font-mono text-theme-muted">
              / 76.48 RMSE
            </span>
          </div>
          <span className="text-[11px] text-[var(--state-success-fg)] block mt-1 font-mono">
            Lowest Test Error (MAPE: 4.506%)
          </span>
        </div>

        <div className="glass-panel p-5">
          <span className="eyebrow block">
            Coefficient of Determination (R²)
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-theme-text tabular-nums">
              0.9505
            </span>
            <span className="text-xs text-theme-muted font-mono">
              (GRU: 0.9638)
            </span>
          </div>
          <span className="text-[11px] text-[var(--state-success-fg)] block mt-1 font-mono">
            High variance capture (&gt;95%)
          </span>
        </div>

        <div className="glass-panel p-5">
          <span className="text-xs text-theme-muted uppercase tracking-wider font-mono block">
            Evaluation Horizon
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-theme-text">
              48 Steps
            </span>
            <span className="text-xs text-theme-muted font-mono">
              (24 Hours)
            </span>
          </div>
          <span className="text-[11px] text-theme-muted block mt-1">
            30-min sampling resolution
          </span>
        </div>
      </div>

      {/* Actual vs Forecast Benchmark Chart */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-theme-text uppercase tracking-wider">
              Test Set Trajectory Comparison: Ground Truth vs Architectures
            </h3>
            <p className="text-xs text-theme-muted">
              Visualizing prediction alignment against actual held-out 48-step series.
            </p>
          </div>
          <Badge variant="primary">Held-Out Test Horizon</Badge>
        </div>

        <ActualVsForecastChart height={360} />
      </div>

      {/* Benchmark Metric Comparison Table */}
      <div className="glass-panel p-6">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-theme-text uppercase tracking-wider">
            Quantitative Test Metric Benchmark Table
          </h3>
          <p className="text-xs text-theme-muted">
            Evaluation metrics computed strictly over the 48-step forecast horizon on test split.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-theme-border">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-white/[0.03] border-b border-theme-border text-theme-muted uppercase font-mono tracking-wider">
                <th className="py-3 px-4">Forecasting Method</th>
                <th className="py-3 px-4 text-right">MAE</th>
                <th className="py-3 px-4 text-right">RMSE</th>
                <th className="py-3 px-4 text-right">MAPE (%)</th>
                <th className="py-3 px-4 text-right">sMAPE (%)</th>
                <th className="py-3 px-4 text-right">R²</th>
                <th className="py-3 px-4">Architectural Role & Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] font-mono">
              {perfData?.benchmarks?.map((bm, i) => {
                const isTransformer = bm.method.includes('Transformer');
                const isGru = bm.method.includes('GRU');

                return (
                  <tr 
                    key={i} 
                    className={`transition-colors ${
                      isTransformer 
                        ? 'bg-[var(--color-primary)]/5 hover:bg-[var(--color-primary)]/10' 
                        : isGru 
                        ? 'bg-[var(--color-secondary)]/5 hover:bg-[var(--color-secondary)]/10'
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold text-theme-text flex items-center gap-2">
                      {isTransformer && <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />}
                      {isGru && <span className="w-2 h-2 rounded-full bg-[var(--color-secondary)]" />}
                      {bm.method}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-theme-text">
                      {bm.mae.toFixed(4)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-theme-text">
                      {bm.rmse.toFixed(4)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-theme-text">
                      {bm.mape}
                    </td>
                    <td className="py-3.5 px-4 text-right text-theme-text">
                      {bm.smape}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-bold ${bm.r2 > 0.9 ? 'text-[var(--state-success-fg)]' : 'text-[var(--state-danger-fg)]'}`}>
                      {bm.r2.toFixed(4)}
                    </td>
                    <td className="py-3.5 px-4 font-sans text-theme-muted text-[11px]">
                      {bm.note}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
