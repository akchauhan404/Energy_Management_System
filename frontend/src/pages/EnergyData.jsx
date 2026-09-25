import React, { useState, useEffect } from 'react';
import { Database, AlertCircle, CheckCircle2 } from 'lucide-react';
import { EnergyUpload } from '../components/energy/EnergyUpload';
import { DataPreview, ValidationSummary, UploadHistory } from '../components/energy/EnergyComponents';
import { HistoricalEnergyChart } from '../components/charts/HistoricalEnergyChart';
import { LoadingState } from '../components/common/States';
import { energyDataApi } from '../services/api/energyDataApi';

export const EnergyData = () => {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [records, setRecords] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [lastValidation, setLastValidation] = useState(null);
  const [successBanner, setSuccessBanner] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [recs, ups] = await Promise.all([
        energyDataApi.getLatestRecords(),
        energyDataApi.getUploads()
      ]);
      setRecords(recs || []);
      setUploads(ups || []);
    } catch (err) {
      console.error('Failed to load energy data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUploadSuccess = async (file, parsedRows) => {
    setUploading(true);
    setSuccessBanner('');
    try {
      const res = await energyDataApi.uploadCsv(file, parsedRows);
      setLastValidation(res);
      setSuccessBanner(`Successfully validated and stored ${res.upload.record_count} historical 30-minute intervals from ${file.name}.`);
      await loadData();
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteUpload = async (id) => {
    if (!window.confirm('Are you sure you want to remove this historical upload record?')) return;
    await energyDataApi.deleteUpload(id);
    await loadData();
  };

  if (loading) {
    return <LoadingState message="Loading historical energy telemetry..." />;
  }

  return (
    <div className="space-y-6">
      {/* Title & Context */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-theme-text font-mono">
          Energy Data
        </h2>
        <p className="text-xs text-theme-muted mt-0.5">
          Upload historical energy consumption data to generate forecasts.
        </p>
      </div>

      {/* Success Notification */}
      {successBanner && (
        <div className="p-3.5 rounded-xl bg-[var(--state-success-bg)] border border-[var(--state-success-border)] text-[var(--state-success-fg)] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Upload Zone */}
      <EnergyUpload
        onUploadSuccess={handleUploadSuccess}
        isUploading={uploading}
      />

      {/* Validation Results if upload recently processed */}
      {lastValidation && (
        <ValidationSummary
          validationDetails={lastValidation.validation}
          recordCount={lastValidation.upload.record_count}
          startDate={lastValidation.upload.start_date}
          endDate={lastValidation.upload.end_date}
        />
      )}

      {/* Historical Telemetry Chart */}
      {records.length > 0 && (
        <div className="glass-panel p-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-theme-text uppercase tracking-wider">
              Normalized Historical Telemetry (kWh / 30 min)
            </h3>
            <p className="text-xs text-theme-muted">
              Displaying the active {records.length} chronological interval readings used as input to the Transformer.
            </p>
          </div>
          <HistoricalEnergyChart records={records} height={280} />
        </div>
      )}

      {/* Preview Table of Active Normalized Records */}
      <DataPreview records={records} />

      {/* Audit Log of Upload Sessions */}
      <UploadHistory uploads={uploads} onDelete={handleDeleteUpload} />
    </div>
  );
};
