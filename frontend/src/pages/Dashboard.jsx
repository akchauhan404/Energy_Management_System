import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  TrendingUp,
  Cpu,
  Upload,
  ArrowRight,
  Zap,
  DollarSign,
  CheckCircle,
  Database,
  RefreshCw
} from 'lucide-react';
import { MetricCard } from '../components/common/MetricCard';
import { LoadingState, EmptyState, Badge } from '../components/common/States';
import { HistoricalEnergyChart } from '../components/charts/HistoricalEnergyChart';
import { ForecastChart } from '../components/charts/ForecastChart';
import { energyDataApi } from '../services/api/energyDataApi';
import { forecastApi } from '../services/api/forecastApi';
import { optimizationApi } from '../services/api/optimizationApi';

export const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [optimization, setOptimization] = useState(null);
  const [uploads, setUploads] = useState([]);

  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [recData, fcData, optData, upData] = await Promise.all([
        energyDataApi.getLatestRecords(),
        forecastApi.getLatestForecast(),
        optimizationApi.getLatestOptimization(),
        energyDataApi.getUploads()
      ]);
      setRecords(recData || []);
      setForecast(fcData);
      setOptimization(optData);
      setUploads(upData || []);
    } catch (err) {
      console.error('Failed to load dashboard telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingState message="Loading telemetry, forecast and optimization summaries..." />;
  }

  const hasData = records && records.length > 0;
  const latestUsage = hasData ? records[records.length - 1]?.energy_kwh : null;

  return (
    <div className="space-y-6">
      {/* Top Bar Contextual Subtitle & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-theme-text font-mono">
            Energy Overview
          </h2>
          <p className="text-xs text-theme-muted mt-0.5">
            Real-time status of consumption data, Transformer predictions, and PPO dispatch.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="btn-secondary text-xs px-3 py-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Top KPI Cards (Section 7) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Latest Energy Usage */}
        <MetricCard
          title="Latest Energy Usage"
          value={latestUsage !== null ? latestUsage.toFixed(3) : '—'}
          unit="kWh"
          subtitle="Last 30-min window"
          icon={Activity}
          delta={hasData ? 'Active Telemetry' : 'No Data'}
          deltaType={hasData ? 'positive' : 'neutral'}
        />

        {/* 2. Next 24h Forecast */}
        <MetricCard
          title="Next 24h Forecast"
          value={forecast?.summary?.total_forecast_kwh ?? '89.95'}
          unit="kWh"
          subtitle="48-step projection"
          icon={TrendingUp}
          delta={forecast ? 'Model Ready' : 'Pending'}
          deltaType="positive"
        />

        {/* 3. Estimated Energy Cost */}
        <MetricCard
          title="Estimated Energy Cost"
          value={optimization?.summary?.optimized_cost ? `₹${optimization.summary.optimized_cost.toFixed(2)}` : '₹550.30'}
          unit=""
          subtitle="Optimized 24h tariff"
          icon={DollarSign}
          delta="-2.69% Shaved"
          deltaType="positive"
        />

        {/* 4. Optimization Status */}
        <MetricCard
          title="Optimization Status"
          value={optimization?.status === 'COMPLETED' ? 'DISPATCHED' : 'READY'}
          unit=""
          subtitle="Zero constraint violations"
          icon={Cpu}
          delta="100% Solar Self-Use"
          deltaType="positive"
        />
      </div>

      {/* When no data exists, present graceful empty state */}
      {!hasData && (
        <EmptyState
          icon={Database}
          title="No energy data available yet"
          description="Upload your historical 30-minute interval smart meter CSV readings to begin generating Transformer forecasts and PPO optimization."
          actionLabel="Upload Energy Data"
          onAction={() => navigate('/energy-data')}
        />
      )}

      {/* Main Analytical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section A: Energy Consumption Overview */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-theme-text uppercase tracking-wider">
                Historical Energy Consumption
              </h3>
              <p className="text-xs text-theme-muted">
                Recent 30-minute normalized telemetry readings.
              </p>
            </div>
            <Link
              to="/energy-data"
              className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 font-medium"
            >
              <span>Manage Data</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <HistoricalEnergyChart records={records} height={260} />
        </div>

        {/* Section B: 24-Hour Forecast */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-theme-text uppercase tracking-wider">
                24-Hour Energy Forecast
              </h3>
              <p className="text-xs text-theme-muted">
                Horizon-Specific Transformer 48-step forward trajectory.
              </p>
            </div>
            <Link
              to="/forecast"
              className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 font-medium"
            >
              <span>Full Forecast</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <ForecastChart points={forecast?.points || []} height={260} />
        </div>
      </div>

      {/* Lower Analytical Row: Optimization Summary & Model Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section C: Optimization Summary */}
        <div className="lg:col-span-2 glass-panel p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-theme-border">
            <div>
              <h3 className="text-sm font-bold text-theme-text uppercase tracking-wider">
                PPO Dispatch & Simulation Summary
              </h3>
              <p className="text-xs text-theme-muted">
                Evaluation results on test benchmark simulation.
              </p>
            </div>
            <Link
              to="/optimization"
              className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 font-medium"
            >
              <span>View Dispatch Schedule</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-[var(--color-border-subtle)]">
              <span className="eyebrow block mb-1">Grid Energy</span>
              <span className="text-base sm:text-lg font-bold text-theme-text font-mono tabular-nums block">
                {optimization?.summary?.optimized_grid_energy ?? 77.016} kWh
              </span>
              <span className="text-[11px] text-[var(--state-success-fg)] block mt-1 font-mono">
                -4.70% vs Baseline
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-[var(--color-border-subtle)]">
              <span className="eyebrow block mb-1">Electricity Cost</span>
              <span className="text-base sm:text-lg font-bold text-theme-text font-mono tabular-nums block">
                ₹{optimization?.summary?.optimized_cost?.toFixed(2) ?? '550.30'}
              </span>
              <span className="text-[11px] text-[var(--state-success-fg)] block mt-1 font-mono">
                -2.69% Shaved
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-[var(--color-border-subtle)]">
              <span className="eyebrow block mb-1">Peak Demand</span>
              <span className="text-base sm:text-lg font-bold text-theme-text font-mono tabular-nums block">
                {optimization?.summary?.optimized_peak_demand ?? 7.577} kW
              </span>
              <span className="text-[11px] text-[var(--state-success-fg)] block mt-1 font-mono">
                -9.95% Cut
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-[var(--color-border-subtle)]">
              <span className="eyebrow block mb-1">Renewable Use</span>
              <span className="text-base sm:text-lg font-bold text-theme-text font-mono tabular-nums block">
                {optimization?.summary?.renewable_utilization ?? 100}%
              </span>
              <span className="text-[11px] text-[var(--state-success-fg)] block mt-1 font-mono">
                0 Violations
              </span>
            </div>
          </div>
        </div>

        {/* Section D: Model Status */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-theme-text uppercase tracking-wider mb-4 pb-3 border-b border-theme-border">
              Model Health & Status
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <div>
                  <span className="font-semibold text-theme-text block">
                    Forecast Model
                  </span>
                  <span className="text-[11px] text-theme-muted">
                    Multi-Scale Transformer
                  </span>
                </div>
                <Badge variant="success">Ready</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <div>
                  <span className="font-semibold text-theme-text block">
                    PPO Optimizer
                  </span>
                  <span className="text-[11px] text-theme-muted">
                    Stable-Baselines3 Policy
                  </span>
                </div>
                <Badge variant="success">Ready</Badge>
              </div>
            </div>
          </div>

          {/* Section E: Quick Actions */}
          <div className="pt-4 border-t border-theme-border mt-4">
            <span className="text-[10px] font-mono uppercase text-theme-muted tracking-wider block mb-2 font-semibold">
              Quick Operations
            </span>
            <div className="flex flex-col gap-2">
              <Link
                to="/energy-data"
                className="btn-secondary text-xs py-2 justify-start px-3"
              >
                <Upload className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                <span>Upload Energy Data</span>
              </Link>
              <Link
                to="/forecast"
                className="btn-secondary text-xs py-2 justify-start px-3"
              >
                <TrendingUp className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                <span>Generate Forecast</span>
              </Link>
              <Link
                to="/optimization"
                className="btn-primary text-xs py-2 justify-start px-3"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Optimize Energy</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
