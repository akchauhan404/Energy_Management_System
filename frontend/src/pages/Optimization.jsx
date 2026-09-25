import React, { useState, useEffect } from 'react';
import {
  OptimizationSummary,
  OptimizationSchedule,
  OptimizationExplanation
} from '../components/optimization/OptimizationComponents';
import { OptimizationScheduleChart } from '../components/charts/OptimizationScheduleChart';
import { LoadingState } from '../components/common/States';
import { optimizationApi } from '../services/api/optimizationApi';

export const Optimization = () => {
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [optimization, setOptimization] = useState(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [explanationOpen, setExplanationOpen] = useState(false);

  const fetchOptimization = async () => {
    try {
      setLoading(true);
      const data = await optimizationApi.getLatestOptimization();
      setOptimization(data);
    } catch (err) {
      console.error('Failed to load optimization:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptimization();
  }, []);

  const handleRunOptimization = async () => {
    try {
      setRunning(true);
      const res = await optimizationApi.runOptimization();
      setOptimization(res);
    } catch (err) {
      console.error('Failed to run optimization:', err);
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return <LoadingState message="Executing PPO policy dispatch on 48-step forecast environment..." />;
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-theme-text font-mono">
          Energy Optimization
        </h2>
        <p className="text-xs text-theme-muted mt-0.5">
          Reinforcement learning control (Stable-Baselines3 PPO) for battery dispatch, solar self-consumption, and peak shaving.
        </p>
      </div>

      {/* Main KPI Summary Card with Action Triggers */}
      <OptimizationSummary
        summary={optimization?.summary}
        isRunning={running}
        onRunOptimization={handleRunOptimization}
        isScheduleOpen={scheduleOpen}
        onToggleSchedule={() => setScheduleOpen(!scheduleOpen)}
        isExplanationOpen={explanationOpen}
        onToggleExplanation={() => setExplanationOpen(!explanationOpen)}
      />

      {/* Inline PPO Decision Explanations */}
      <OptimizationExplanation
        explanations={optimization?.explanations || []}
        isOpen={explanationOpen}
      />

      {/* Inline 48-Step Dispatch Schedule Table */}
      <OptimizationSchedule
        schedule={optimization?.schedule || []}
        isOpen={scheduleOpen}
      />

      {/* Dispatch Trajectory Chart */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-theme-text uppercase tracking-wider">
              Dispatched Load & Storage Dynamics (24-Hour Horizon)
            </h3>
            <p className="text-xs text-theme-muted">
              Synchronized tracking of grid draw, battery state of charge (SOC), and solar generation.
            </p>
          </div>
          <span className="text-xs font-mono text-[var(--color-primary)]">
            48 Simulation Steps
          </span>
        </div>

        <OptimizationScheduleChart
          schedule={optimization?.schedule || []}
          height={340}
        />
      </div>
    </div>
  );
};
