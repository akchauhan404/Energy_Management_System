import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, X } from 'lucide-react';

export const EnergyUpload = ({ onUploadSuccess, isUploading }) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragOver(true);
    } else if (e.type === 'dragleave') {
      setDragOver(false);
    }
  };

  const parseCsvText = (text) => {
    const lines = text.trim().split(/\r\n|\n/);
    if (lines.length < 2) {
      throw new Error('CSV file is empty or missing data lines.');
    }
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx];
      });
      rows.push(row);
    }
    return rows;
  };

  const processFile = (file) => {
    setParseError(null);
    if (!file) return;

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      setParseError('Only CSV files (.csv) are supported.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const rows = parseCsvText(text);
        setSelectedFile({ file, rows, size: (file.size / 1024).toFixed(1) });
      } catch (err) {
        setParseError(err.message || 'Failed to parse CSV file.');
      }
    };
    reader.onerror = () => {
      setParseError('Error reading file from disk.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;
    try {
      setUploadProgress(40);
      await onUploadSuccess(selectedFile.file, selectedFile.rows);
      setUploadProgress(100);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setParseError(err.message || 'Upload validation failed on server.');
    } finally {
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  return (
    <div className="glass-panel p-6">
      <div className="mb-4">
        <h3 className="text-base font-bold text-theme-text">
          Upload Historical Energy Readings
        </h3>
        <p className="text-xs text-theme-muted mt-0.5">
          Expected format: 30-minute interval series with columns: <code className="text-theme-primary px-1 py-0.5 rounded bg-white/5 font-mono text-[11px]">timestamp</code>, <code className="text-theme-primary px-1 py-0.5 rounded bg-white/5 font-mono text-[11px]">energy_kwh</code>
        </p>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
          dragOver
            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
            : 'border-theme-border hover:border-theme-primary hover:bg-white/[0.02]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--color-border-subtle)',
            color: 'var(--color-primary)'
          }}
        >
          <UploadCloud className="w-6 h-6" />
        </div>

        <p className="text-sm font-semibold text-theme-text mb-1">
          Click to upload or drag and drop CSV
        </p>
        <p className="text-xs text-theme-muted max-w-xs">
          Smart meter or sub-meter records sampled at 30-minute intervals (min 48 steps).
        </p>
      </div>

      {/* Parse Error Alert */}
      {parseError && (
        <div className="mt-4 p-3 rounded-lg bg-[var(--state-danger-bg)] border border-[var(--state-danger-border)] text-[var(--state-danger-fg)] text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[var(--state-danger-fg)]" />
          <span>{parseError}</span>
          <button 
            onClick={() => setParseError(null)} 
            className="ml-auto text-[var(--state-danger-fg)] hover:opacity-80"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Selected File Stage Preview & Confirm */}
      {selectedFile && (
        <div className="mt-4 p-4 rounded-xl glass-panel-interactive flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-theme-text">
                {selectedFile.file.name}
              </p>
              <p className="text-xs text-theme-muted">
                {selectedFile.size} KB • {selectedFile.rows.length} rows parsed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="btn-secondary text-xs px-3 py-1.5 flex-1 sm:flex-initial"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isUploading}
              onClick={handleConfirmUpload}
              className="btn-primary text-xs px-4 py-1.5 flex-1 sm:flex-initial"
            >
              {isUploading ? 'Validating...' : 'Validate & Save'}
            </button>
          </div>
        </div>
      )}

      {uploadProgress > 0 && (
        <div className="mt-3 w-full rounded-full h-1.5 overflow-hidden" style={{backgroundColor:'var(--color-surface-raised)'}}>
          <div 
            className="h-full transition-all duration-300 rounded-full"
            style={{ 
              width: `${uploadProgress}%`,
              backgroundColor: 'var(--color-primary)' 
            }}
          />
        </div>
      )}
    </div>
  );
};
