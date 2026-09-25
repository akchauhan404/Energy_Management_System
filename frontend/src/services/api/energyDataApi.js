import { apiRequest, USE_MOCK } from './apiClient';
import { generateMockHistoricalRecords } from './mockData';

const MOCK_UPLOADS_KEY = 'energy_ai_mock_uploads';
const MOCK_RECORDS_KEY = 'energy_ai_mock_records';

// Initialize mock storage if empty
const getStoredMockUploads = () => {
  const stored = localStorage.getItem(MOCK_UPLOADS_KEY);
  if (stored) return JSON.parse(stored);

  const initial = [
    {
      id: 'upl-01',
      file_name: 'household_energy_30min_nov.csv',
      file_type: 'text/csv',
      record_count: 336,
      start_date: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
      end_date: new Date().toISOString(),
      sampling_interval_minutes: 30,
      status: 'VALIDATED',
      uploaded_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    }
  ];
  localStorage.setItem(MOCK_UPLOADS_KEY, JSON.stringify(initial));
  return initial;
};

export const energyDataApi = {
  async getUploads() {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300));
      return getStoredMockUploads();
    }
    try {
      return await apiRequest('/energy-data');
    } catch {
      return getStoredMockUploads();
    }
  },

  async getLatestRecords() {
    if (USE_MOCK) {
      const stored = localStorage.getItem(MOCK_RECORDS_KEY);
      if (stored) return JSON.parse(stored);
      const generated = generateMockHistoricalRecords();
      localStorage.setItem(MOCK_RECORDS_KEY, JSON.stringify(generated));
      return generated;
    }
    try {
      return await apiRequest('/energy-data/latest-records');
    } catch {
      return generateMockHistoricalRecords();
    }
  },

  // Authoritative CSV client-side pre-validation + server upload
  async uploadCsv(file, parsedRows) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 800));

      // Validate parsed rows
      if (!parsedRows || parsedRows.length === 0) {
        throw new Error('CSV file is empty or could not be parsed.');
      }

      const headers = Object.keys(parsedRows[0]).map(h => h.trim().toLowerCase());
      const hasTimestamp = headers.includes('timestamp');
      const hasEnergy = headers.includes('energy_kwh');

      if (!hasTimestamp || !hasEnergy) {
        throw new Error("Missing required columns: CSV must contain 'timestamp' and 'energy_kwh'");
      }

      // Check rows and interval
      const validRecords = [];
      const timestampSet = new Set();
      let duplicatesCount = 0;
      let invalidValuesCount = 0;

      for (let i = 0; i < parsedRows.length; i++) {
        const row = parsedRows[i];
        const rawTime = row['timestamp'] || row['Timestamp'];
        const rawEnergy = row['energy_kwh'] || row['Energy_kwh'] || row['energy'];

        const dateObj = new Date(rawTime);
        const energyVal = parseFloat(rawEnergy);

        if (isNaN(dateObj.getTime())) {
          throw new Error(`Row ${i + 1}: Invalid timestamp "${rawTime}". Expected valid ISO/Date format.`);
        }

        if (isNaN(energyVal) || energyVal < 0 || !isFinite(energyVal)) {
          invalidValuesCount++;
          continue;
        }

        const timeStr = dateObj.toISOString();
        if (timestampSet.has(timeStr)) {
          duplicatesCount++;
          continue;
        }

        timestampSet.add(timeStr);
        validRecords.push({
          timestamp: timeStr,
          energy_kwh: energyVal
        });
      }

      if (validRecords.length < 48) {
        throw new Error(`Insufficient historical points. Need at least 48 consecutive 30-minute intervals (found ${validRecords.length}).`);
      }

      // Sort chronologically
      validRecords.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      // Verify sampling interval ~ 30 minutes
      let missingIntervalsCount = 0;
      for (let i = 1; i < validRecords.length; i++) {
        const diffMinutes = (new Date(validRecords[i].timestamp) - new Date(validRecords[i - 1].timestamp)) / (60 * 1000);
        if (Math.abs(diffMinutes - 30) > 2) {
          missingIntervalsCount++;
        }
      }

      const newUpload = {
        id: 'upl-' + Date.now(),
        file_name: file.name,
        file_type: file.type || 'text/csv',
        record_count: validRecords.length,
        start_date: validRecords[0].timestamp,
        end_date: validRecords[validRecords.length - 1].timestamp,
        sampling_interval_minutes: 30,
        status: missingIntervalsCount > 5 ? 'WARNING' : 'VALIDATED',
        uploaded_at: new Date().toISOString(),
        validationDetails: {
          duplicatesDetected: duplicatesCount,
          invalidValuesFiltered: invalidValuesCount,
          missingIntervalsDetected: missingIntervalsCount
        }
      };

      const existingUploads = getStoredMockUploads();
      existingUploads.unshift(newUpload);
      localStorage.setItem(MOCK_UPLOADS_KEY, JSON.stringify(existingUploads));
      localStorage.setItem(MOCK_RECORDS_KEY, JSON.stringify(validRecords.slice(-336)));

      return {
        success: true,
        upload: newUpload,
        sampleRecords: validRecords.slice(0, 10),
        validation: newUpload.validationDetails
      };
    }

    const formData = new FormData();
    formData.append('file', file);
    return await apiRequest('/energy-data/upload', {
      method: 'POST',
      body: formData
    });
  },

  async deleteUpload(id) {
    if (USE_MOCK) {
      const list = getStoredMockUploads().filter(u => u.id !== id);
      localStorage.setItem(MOCK_UPLOADS_KEY, JSON.stringify(list));
      return { success: true };
    }
    return await apiRequest(`/energy-data/${id}`, { method: 'DELETE' });
  }
};
