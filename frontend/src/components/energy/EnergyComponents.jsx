import React from 'react';
import { CheckCircle2, AlertCircle, Clock, Calendar, Hash, RefreshCw, Trash2 } from 'lucide-react';
import { Badge } from '../common/States';

export const DataPreview = ({ records = [] }) => {
  if (!records || records.length === 0) return null;

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-theme-text uppercase tracking-wider">
            Validated Data Preview
          </h4>
          <p className="text-xs text-theme-muted">
            Displaying recent continuous normalized 30-minute readings.
          </p>
        </div>
        <span className="text-xs font-mono text-theme-muted">
          {records.length} records shown
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-theme-border">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-white/[0.03] border-b border-theme-border text-theme-muted uppercase font-mono tracking-wider">
              <th className="py-2.5 px-4">#</th>
              <th className="py-2.5 px-4">Timestamp (UTC/Local)</th>
              <th className="py-2.5 px-4 text-right">Energy Consumption (kWh)</th>
              <th className="py-2.5 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {records.slice(0, 10).map((r, i) => (
              <tr key={r.id || i} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-2.5 px-4 font-mono text-theme-muted">{i + 1}</td>
                <td className="py-2.5 px-4 font-mono text-theme-text">
                  {new Date(r.timestamp).toLocaleString()}
                </td>
                <td className="py-2.5 px-4 text-right font-mono font-semibold text-[var(--color-primary)]">
                  {typeof r.energy_kwh === 'number' ? r.energy_kwh.toFixed(3) : r.energy_kwh}
                </td>
                <td className="py-2.5 px-4 text-center">
                  <Badge variant="success">Validated</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const ValidationSummary = ({ validationDetails, recordCount, startDate, endDate }) => {
  if (!validationDetails) return null;

  return (
    <div className="glass-panel p-6 border-l-4 border-l-[var(--color-primary)]">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="w-5 h-5 text-[var(--color-primary)]" />
        <h4 className="text-sm font-bold text-theme-text">
          Dataset Integrity & Preprocessing Audit
        </h4>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
          <span className="text-theme-muted block mb-1">Total Accepted Records</span>
          <span className="text-base font-bold text-theme-text font-mono">
            {recordCount}
          </span>
        </div>
        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
          <span className="text-theme-muted block mb-1">Sampling Interval</span>
          <span className="text-base font-bold text-[var(--color-primary)] font-mono">
            30 Minutes
          </span>
        </div>
        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
          <span className="text-theme-muted block mb-1">Duplicate Timestamps</span>
          <span className="text-base font-bold text-theme-text font-mono">
            {validationDetails.duplicatesDetected || 0} filtered
          </span>
        </div>
        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
          <span className="text-theme-muted block mb-1">Interval Gaps</span>
          <span className="text-base font-bold text-theme-text font-mono">
            {validationDetails.missingIntervalsDetected || 0}
          </span>
        </div>
      </div>

      {(startDate || endDate) && (
        <div className="mt-3 text-xs text-theme-muted flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1 font-mono">
            <Calendar className="w-3.5 h-3.5" />
            Span: {new Date(startDate).toLocaleDateString()} — {new Date(endDate).toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  );
};

export const UploadHistory = ({ uploads = [], onDelete }) => {
  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-theme-text uppercase tracking-wider">
            Upload History
          </h4>
          <p className="text-xs text-theme-muted">
            Audit log of uploaded historical dataset files and their ingestion statuses.
          </p>
        </div>
      </div>

      {uploads.length === 0 ? (
        <p className="text-xs text-theme-muted italic py-4">
          No previous upload sessions logged.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-theme-border">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-white/[0.03] border-b border-theme-border text-theme-muted uppercase font-mono tracking-wider">
                <th className="py-2.5 px-4">Filename</th>
                <th className="py-2.5 px-4">Uploaded At</th>
                <th className="py-2.5 px-4 text-center">Records</th>
                <th className="py-2.5 px-4">Date Range</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                {onDelete && <th className="py-2.5 px-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {uploads.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 px-4 font-semibold text-theme-text">
                    {u.file_name}
                  </td>
                  <td className="py-2.5 px-4 text-theme-muted font-mono">
                    {new Date(u.uploaded_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono text-theme-text">
                    {u.record_count}
                  </td>
                  <td className="py-2.5 px-4 text-theme-muted font-mono text-[11px]">
                    {new Date(u.start_date).toLocaleDateString()} - {new Date(u.end_date).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <Badge variant={u.status === 'VALIDATED' ? 'success' : 'warning'}>
                      {u.status}
                    </Badge>
                  </td>
                  {onDelete && (
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => onDelete(u.id)}
                        className="text-theme-muted hover:text-rose-400 p-1 rounded"
                        title="Delete upload"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
