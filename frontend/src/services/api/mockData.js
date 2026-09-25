// High-fidelity domain mock data aligned with project Master Document specifications

// Generate 48-point 30-min forecast starting from next 30-min boundary
export const generateMockForecastPoints = () => {
  const points = [];
  const now = new Date();
  now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30, 0, 0);

  // Typical diurnal consumption profile with morning & evening peaks (kW / kWh per 30m)
  const baseProfile = [
    1.15, 1.08, 1.02, 0.98, 0.95, 0.92, 0.96, 1.10, // 00:00 - 03:30 (night base)
    1.35, 1.85, 2.40, 2.75, 2.50, 2.20, 1.95, 1.80, // 04:00 - 07:30 (morning ramp)
    1.75, 1.82, 1.90, 1.88, 1.85, 1.78, 1.72, 1.68, // 08:00 - 11:30 (midday)
    1.65, 1.62, 1.70, 1.85, 2.10, 2.45, 2.90, 3.25, // 12:00 - 15:30 (afternoon ramp)
    3.40, 3.35, 3.15, 2.90, 2.70, 2.45, 2.15, 1.85, // 16:00 - 19:30 (evening peak)
    1.65, 1.50, 1.40, 1.32, 1.25, 1.20, 1.18, 1.14  // 20:00 - 23:30 (winding down)
  ];

  for (let i = 0; i < 48; i++) {
    const timestamp = new Date(now.getTime() + i * 30 * 60 * 1000);
    const predicted_energy_kwh = parseFloat((baseProfile[i] * (0.97 + Math.sin(i / 3) * 0.05)).toFixed(3));
    points.push({
      step_index: i,
      timestamp: timestamp.toISOString(),
      timeFormatted: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      predicted_energy_kwh
    });
  }
  return points;
};

// 15-Feature Integrated Gradients explanations matching exact model feature contract
export const mockForecastExplanations = [
  {
    feature: 'energy_kwh',
    label: 'Recent Energy Consumption (lag 0)',
    contribution: 0.284,
    direction: 'POSITIVE',
    explanation: 'High immediate baseline demand drove upward momentum across initial forecast steps.'
  },
  {
    feature: 'lag_48',
    label: 'Previous Day Same-Step Demand (lag 48)',
    contribution: 0.241,
    direction: 'POSITIVE',
    explanation: 'Strong 24-hour diurnal cycle reinforced recurring morning and evening peak levels.'
  },
  {
    feature: 'rolling_mean_48',
    label: '24-Hour Rolling Average',
    contribution: 0.165,
    direction: 'POSITIVE',
    explanation: 'Overall daily volume baseline anchors consumption against extreme step variations.'
  },
  {
    feature: 'hour_sin',
    label: 'Time of Day Sinusoidal Component',
    contribution: 0.118,
    direction: 'POSITIVE',
    explanation: 'Temporal position aligned with cyclic residential load ramp-up periods.'
  },
  {
    feature: 'lag_1',
    label: 'Immediate Prior Step (lag 1)',
    contribution: 0.092,
    direction: 'POSITIVE',
    explanation: 'Short-term autoregressive continuity smoothly bridged step transitions.'
  },
  {
    feature: 'rolling_max_48',
    label: '24-Hour Peak Envelope',
    contribution: 0.075,
    direction: 'POSITIVE',
    explanation: 'Elevated prior peak window constrained expected upper bound margin.'
  },
  {
    feature: 'dow_sin',
    label: 'Day-of-Week Sinusoidal Component',
    contribution: -0.063,
    direction: 'NEGATIVE',
    explanation: 'Weekday vs weekend schedule adjustment slightly moderated mid-afternoon projection.'
  },
  {
    feature: 'rolling_mean_4',
    label: '2-Hour Moving Trend',
    contribution: 0.051,
    direction: 'POSITIVE',
    explanation: 'Recent 2-hour trend indicated steady non-decaying load progression.'
  },
  {
    feature: 'hour_cos',
    label: 'Time of Day Cosine Component',
    contribution: -0.048,
    direction: 'NEGATIVE',
    explanation: 'Secondary diurnal harmonic dampens prediction during late-night off-peak hours.'
  },
  {
    feature: 'lag_2',
    label: '1-Hour Prior Consumption (lag 2)',
    contribution: 0.038,
    direction: 'POSITIVE',
    explanation: 'Subtle inertia reinforcement confirming persistent load activity.'
  },
  {
    feature: 'rolling_mean_2',
    label: '1-Hour Rolling Mean',
    contribution: 0.029,
    direction: 'POSITIVE',
    explanation: 'Noise filtering on immediate history stabilizes forecast initiation.'
  },
  {
    feature: 'lag_4',
    label: '2-Hour Prior Consumption (lag 4)',
    contribution: -0.024,
    direction: 'NEGATIVE',
    explanation: 'Historical inflection point slightly pulled back premature peak estimates.'
  },
  {
    feature: 'dow_cos',
    label: 'Day-of-Week Cosine Component',
    contribution: 0.019,
    direction: 'POSITIVE',
    explanation: 'Cyclic calendar feature supporting weekday profile normalization.'
  },
  {
    feature: 'month_sin',
    label: 'Seasonal Sinusoidal Component',
    contribution: 0.015,
    direction: 'POSITIVE',
    explanation: 'Seasonal baseline reflects current seasonal base cooling/heating factor.'
  },
  {
    feature: 'month_cos',
    label: 'Seasonal Cosine Component',
    contribution: -0.011,
    direction: 'NEGATIVE',
    explanation: 'Long-term annual cycle damping marginal inter-month drift.'
  }
];

// 48-step PPO Optimization Schedule
export const generateMockOptimizationSchedule = (forecastPoints) => {
  const points = forecastPoints || generateMockForecastPoints();
  const schedule = [];

  let currentSoc = 0.50; // Initial battery SOC
  const batteryCap = 10.0; // kWh

  for (let i = 0; i < 48; i++) {
    const pt = points[i];
    const demand = pt.predicted_energy_kwh;
    const hour = parseInt(pt.timeFormatted.split(':')[0], 10);
    const isPeakHour = (hour >= 17 && hour <= 21);
    const isMiddaySolar = (hour >= 10 && hour <= 15);
    const isNightOffPeak = (hour >= 1 && hour <= 5);

    // Simulated solar profile (kW)
    let solarGen = 0.0;
    if (hour >= 7 && hour <= 18) {
      solarGen = parseFloat((Math.sin(((hour - 7) / 11) * Math.PI) * 2.8 * (0.9 + (i % 2) * 0.1)).toFixed(3));
    }

    // Tariff: High peak ₹9.50/kWh, Mid ₹6.50/kWh, Off-peak ₹3.80/kWh
    let tariffRate = 6.50;
    if (isPeakHour) tariffRate = 9.50;
    if (isNightOffPeak) tariffRate = 3.80;

    let batteryAction = 'Idle';
    let flexLoadAction = 'Idle';
    let batteryPowerKw = 0.0; // Positive = discharge, Negative = charge

    // PPO Decision Policy Logic
    if (isNightOffPeak && currentSoc < 0.85) {
      batteryAction = 'Charge';
      batteryPowerKw = -1.5;
      currentSoc = Math.min(0.90, currentSoc + (1.5 * 0.5 * 0.95) / batteryCap);
    } else if (isMiddaySolar && solarGen > demand && currentSoc < 0.88) {
      batteryAction = 'Charge';
      batteryPowerKw = -Math.min(2.0, solarGen - demand);
      currentSoc = Math.min(0.90, currentSoc + (Math.abs(batteryPowerKw) * 0.5 * 0.95) / batteryCap);
      flexLoadAction = 'Run Load'; // Run deferrable wash/cooling on solar surplus
    } else if (isPeakHour && currentSoc > 0.20) {
      batteryAction = 'Discharge';
      batteryPowerKw = Math.min(2.5, demand * 0.7);
      currentSoc = Math.max(0.10, currentSoc - (batteryPowerKw * 0.5 / 0.95) / batteryCap);
      flexLoadAction = 'Delay Load'; // Defer non-critical load during tariff spike
    } else if (demand > 2.5 && currentSoc > 0.35) {
      batteryAction = 'Discharge';
      batteryPowerKw = 1.2;
      currentSoc = Math.max(0.10, currentSoc - (batteryPowerKw * 0.5 / 0.95) / batteryCap);
    }

    const solarUsed = Math.min(solarGen, demand + (batteryPowerKw < 0 ? Math.abs(batteryPowerKw) : 0));
    const effectiveDemand = demand - (batteryPowerKw > 0 ? batteryPowerKw : 0) + (batteryPowerKw < 0 ? Math.abs(batteryPowerKw) : 0);
    const gridEnergy = Math.max(0, parseFloat((effectiveDemand - solarUsed).toFixed(3)));
    const cost = parseFloat((gridEnergy * tariffRate).toFixed(2));

    schedule.push({
      step_index: i,
      timestamp: pt.timestamp,
      timeFormatted: pt.timeFormatted,
      forecastDemand: demand,
      flexibleLoadAction: flexLoadAction,
      batteryAction,
      batterySoc: parseFloat((currentSoc * 100).toFixed(1)),
      solarGeneration: solarGen,
      solarUsed: parseFloat(solarUsed.toFixed(3)),
      gridEnergy,
      cost,
      tariffRate
    });
  }

  return schedule;
};

// PPO Decision Explanations matching environment states
export const mockPpoExplanations = [
  {
    step_index: 6,
    time: '03:00',
    forecast_demand: '0.96 kWh',
    tariff: '₹3.80/kWh (Off-Peak)',
    battery_soc: '54.2%',
    peak_risk: 'LOW',
    selected_action: 'Battery Charge & Idle Load',
    reason: 'Off-peak tariff window detected with low grid demand; charging battery to prepare reserve for expected morning activity.'
  },
  {
    step_index: 22,
    time: '11:00',
    forecast_demand: '1.78 kWh',
    tariff: '₹6.50/kWh (Normal)',
    battery_soc: '72.5%',
    peak_risk: 'LOW',
    selected_action: 'Run Flexible Load & Solar Absorption',
    reason: 'Solar generation peaked above baseline demand; scheduled deferrable appliance run to achieve 100% renewable self-consumption.'
  },
  {
    step_index: 34,
    time: '17:00',
    forecast_demand: '3.40 kWh',
    tariff: '₹9.50/kWh (Peak)',
    battery_soc: '84.0%',
    peak_risk: 'HIGH',
    selected_action: 'Battery Discharge (2.3 kW) & Delay Load',
    reason: 'High tariff window coincident with daily demand peak; discharged stored energy to curtail peak grid draw by 9.95% and save peak-rate utility charges.'
  },
  {
    step_index: 38,
    time: '19:00',
    forecast_demand: '2.70 kWh',
    tariff: '₹9.50/kWh (Peak)',
    battery_soc: '45.1%',
    peak_risk: 'HIGH',
    selected_action: 'Battery Discharge (1.8 kW)',
    reason: 'Maintained sustained discharge during critical evening peak period while preserving battery state-of-charge above the 10% minimum safety buffer.'
  }
];

// Historical Energy Records Generator (Last 7 days, 30-min intervals = 336 points)
export const generateMockHistoricalRecords = () => {
  const records = [];
  const now = new Date();
  const startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  startTime.setMinutes(0, 0, 0);

  for (let i = 0; i < 336; i++) {
    const t = new Date(startTime.getTime() + i * 30 * 60 * 1000);
    const hour = t.getHours();
    const isWeekend = t.getDay() === 0 || t.getDay() === 6;
    const base = 1.2 + Math.sin(hour / 3.8) * 0.8 + (isWeekend ? 0.3 : 0.0);
    const noise = (Math.sin(i * 11) * 0.25);
    const val = Math.max(0.4, parseFloat((base + noise).toFixed(3)));

    records.push({
      id: `hist-${i}`,
      timestamp: t.toISOString(),
      energy_kwh: val
    });
  }
  return records;
};

// Admin Datasets Mock
export const mockAdminDatasets = [
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
];

// Admin Models Mock
export const mockAdminModels = {
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
};

// Admin Training Runs Mock
export const mockAdminTrainingRuns = [
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
];

// Official Model Performance Benchmarks from Master Document Section 39 & 41
export const forecastPerformanceTable = [
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
];

// Official PPO Performance Evaluation from Master Document Section 42
export const ppoPerformanceData = {
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
};
