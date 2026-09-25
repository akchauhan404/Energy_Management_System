import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Plus, Calendar, Database, CheckCircle2 } from 'lucide-react';
import { adminApi } from '../../services/api/adminApi';
import { LoadingState, Badge } from '../../components/common/States';

export const Datasets = () => {
  const [loading, setLoading] = useState(true);
  const [datasets, setDatasets] = useState([]);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        setLoading(true);
        const data = await adminApi.getDatasets();
        setDatasets(data || []);
      } catch (err) {
        console.error('Failed to load datasets:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDatasets();
  }, []);

  if (loading) {
    return <LoadingState message="Loading training dataset versions..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-theme-border">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-theme-text font-mono flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[var(--color-primary)]" />
            Dataset Versioning Management
          </h2>
          <p className="text-xs text-theme-muted mt-0.5">
            Aggregated historical series curated for offline Transformer and PPO agent training.
          </p>
        </div>

        <span className="text-xs font-mono text-theme-muted glass-panel px-3 py-1.5 rounded-full border border-theme-border">
          {datasets.length} Versions Registered
        </span>
      </div>

      <div className="glass-panel p-6">
        <div className="overflow-x-auto rounded-lg border border-theme-border">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-white/[0.03] border-b border-theme-border text-theme-muted uppercase font-mono tracking-wider">
                <th className="py-3 px-4">Dataset Version</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-center">Record Count</th>
                <th className="py-3 px-4">Temporal Range</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] font-mono">
              {datasets.map((ds) => (
                <tr key={ds.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-theme-text">
                    {ds.version}
                  </td>
                  <td className="py-3.5 px-4 font-sans text-theme-muted max-w-xs">
                    {ds.description}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-[var(--color-primary)]">
                    {ds.total_records.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-theme-muted text-[11px]">
                    {new Date(ds.start_date).toLocaleDateString()} — {new Date(ds.end_date).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Badge variant={ds.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {ds.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right text-theme-muted">
                    {new Date(ds.created_at).toLocaleDateString()}
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
