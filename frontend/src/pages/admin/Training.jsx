import React, { useState, useEffect } from 'react';
import { Activity, Play, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { adminApi } from '../../services/api/adminApi';
import { LoadingState, Badge } from '../../components/common/States';

export const Training = () => {
  const [loading, setLoading] = useState(true);
  const [runs, setRuns] = useState([]);
  const [starting, setStarting] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const fetchTrainingRuns = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getTrainingRuns();
      setRuns(data || []);
    } catch (err) {
      console.error('Failed to load training runs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainingRuns();
  }, []);

  const handleTriggerTraining = async () => {
    try {
      setStarting(true);
      setActionMessage('');
      const res = await adminApi.startForecastTraining('LCL-Aggregated-v2.4');
      setActionMessage(res.message);
      await fetchTrainingRuns();
    } catch (err) {
      setActionMessage('Failed to queue training run: ' + err.message);
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading training execution logs and evaluations..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-theme-border">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-theme-text font-mono flex items-center gap-2">
            <Activity className="w-5 h-5 text-[var(--color-primary)]" />
            Model Training & Audit Operations
          </h2>
          <p className="text-xs text-theme-muted mt-0.5">
            Audit history of offline training runs, validation checkpoints, and artifact registration.
          </p>
        </div>

        <button
          onClick={handleTriggerTraining}
          disabled={starting}
          className="btn-primary text-xs px-4 py-2 self-start sm:self-auto"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{starting ? 'Queueing Training...' : 'Trigger Transformer Training'}</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      <div className="glass-panel p-6">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-theme-text uppercase tracking-wider">
            Execution Log & Checkpoint Metrics
          </h3>
          <p className="text-xs text-theme-muted">
            All training sessions require explicit admin authorization and ground truth dataset version pinning.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-theme-border">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-white/[0.03] border-b border-theme-border text-theme-muted uppercase font-mono tracking-wider">
                <th className="py-3 px-4">Run ID</th>
                <th className="py-3 px-4">Model Pipeline</th>
                <th className="py-3 px-4">Dataset Version</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">MAE</th>
                <th className="py-3 px-4 text-right">RMSE</th>
                <th className="py-3 px-4 text-right">MAPE</th>
                <th className="py-3 px-4 text-right">R²</th>
                <th className="py-3 px-4 text-right">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] font-mono">
              {runs.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-theme-text">
                    {r.id}
                  </td>
                  <td className="py-3.5 px-4 font-sans text-theme-text">
                    {r.model_type}
                  </td>
                  <td className="py-3.5 px-4 text-theme-muted">
                    {r.dataset_version}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Badge variant={r.status === 'COMPLETED' ? 'success' : 'warning'}>
                      {r.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-[var(--color-primary)] tabular-nums">
                    {r.mae !== null ? r.mae.toFixed(4) : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right text-theme-text tabular-nums">
                    {r.rmse !== null ? r.rmse.toFixed(4) : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right text-theme-text tabular-nums">
                    {r.mape !== null ? `${r.mape.toFixed(2)}%` : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-[var(--state-success-fg)] tabular-nums">
                    {r.r2 !== null ? r.r2.toFixed(4) : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right text-theme-muted font-mono">
                    {r.completed_at ? new Date(r.completed_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'In Progress'}
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
