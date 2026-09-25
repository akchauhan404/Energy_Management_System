import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  Play,
  Calendar,
  Zap,
  DollarSign,
  TrendingDown,
  ShieldCheck,
  Sun,
  Info
} from 'lucide-react';
import { Badge } from '../common/States';

export const OptimizationSummary = ({
  summary,
  isRunning,
  onRunOptimization,
  isScheduleOpen,
  onToggleSchedule,
  isExplanationOpen,
  onToggleExplanation
}) => {
  return (
    <div className="glass-panel p-6">
      {/* Header and Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-theme-border">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-theme-text">
              Reinforcement Learning Optimization (PPO)
            </h3>
            <Badge variant="primary">Stable-Baselines3</Badge>
          </div>
          <p className="text-xs text-theme-muted mt-1">
            Autonomous multi-objective scheduling for battery storage, solar self-consumption, and flexible load shifting.
          </p>
        </div>

        {/* Buttons: Run Optimization, View Schedule, Explain Decisions (clean styling) */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={isRunning}
            onClick={onRunOptimization}
            className="btn-primary text-xs px-3.5 py-2"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunning ? 'Optimizing...' : 'Run Optimization'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleSchedule}
            className="btn-secondary text-xs px-3.5 py-2"
            aria-expanded={isScheduleOpen}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{isScheduleOpen ? 'Hide Schedule' : 'View Schedule'}</span>
            {isScheduleOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={onToggleExplanation}
            className="btn-secondary text-xs px-3.5 py-2"
            aria-expanded={isExplanationOpen}
          >
            <span>{isExplanationOpen ? 'Hide Reasons' : 'Explain Decisions'}</span>
            {isExplanationOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Mandatory Simulation Evaluation Disclaimer Badge */}
      <div className="mt-4 p-3 rounded-lg bg-[var(--state-info-bg)] border border-[var(--state-info-border)] text-[var(--state-info-fg)] text-xs flex items-center gap-2">
        <Info className="w-4 h-4 shrink-0 text-[var(--state-info-fg)]" />
        <span>
          <strong>Forecast-grounded simulation evaluation:</strong> PPO agent evaluates tariff arbitrage, solar PV absorption, and peak shaving on simulated household environment.
        </span>
      </div>

      {/* Baseline vs Optimized KPI Comparison Grid */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Grid Energy Card */}
        <div className="p-4 rounded-xl glass-panel-interactive border border-theme-border">
          <div className="flex items-center justify-between text-xs text-theme-muted mb-2">
            <span className="eyebrow">Grid Energy Consumption</span>
            <Zap className="w-4 h-4 text-[var(--state-success-fg)]" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div>
              <span className="text-2xl font-bold font-mono text-theme-text tabular-nums">
                {summary?.optimized_grid_energy?.toFixed(3) ?? '77.016'}
              </span>
              <span className="text-xs text-theme-muted ml-1 font-mono">kWh</span>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[var(--state-success-bg)] text-[var(--state-success-fg)] border border-[var(--state-success-border)] flex items-center gap-0.5">
              <TrendingDown className="w-3.5 h-3.5" /> -{summary?.grid_reduction_pct?.toFixed(2) ?? '4.70'}%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-theme-muted flex justify-between pt-2 border-t border-white/5">
            <span>Baseline: {summary?.baseline_grid_energy?.toFixed(3) ?? '80.816'} kWh</span>
            <span className="text-[var(--state-success-fg)] font-mono">Saved: 3.80 kWh</span>
          </div>
        </div>

        {/* Electricity Cost Card */}
        <div className="p-4 rounded-xl glass-panel-interactive border border-theme-border">
          <div className="flex items-center justify-between text-xs text-theme-muted mb-2">
            <span className="eyebrow">Electricity Cost</span>
            <DollarSign className="w-4 h-4 text-[var(--color-primary)]" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div>
              <span className="text-2xl font-bold font-mono text-theme-text tabular-nums">
                ₹{summary?.optimized_cost?.toFixed(2) ?? '550.30'}
              </span>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[var(--state-success-bg)] text-[var(--state-success-fg)] border border-[var(--state-success-border)] flex items-center gap-0.5">
              <TrendingDown className="w-3.5 h-3.5" /> -{summary?.cost_reduction_pct?.toFixed(2) ?? '2.69'}%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-theme-muted flex justify-between pt-2 border-t border-white/5">
            <span>Baseline: ₹{summary?.baseline_cost?.toFixed(2) ?? '565.50'}</span>
            <span className="text-[var(--color-primary)] font-mono">Saved: ₹15.20</span>
          </div>
        </div>

        {/* Peak Demand Card */}
        <div className="p-4 rounded-xl glass-panel-interactive border border-theme-border">
          <div className="flex items-center justify-between text-xs text-theme-muted mb-2">
            <span className="eyebrow">Peak Demand</span>
            <Zap className="w-4 h-4 text-[var(--state-warning-fg)]" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div>
              <span className="text-2xl font-bold font-mono text-theme-text tabular-nums">
                {summary?.optimized_peak_demand?.toFixed(3) ?? '7.577'}
              </span>
              <span className="text-xs text-theme-muted ml-1 font-mono">kW</span>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[var(--state-success-bg)] text-[var(--state-success-fg)] border border-[var(--state-success-border)] flex items-center gap-0.5">
              <TrendingDown className="w-3.5 h-3.5" /> -{summary?.peak_reduction_pct?.toFixed(2) ?? '9.95'}%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-theme-muted flex justify-between pt-2 border-t border-white/5">
            <span>Baseline: {summary?.baseline_peak_demand?.toFixed(3) ?? '8.414'} kW</span>
            <span className="text-[var(--state-warning-fg)] font-mono">Shaved: 0.837 kW</span>
          </div>
        </div>
      </div>

      {/* Auxiliary Metrics: Renewable & Safety */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex items-center gap-2">
          <Sun className="w-4 h-4 text-[var(--color-accent)]" />
          <div>
            <span className="eyebrow block text-[10px]">Renewable Self-Use</span>
            <span className="font-bold text-theme-text font-mono tabular-nums">
              {summary?.renewable_utilization ?? 100}%
            </span>
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[var(--state-success-fg)]" />
          <div>
            <span className="eyebrow block text-[10px]">Constraint Violations</span>
            <span className="font-bold text-theme-text font-mono tabular-nums">
              {summary?.constraint_violations ?? 0}
            </span>
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
          <span className="eyebrow block text-[10px]">Battery Capacity</span>
          <span className="font-bold text-theme-text font-mono tabular-nums">10.0 kWh (3.0 kW)</span>
        </div>
        <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
          <span className="eyebrow block text-[10px]">Operational Horizon</span>
          <span className="font-bold text-theme-text font-mono tabular-nums">48 steps (30 min)</span>
        </div>
      </div>
    </div>
  );
};

export const OptimizationSchedule = ({ schedule = [], isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="glass-panel p-6 border-t-2 border-t-[var(--color-primary)] animate-fadeIn transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-theme-text">
            48-Step Dispatched Optimization Schedule
          </h4>
          <p className="text-xs text-theme-muted">
            Chronological step-by-step dispatch actions across the 24-hour lookahead window.
          </p>
        </div>
        <Badge variant="primary">{schedule.length} Steps</Badge>
      </div>

      <div className="overflow-x-auto rounded-lg border border-theme-border">
        <table className="w-full text-left text-xs border-collapse min-w-[760px]">
          <thead>
            <tr className="bg-white/[0.03] border-b border-theme-border text-theme-muted uppercase font-mono tracking-wider">
              <th className="py-2.5 px-3">Step</th>
              <th className="py-2.5 px-3">Time</th>
              <th className="py-2.5 px-3 text-right">Forecast Demand</th>
              <th className="py-2.5 px-3 text-center">Flexible Load</th>
              <th className="py-2.5 px-3 text-center">Battery Action</th>
              <th className="py-2.5 px-3 text-right">SOC (%)</th>
              <th className="py-2.5 px-3 text-right">Solar Gen</th>
              <th className="py-2.5 px-3 text-right">Grid Energy</th>
              <th className="py-2.5 px-3 text-right">Cost (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] font-mono tabular-nums">
            {schedule.map((step) => {
              const isDischarge = step.batteryAction === 'Discharge';
              const isCharge = step.batteryAction === 'Charge';
              const isRunLoad = step.flexibleLoadAction === 'Run Load';
              const isDelayLoad = step.flexibleLoadAction === 'Delay Load';

              return (
                <tr key={step.step_index} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2 px-3 text-theme-muted">{step.step_index + 1}</td>
                  <td className="py-2 px-3 text-theme-text font-semibold">{step.timeFormatted}</td>
                  <td className="py-2 px-3 text-right text-theme-text">
                    {step.forecastDemand.toFixed(3)}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span 
                      className={`px-2 py-0.5 rounded text-[10px] font-sans font-medium border ${
                        isRunLoad
                          ? 'bg-[var(--state-success-bg)] text-[var(--state-success-fg)] border-[var(--state-success-border)]'
                          : isDelayLoad
                          ? 'bg-[var(--state-warning-bg)] text-[var(--state-warning-fg)] border-[var(--state-warning-border)]'
                          : 'border-transparent text-theme-muted'
                      }`}
                    >
                      {step.flexibleLoadAction}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span 
                      className={`px-2 py-0.5 rounded text-[10px] font-sans font-medium border ${
                        isDischarge
                          ? 'bg-[var(--state-warning-bg)] text-[var(--state-warning-fg)] border-[var(--state-warning-border)]'
                          : isCharge
                          ? 'bg-[var(--state-info-bg)] text-[var(--state-info-fg)] border-[var(--state-info-border)]'
                          : 'border-transparent text-theme-muted'
                      }`}
                    >
                      {step.batteryAction}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right text-theme-text">
                    {step.batterySoc}%
                  </td>
                  <td className="py-2 px-3 text-right text-[var(--color-accent)]">
                    {step.solarGeneration > 0 ? step.solarGeneration.toFixed(3) : '-'}
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-[var(--color-primary)]">
                    {step.gridEnergy.toFixed(3)}
                  </td>
                  <td className="py-2 px-3 text-right text-theme-text">
                    ₹{step.cost.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const OptimizationExplanation = ({ explanations = [], isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="glass-panel p-6 border-t-2 border-t-[var(--color-primary)] animate-fadeIn transition-all duration-300">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h4 className="text-sm font-bold text-theme-text">
            PPO Action Decision Reasoning (Contextual State Layer)
          </h4>
          <p className="text-xs text-theme-muted mt-0.5">
            Interpreting why specific battery and flexible load policies were triggered by the RL agent.
          </p>
        </div>
        <Badge variant="primary">State-Grounded XAI</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {explanations.map((exp, idx) => (
          <div 
            key={idx}
            className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold text-[var(--color-primary)]">
                Step {exp.step_index + 1} • {exp.time}
              </span>
              <span 
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  exp.peak_risk === 'HIGH' 
                    ? 'bg-[var(--state-danger-bg)] text-[var(--state-danger-fg)] border-[var(--state-danger-border)]' 
                    : 'bg-[var(--state-success-bg)] text-[var(--state-success-fg)] border-[var(--state-success-border)]'
                }`}
              >
                {exp.peak_risk} PEAK RISK
              </span>
            </div>

            <div className="p-2 rounded bg-black/20 text-xs font-mono mb-2.5 text-theme-text font-semibold">
              Action: {exp.selected_action}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-theme-muted mb-2.5">
              <div>Demand: <strong className="text-theme-text font-mono">{exp.forecast_demand}</strong></div>
              <div>Tariff: <strong className="text-theme-text font-mono">{exp.tariff}</strong></div>
              <div>Battery SOC: <strong className="text-theme-text font-mono">{exp.battery_soc}</strong></div>
            </div>

            <p className="text-xs text-theme-muted leading-relaxed">
              {exp.reason}
            </p>
          </div>
        ))}
      </div>

      {/* Explanatory caveat disclaimer */}
      <div className="mt-5 p-3.5 rounded-lg border flex items-start gap-2.5 text-xs text-theme-muted" style={{backgroundColor:'var(--color-surface)',borderColor:'var(--color-border)'}}>
        <Info className="w-4 h-4 text-theme-muted shrink-0 mt-0.5" />
        <span>
          <strong>Decision Interpretation Note:</strong> Reinforcement learning agents optimize numerical reward functions; this explanation layer decodes underlying state dimensions (tariff differentials, battery constraints, peak envelope) rather than asserting intrinsic causal cognition.
        </span>
      </div>
    </div>
  );
};
