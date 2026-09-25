import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info, Activity, Clock, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Badge } from '../common/States';

export const ForecastSummary = ({
  summary,
  modelName,
  modelVersion,
  isExplaining,
  onToggleExplain,
  isExplanationOpen
}) => {
  return (
    <div className="glass-panel p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-theme-border">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-theme-text">
              24-Hour Horizon Forecast Summary
            </h3>
            <Badge variant="primary">{modelVersion || 'v2.2.0'}</Badge>
          </div>
          <p className="text-xs text-theme-muted mt-0.5">
            Architecture: {modelName || 'Horizon-Specific Multi-Scale Transformer'} (48 steps @ 30m)
          </p>
        </div>

        {/* Primary Action: Explain Forecast (Note: clean styling, no AI magic icon) */}
        <button
          type="button"
          onClick={onToggleExplain}
          className="btn-primary text-xs px-4 py-2"
          aria-expanded={isExplanationOpen}
        >
          <span>{isExplanationOpen ? 'Hide Explanation' : 'Explain Forecast'}</span>
          {isExplanationOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-[var(--color-border-subtle)]">
          <span className="eyebrow flex items-center gap-1.5 mb-1.5">
            <Clock className="w-3.5 h-3.5 text-theme-muted" /> Horizon
          </span>
          <span className="text-lg font-bold text-theme-text font-mono tabular-nums block">
            24 Hours
          </span>
          <span className="text-[11px] text-theme-muted block mt-1 font-mono">
            48 steps • 30m
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-[var(--color-border-subtle)]">
          <span className="eyebrow flex items-center gap-1.5 mb-1.5">
            <Zap className="w-3.5 h-3.5 text-[var(--color-primary)]" /> Peak Forecast
          </span>
          <span className="text-lg font-bold text-[var(--color-primary)] font-mono tabular-nums block">
            {summary?.peak_forecast_kwh ?? '3.400'}
          </span>
          <span className="text-[11px] text-theme-muted block mt-1 font-mono">
            kWh per step
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-[var(--color-border-subtle)]">
          <span className="eyebrow flex items-center gap-1.5 mb-1.5">
            <Activity className="w-3.5 h-3.5 text-[var(--color-secondary)]" /> Average Load
          </span>
          <span className="text-lg font-bold text-[var(--color-secondary)] font-mono tabular-nums block">
            {summary?.avg_forecast_kwh ?? '1.874'}
          </span>
          <span className="text-[11px] text-theme-muted block mt-1 font-mono">
            kWh per step
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-[var(--color-border-subtle)]">
          <span className="eyebrow flex items-center gap-1.5 mb-1.5">
            <Zap className="w-3.5 h-3.5 text-[var(--color-accent)]" /> Total Expected
          </span>
          <span className="text-lg font-bold text-[var(--color-accent)] font-mono tabular-nums block">
            {summary?.total_forecast_kwh ?? '89.952'}
          </span>
          <span className="text-[11px] text-theme-muted block mt-1 font-mono">
            kWh cumulative
          </span>
        </div>
      </div>
    </div>
  );
};

export const ForecastExplanation = ({ explanations = [], isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="glass-panel p-6 border-t-2 border-t-[var(--color-primary)] animate-fadeIn transition-all duration-300">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h4 className="text-sm font-bold text-theme-text">
            Forecast Feature Attribution (Captum Integrated Gradients)
          </h4>
          <p className="text-xs text-theme-muted mt-0.5">
            Decomposition of input feature influence on the 24-hour Transformer forecast trajectory.
          </p>
        </div>
        <Badge variant="primary">15 Model Features</Badge>
      </div>

      {/* Attribution Bars & Descriptions */}
      <div className="space-y-3 mt-4">
        {explanations.map((item, idx) => {
          const isPositive = item.direction === 'POSITIVE';
          const absVal = Math.abs(item.contribution);
          const barWidth = Math.min(100, Math.round(absVal * 280));

          return (
            <div 
              key={item.feature || idx}
              className="p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-[var(--color-border)] transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-theme-text font-semibold">
                    {item.feature}
                  </span>
                  {item.label && (
                    <span className="text-theme-muted">
                      ({item.label})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 font-mono">
                  <span 
                    className={`inline-flex items-center gap-0.5 font-bold ${
                      isPositive ? 'text-[var(--state-success-fg)]' : 'text-[var(--state-warning-fg)]'
                    }`}
                  >
                    {isPositive ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                    {item.contribution > 0 ? `+${item.contribution.toFixed(3)}` : item.contribution.toFixed(3)}
                  </span>
                  <span className="eyebrow">
                    {item.direction}
                  </span>
                </div>
              </div>

              {/* Magnitude bar */}
              <div className="w-full rounded-full h-1.5 mb-2 overflow-hidden flex" style={{backgroundColor:'var(--color-surface-raised)'}}>
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isPositive ? 'bg-[var(--state-success-fg)]' : 'bg-[var(--state-warning-fg)]'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              <p className="text-[11px] text-theme-muted leading-relaxed">
                {item.explanation}
              </p>
            </div>
          );
        })}
      </div>

      {/* Attribution Limitation Disclaimer (Master Document Section 11 & 31) */}
      <div className="mt-5 p-3.5 rounded-lg border flex items-start gap-2.5 text-xs text-theme-muted" style={{backgroundColor:'var(--color-surface)',borderColor:'var(--color-border)'}}>
        <Info className="w-4 h-4 text-theme-muted shrink-0 mt-0.5" />
        <span>
          <strong>Methodological Limitation:</strong> Feature attribution values quantify input sensitivity and gradient contribution within the Horizon-Specific Transformer architecture. They reflect internal model representations and do not constitute causal physical proof of consumption.
        </span>
      </div>
    </div>
  );
};
