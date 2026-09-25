import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware('ADMIN'));

router.get('/datasets', (req, res) => {
  res.json([
    {
      id: 'ds-001',
      version: 'LCL-Aggregated-v2.4',
      description: 'London Low Carbon London household aggregate 30-minute benchmark series',
      total_records: 17520,
      start_date: '2025-01-01T00:00:00.000Z',
      end_date: '2025-12-31T23:30:00.000Z',
      status: 'ACTIVE',
      created_at: '2026-01-10T14:20:00.000Z'
    },
    {
      id: 'ds-002',
      version: 'Residential-Microgrid-v1.1',
      description: 'Smart meter consumer readings with solar PV and variable multi-tariff records',
      total_records: 8760,
      start_date: '2025-06-01T00:00:00.000Z',
      end_date: '2025-11-30T23:30:00.000Z',
      status: 'ACTIVE',
      created_at: '2026-02-15T09:45:00.000Z'
    }
  ]);
});

router.get('/models', (req, res) => {
  res.json({
    forecastModels: [
      {
        id: 'model-fc-01',
        name: 'Transformer-24h',
        version: 'v2.2.0 (Active)',
        architecture: 'Horizon-Specific Multi-Scale Transformer',
        lookback: 48,
        horizon: 48,
        sampling_interval_minutes: 30,
        status: 'ACTIVE',
        created_at: '2026-08-12T16:30:00.000Z',
        isApproved: true
      },
      {
        id: 'model-fc-02',
        name: 'GRU-Benchmark-24h',
        version: 'v1.4.0',
        architecture: 'Gated Recurrent Unit (Baseline Benchmark)',
        lookback: 48,
        horizon: 48,
        sampling_interval_minutes: 30,
        status: 'BENCHMARK',
        created_at: '2026-08-01T10:00:00.000Z',
        isApproved: false
      }
    ],
    ppoModels: [
      {
        id: 'model-ppo-01',
        name: 'PPO-Energy-Optimizer',
        version: 'v1.2.0 (Active)',
        algorithm: 'Stable-Baselines3 PPO',
        policy: 'MlpPolicy (Actor-Critic)',
        horizon: 48,
        sampling_interval_minutes: 30,
        status: 'ACTIVE',
        created_at: '2026-08-20T11:15:00.000Z',
        isApproved: true
      }
    ]
  });
});

router.get('/training-runs', (req, res) => {
  res.json([
    {
      id: 'run-902',
      model_type: 'FORECAST (Transformer)',
      dataset_version: 'LCL-Aggregated-v2.4',
      status: 'COMPLETED',
      started_at: '2026-08-12T14:00:00.000Z',
      completed_at: '2026-08-12T16:28:44.000Z',
      mae: 61.7247,
      rmse: 89.4116,
      mape: 5.1582,
      r2: 0.9505
    },
    {
      id: 'run-901',
      model_type: 'PPO (Stable-Baselines3)',
      dataset_version: 'Residential-Microgrid-v1.1',
      status: 'COMPLETED',
      started_at: '2026-08-20T08:30:00.000Z',
      completed_at: '2026-08-20T11:14:12.000Z',
      mae: null,
      rmse: null,
      mape: null,
      r2: null
    }
  ]);
});

router.get('/forecast-performance', (req, res) => {
  res.json({
    benchmarks: [
      {
        method: 'Horizon-Specific Transformer',
        mae: 61.7247,
        rmse: 89.4116,
        mape: '5.1582%',
        smape: '5.0044%',
        r2: 0.9505,
        note: 'Selected project forecasting artifact (multi-scale attention)'
      },
      {
        method: 'GRU Benchmark',
        mae: 53.2501,
        rmse: 76.4766,
        mape: '4.5065%',
        smape: '4.4419%',
        r2: 0.9638,
        note: 'Benchmark model; exhibits lower test error on held-out LCL test set'
      },
      {
        method: 'Seasonal Naive (48 steps)',
        mae: 68.2794,
        rmse: 113.9893,
        mape: '5.6649%',
        smape: '5.5811%',
        r2: 0.9195,
        note: 'Projects previous day 48-step readings forward'
      },
      {
        method: 'Persistence (Lag 1)',
        mae: 449.6481,
        rmse: 562.4584,
        mape: '42.7884%',
        smape: '38.0961%',
        r2: -0.9602,
        note: 'Simple naive last-step baseline'
      }
    ]
  });
});

router.get('/ppo-performance', (req, res) => {
  res.json({
    validation: {
      baseline_grid_energy: 86.717,
      ppo_grid_energy: 82.917,
      grid_reduction_pct: 4.38,
      baseline_cost: 609.958,
      ppo_cost: 594.758,
      cost_reduction_pct: 2.49,
      baseline_peak_demand: 8.715,
      ppo_peak_demand: 7.420,
      peak_reduction_pct: 14.86,
      constraint_violations: 0,
      renewable_utilization: 100
    },
    test: {
      baseline_grid_energy: 80.816,
      ppo_grid_energy: 77.016,
      grid_reduction_pct: 4.70,
      baseline_cost: 565.495,
      ppo_cost: 550.295,
      cost_reduction_pct: 2.69,
      baseline_peak_demand: 8.414,
      ppo_peak_demand: 7.577,
      peak_reduction_pct: 9.95,
      constraint_violations: 0,
      renewable_utilization: 100
    }
  });
});

router.post('/training/forecast', (req, res) => {
  res.status(202).json({
    runId: 'run-' + Date.now(),
    status: 'QUEUED',
    message: `Approved Transformer training run queued successfully for dataset ${req.body.datasetVersionId || 'LCL-Aggregated-v2.4'}.`
  });
});

export default router;
