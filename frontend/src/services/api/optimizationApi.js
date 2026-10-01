import { apiRequest } from './apiClient';

function getBatteryAction(action = '') {
  if (action.includes('CHARGE_BATTERY')) {
    return 'Charge';
  }

  if (action.includes('DISCHARGE_BATTERY')) {
    return 'Discharge';
  }

  return 'Idle';
}

function getFlexibleLoadAction(action = '') {
  const flexibleActions = [];

  if (action.includes('RUN_WASHING_MACHINE')) {
    flexibleActions.push('Washing Machine');
  }

  if (action.includes('RUN_WATER_HEATER')) {
    flexibleActions.push('Water Heater');
  }

  if (action.includes('RUN_EV_CHARGER')) {
    flexibleActions.push('EV Charger');
  }

  if (flexibleActions.length === 0) {
    return 'Idle';
  }

  return flexibleActions.join(' + ');
}

function normalizeSchedule(steps = []) {
  return steps.map((step) => ({
    step_index: Number(step.step_index),

    timeFormatted: new Date(
      step.timestamp
    ).toLocaleString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    }),

    timestamp: step.timestamp,

    forecastDemand: Number(
      step.explanations?.[0]?.forecast_demand ?? 0
    ),

    flexibleLoadAction: getFlexibleLoadAction(
      step.action
    ),

    batteryAction: getBatteryAction(
      step.action
    ),

    batterySoc: Number(step.battery_soc) * 100,

    solarGeneration: Number(
      step.solar_generation_kwh ?? 0
    ),

    gridEnergy: Number(
      step.grid_energy_kwh ?? 0
    ),

    cost: Number(
      step.electricity_cost ?? 0
    ),

    action: step.action
  }));
}

function normalizeExplanations(steps = []) {
  return steps.flatMap((step) =>
    (step.explanations || []).map((explanation) => ({
      ...explanation,

      step_index: Number(step.step_index),

      time: new Date(
        step.timestamp
      ).toLocaleString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      })
    }))
  );
}

function normalizeOptimization(data) {
  if (!data) {
    return null;
  }

  const summary = data.summary || {};
  const evaluation = data.evaluation || {};
  const steps = Array.isArray(data.steps)
    ? data.steps
    : [];

  return {
    id: data.id,
    status: data.status,
    created_at: data.created_at,

    algorithm:
      data.ppo_model?.algorithm ||
      'Stable-Baselines3 PPO',

    model_name:
      data.ppo_model?.name ||
      'Best PPO Energy Optimization Model',

    model_version:
      data.ppo_model?.version ||
      'v1.0.0',

    evaluation_type:
      'Forecast-grounded simulation evaluation',

    summary: {
      baseline_grid_energy: Number(
        summary.baseline_grid_energy ?? 0
      ),

      optimized_grid_energy: Number(
        summary.optimized_grid_energy ?? 0
      ),

      grid_reduction_pct: Number(
        evaluation.grid_reduction_pct ?? 0
      ),

      baseline_cost: Number(
        summary.baseline_cost ?? 0
      ),

      optimized_cost: Number(
        summary.optimized_cost ?? 0
      ),

      cost_reduction_pct: Number(
        evaluation.cost_reduction_pct ?? 0
      ),

      baseline_peak_demand: Number(
        summary.baseline_peak_demand ?? 0
      ),

      optimized_peak_demand: Number(
        summary.optimized_peak_demand ?? 0
      ),

      peak_reduction_pct: Number(
        evaluation.peak_reduction_pct ?? 0
      ),

      renewable_utilization: Number(
        summary.renewable_utilization ?? 0
      ),

      constraint_violations: Number(
        summary.constraint_violations ?? 0
      )
    },

    schedule: normalizeSchedule(steps),

    explanations: normalizeExplanations(steps)
  };
}

export const optimizationApi = {
  async getLatestOptimization() {
    const response = await apiRequest(
      '/optimization'
    );

    return normalizeOptimization(
      response.data
    );
  },

  async runOptimization(forecastId) {
    if (!forecastId) {
      throw new Error(
        'A forecast ID is required to run optimization.'
      );
    }

    const response = await apiRequest(
      '/optimization/run',
      {
        method: 'POST',
        body: JSON.stringify({
          forecast_id: forecastId
        })
      }
    );

    return normalizeOptimization(
      response.data
    );
  },

  async getExplanation(optimizationId) {
    const response = await apiRequest(
      `/optimization/${optimizationId}/explanation`
    );

    return response.data;
  }
};