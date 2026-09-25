import express from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// In-memory data store for server runtime
let uploadsStore = [
  {
    id: 'upl-01',
    user_id: 'usr-demo-01',
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

let recordsStore = [];
// Generate initial 336 records
const now = new Date();
for (let i = 0; i < 336; i++) {
  const t = new Date(now.getTime() - (336 - i) * 30 * 60 * 1000);
  const hour = t.getHours();
  const val = Math.max(0.4, 1.2 + Math.sin(hour / 3.8) * 0.8 + (Math.sin(i * 11) * 0.25));
  recordsStore.push({
    id: `rec-${i}`,
    upload_id: 'upl-01',
    user_id: 'usr-demo-01',
    timestamp: t.toISOString(),
    energy_kwh: parseFloat(val.toFixed(3))
  });
}

router.get('/', authMiddleware, (req, res) => {
  res.json(uploadsStore);
});

router.get('/latest-records', authMiddleware, (req, res) => {
  res.json(recordsStore.slice(-336));
});

router.post('/upload', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No CSV file was uploaded' });
  }

  const csvContent = req.file.buffer.toString('utf-8');
  const lines = csvContent.trim().split(/\r\n|\n/);
  if (lines.length < 2) {
    return res.status(400).json({ message: 'CSV file is empty or missing headers' });
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
  if (!headers.includes('timestamp') || !headers.includes('energy_kwh')) {
    return res.status(400).json({ message: "Invalid CSV format: Missing 'timestamp' or 'energy_kwh' columns" });
  }

  const timeIdx = headers.indexOf('timestamp');
  const energyIdx = headers.indexOf('energy_kwh');

  const validRecords = [];
  const timestampSet = new Set();
  let duplicates = 0;
  let invalidValues = 0;

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
    const rawTime = cols[timeIdx];
    const rawEnergy = cols[energyIdx];

    const d = new Date(rawTime);
    const energyVal = parseFloat(rawEnergy);

    if (isNaN(d.getTime())) continue;
    if (isNaN(energyVal) || energyVal < 0 || !isFinite(energyVal)) {
      invalidValues++;
      continue;
    }

    const iso = d.toISOString();
    if (timestampSet.has(iso)) {
      duplicates++;
      continue;
    }
    timestampSet.add(iso);

    validRecords.push({
      id: 'rec-' + Date.now() + '-' + i,
      user_id: req.user.id,
      timestamp: iso,
      energy_kwh: energyVal
    });
  }

  if (validRecords.length < 48) {
    return res.status(400).json({
      message: `Insufficient time-series history: Found ${validRecords.length} records, minimum 48 intervals required.`
    });
  }

  validRecords.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const newUpload = {
    id: 'upl-' + Date.now(),
    user_id: req.user.id,
    file_name: req.file.originalname,
    file_type: req.file.mimetype || 'text/csv',
    record_count: validRecords.length,
    start_date: validRecords[0].timestamp,
    end_date: validRecords[validRecords.length - 1].timestamp,
    sampling_interval_minutes: 30,
    status: 'VALIDATED',
    uploaded_at: new Date().toISOString()
  };

  uploadsStore.unshift(newUpload);
  recordsStore = validRecords;

  res.status(201).json({
    success: true,
    upload: newUpload,
    validation: {
      duplicatesDetected: duplicates,
      invalidValuesFiltered: invalidValues,
      missingIntervalsDetected: 0
    }
  });
});

router.delete('/:id', authMiddleware, (req, res) => {
  uploadsStore = uploadsStore.filter(u => u.id !== req.params.id);
  res.json({ success: true, message: 'Upload deleted successfully' });
});

export default router;
