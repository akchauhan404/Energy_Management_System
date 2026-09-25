import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Layers,
  FileSpreadsheet,
  Activity,
  TrendingUp,
  Award,
  ArrowRight,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { MetricCard } from '../../components/common/MetricCard';
import { LoadingState, Badge } from '../../components/common/States';
import { adminApi } from '../../services/api/adminApi';

export const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [datasets, setDatasets] = useState([]);
  const [models, setModels] = useState(null);
  const [trainingRuns, setTrainingRuns] = useState([]);
  const [forecastPerf, setForecastPerf] = useState(null);
  const [ppoPerf, setPpoPerf] = useState(null);

  useEffect(() => {
    const fetchAdminOverview = async () => {
      try {
        setLoading(true);
        const [ds, md, tr, fp, pp] = await Promise.all([
          adminApi.getDatasets(),
          adminApi.getModels(),
          adminApi.getTrainingRuns(),
          adminApi.getForecastPerformance(),
          adminApi.getPPOPerformance()
        ]);
        setDatasets(ds || []);
        setModels(md || {});
        setTrainingRuns(tr || []);
        setForecastPerf(fp);
        setPpoPerf(pp);
      } catch (err) {
        console.error('Failed to load admin overview:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminOverview();
  }, []);

  if (loading) {
    return <LoadingState message="Loading administrative metrics, registries and audits..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-theme-border">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-theme-text font-mono flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            Admin Operations & Model Registry
          </h2>
          <p className="text-xs text-theme-muted mt-0.5">
            System-level audit of datasets, model artifacts, offline training runs, and evaluation metrics.
          </p>
        </div>

        <span className="inline-flex items-center gap-2 text-xs font-mono text-theme-muted glass-panel px-3 py-1.5 rounded-full border border-theme-border self-start sm:self-auto">
          <span className="status-indicator status-online energy-pulse" />
          Environment: Active Production
        </span>
      </div>

      {/* Top Admin Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Dataset Versions"
          value={datasets.length}
          unit="versions"
          subtitle="Total aggregated series"
          icon={FileSpreadsheet}
          delta="LCL-Aggregated-v2.4 Active"
          deltaType="positive"
        />

        <MetricCard
          title="Active Forecast Model"
          value="Transformer"
          unit="v2.2.0"
          subtitle="48-step horizon @ 30m"
          icon={Layers}
          delta="R² = 0.9505"
          deltaType="positive"
        />

        <MetricCard
          title="Active PPO Agent"
          value="SB3 PPO"
          unit="v1.2.0"
          subtitle="MlpPolicy Actor-Critic"
          icon={Award}
          delta="0 Violations"
          deltaType="positive"
        />

        <MetricCard
          title="Last Training Run"
          value="Run #902"
          unit=""
          subtitle="Completed successfully"
          icon={Activity}
          delta="MAE: 61.72"
          deltaType="positive"
        />
      </div>

      {/* Model & Dataset Registry Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Datasets Preview */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-theme-border">
            <div>
              <h3 className="text-sm font-bold text-theme-text uppercase tracking-wider">
                Training Datasets
              </h3>
              <p className="text-xs text-theme-muted">
                Preprocessed time-series collections available for model retraining.
              </p>
            </div>
            <Link
              to="/admin/datasets"
              className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 font-medium"
            >
              <span>View All Datasets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {datasets.map((ds) => (
              <div
                key={ds.id}
                className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-theme-text font-mono block">
                    {ds.version}
                  </span>
                  <span className="text-[11px] text-theme-muted">
                    {ds.description}
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className="font-bold text-theme-text block">
                    {ds.total_records.toLocaleString()} rows
                  </span>
                  <Badge variant={ds.status === 'ACTIVE' ? 'success' : 'neutral'}>
                    {ds.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Model Artifacts Preview */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-theme-border">
            <div>
              <h3 className="text-sm font-bold text-theme-text uppercase tracking-wider">
                Active Model Artifacts
              </h3>
              <p className="text-xs text-theme-muted">
                Approved forecasting and reinforcement learning inference policies.
              </p>
            </div>
            <Link
              to="/admin/models"
              className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 font-medium"
            >
              <span>Model Registry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {models?.forecastModels?.map((fm) => (
              <div
                key={fm.id}
                className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-theme-text">
                      {fm.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-theme-muted">
                      {fm.version}
                    </span>
                  </div>
                  <span className="text-[11px] text-theme-muted block mt-0.5">
                    {fm.architecture}
                  </span>
                </div>
                <Badge variant={fm.isApproved ? 'primary' : 'neutral'}>
                  {fm.status}
                </Badge>
              </div>
            ))}

            {models?.ppoModels?.map((pm) => (
              <div
                key={pm.id}
                className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-theme-text">
                      {pm.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-theme-muted">
                      {pm.version}
                    </span>
                  </div>
                  <span className="text-[11px] text-theme-muted block mt-0.5">
                    {pm.algorithm} ({pm.policy})
                  </span>
                </div>
                <Badge variant={pm.isApproved ? 'success' : 'neutral'}>
                  {pm.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Navigation to Benchmarks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/admin/forecast-performance"
          className="p-4 rounded-xl glass-panel-interactive flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-theme-text block">
                Forecast Benchmark Metrics
              </span>
              <span className="text-xs text-theme-muted">
                Compare Transformer vs GRU, Persistence, and Seasonal Naive baselines.
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-theme-muted" />
        </Link>

        <Link
          to="/admin/ppo-performance"
          className="p-4 rounded-xl glass-panel-interactive flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-theme-text block">
                PPO Simulation Performance
              </span>
              <span className="text-xs text-theme-muted">
                Validation & Test reductions: 4.70% Grid Energy, 2.69% Cost, 9.95% Peak Demand.
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-theme-muted" />
        </Link>
      </div>
    </div>
  );
};
