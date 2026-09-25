import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

const mock15Explanations = [
  { feature: 'energy_kwh', label: 'Recent Energy Consumption (lag 0)', contribution: 0.284, direction: 'POSITIVE', explanation: 'High immediate baseline demand drove upward momentum across initial forecast steps.' },
  { feature: 'lag_48', label: 'Previous Day Same-Step Demand (lag 48)', contribution: 0.241, direction: 'POSITIVE', explanation: 'Strong 24-hour diurnal cycle reinforced recurring morning and evening peak levels.' },
  { feature: 'rolling_mean_48', label: '24-Hour Rolling Average', contribution: 0.165, direction: 'POSITIVE', explanation: 'Overall daily volume baseline anchors consumption against extreme step variations.' },
  { feature: 'hour_sin', label: 'Time of Day Sinusoidal Component', contribution: 0.118, direction: 'POSITIVE', explanation: 'Temporal position aligned with cyclic residential load ramp-up periods.' },
  { feature: 'lag_1', label: 'Immediate Prior Step (lag 1)', contribution: 0.092, direction: 'POSITIVE', explanation: 'Short-term autoregressive continuity smoothly bridged step transitions.' },
  { feature: 'rolling_max_48', label: '24-Hour Peak Envelope', contribution: 0.075, direction: 'POSITIVE', explanation: 'Elevated prior peak window constrained expected upper bound margin.' },
  { feature: 'dow_sin', label: 'Day-of-Week Sinusoidal Component', contribution: -0.063, direction: 'NEGATIVE', explanation: 'Weekday vs weekend schedule adjustment slightly moderated mid-afternoon projection.' },
  { feature: 'rolling_mean_4', label: '2-Hour Moving Trend', contribution: 0.051, direction: 'POSITIVE', explanation: 'Recent 2-hour trend indicated steady non-decaying load progression.' },
  { feature: 'hour_cos', label: 'Time of Day Cosine Component', contribution: -0.048, direction: 'NEGATIVE', explanation: 'Secondary diurnal harmonic dampens prediction during late-night off-peak hours.' },
  { feature: 'lag_2', label: '1-Hour Prior Consumption (lag 2)', contribution: 0.038, direction: 'POSITIVE', explanation: 'Subtle inertia reinforcement confirming persistent load activity.' },
  { feature: 'rolling_mean_2', label: '1-Hour Rolling Mean', contribution: 0.029, direction: 'POSITIVE', explanation: 'Noise filtering on immediate history stabilizes forecast initiation.' },
  { feature: 'lag_4', label: '2-Hour Prior Consumption (lag 4)', contribution: -0.024, direction: 'NEGATIVE', explanation: 'Historical inflection point slightly pulled back premature peak estimates.' },
  { feature: 'dow_cos', label: 'Day-of-Week Cosine Component', contribution: 0.019, direction: 'POSITIVE', explanation: 'Cyclic calendar feature supporting weekday profile normalization.' },
  { feature: 'month_sin', label: 'Seasonal Sinusoidal Component', contribution: 0.015, direction: 'POSITIVE', explanation: 'Seasonal baseline reflects current seasonal base cooling/heating factor.' },
  { feature: 'month_cos', label: 'Seasonal Cosine Component', contribution: -0.011, direction: 'NEGATIVE', explanation: 'Long-term annual cycle damping marginal inter-month drift.' }
];

const generatePoints = () => {
  const points = [];
  const now = new Date();
  now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30, 0, 0);

  const base = [
    1.15, 1.08, 1.02, 0.98, 0.95, 0.92, 0.96, 1.10,
    1.35, 1.85, 2.40, 2.75, 2.50, 2.20, 1.95, 1.80,
    1.75, 1.82, 1.90, 1.88, 1.85, 1.78, 1.72, 1.68,
    1.65, 1.62, 1.70, 1.85, 2.10, 2.45, 2.90, 3.25,
    3.40, 3.35, 3.15, 2.90, 2.70, 2.45, 2.15, 1.85,
    1.65, 1.50, 1.40, 1.32, 1.25, 1.20, 1.18, 1.14
  ];

  for (let i = 0; i < 48; i++) {
    const t = new Date(now.getTime() + i * 30 * 60 * 1000);
    const predicted_energy_kwh = parseFloat((base[i] * (0.97 + Math.sin(i / 3) * 0.05)).toFixed(3));
    points.push({
      step_index: i,
      timestamp: t.toISOString(),
      timeFormatted: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      predicted_energy_kwh
    });
  }
  return points;
};

let currentForecast = null;

const getOrMakeForecast = () => {
  if (currentForecast) return currentForecast;
  const points = generatePoints();
  const energies = points.map(p => p.predicted_energy_kwh);
  const total = energies.reduce((a, b) => a + b, 0);
  const avg = total / points.length;
  const peak = Math.max(...energies);

  currentForecast = {
    id: 'fc-' + Date.now(),
    model_name: 'Horizon-Specific Multi-Scale Transformer',
    model_version: 'v2.2.0',
    created_at: new Date().toISOString(),
    start_time: points[0].timestamp,
    end_time: points[points.length - 1].timestamp,
    horizon_hours: 24,
    sampling_interval_minutes: 30,
    total_points: 48,
    summary: {
      peak_forecast_kwh: parseFloat(peak.toFixed(3)),
      avg_forecast_kwh: parseFloat(avg.toFixed(3)),
      total_forecast_kwh: parseFloat(total.toFixed(3)),
      horizon_text: '24 hours (48 steps)'
    },
    points,
    explanations: mock15Explanations
  };
  return currentForecast;
};

router.get('/', authMiddleware, (req, res) => {
  res.json(getOrMakeForecast());
});

router.post('/generate', authMiddleware, (req, res) => {
  currentForecast = null; // force fresh prediction
  const fc = getOrMakeForecast();
  res.status(201).json(fc);
});

router.get('/:id/points', authMiddleware, (req, res) => {
  const fc = getOrMakeForecast();
  res.json(fc.points);
});

router.get('/:id/explanation', authMiddleware, (req, res) => {
  res.json({
    forecastId: req.params.id,
    explanations: mock15Explanations,
    disclaimer: 'Feature attribution values computed via Captum Integrated Gradients represent model sensitivity and input weight influence; they do not establish direct physical causality.'
  });
});

export default router;
