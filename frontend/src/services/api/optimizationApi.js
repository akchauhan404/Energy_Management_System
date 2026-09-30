import { apiRequest, USE_MOCK } from './apiClient';
import {
  generateMockOptimizationSchedule,
  mockPpoExplanations
} from './mockData';

const MOCK_OPTIMIZATION_KEY = 'energy_ai_mock_optimization';

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

    timeFormatted: new Date(step.timestamp).toLocaleString(
      undefined,
      {
        hour: '2-digit',
        minute: '2-digit'
      }
    ),

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

function createMockOptimization() {
  const schedule =
    generateMockOptimizationSchedule();

  return {
    id: 'opt-mock-latest',
    status: 'COMPLETED',
    created_at: new Date().toISOString(),
    algorithm: 'Stable-Baselines3 PPO',
    model_name:
      'Best PPO Energy Optimization Model',
    model_version: 'v1.0.0',
    evaluation_type:
      'Forecast-grounded simulation evaluation',

    summary: {
      baseline_grid_energy: 80.816,
      optimized_grid_energy: 77.016,
      grid_reduction_pct: 4.70,

      baseline_cost: 565.495,
      optimized_cost: 550.295,
      cost_reduction_pct: 2.69,

      baseline_peak_demand: 8.414,
      optimized_peak_demand: 7.577,
      peak_reduction_pct: 9.95,

      renewable_utilization: 100.0,
      constraint_violations: 0
    },

    schedule,

    explanations: mockPpoExplanations
  };
}

export const optimizationApi = {
  async getLatestOptimization() {
    if (USE_MOCK) {
      await new Promise((resolve) =>
        setTimeout(resolve, 400)
      );

      const stored = localStorage.getItem(
        MOCK_OPTIMIZATION_KEY
      );

      if (stored) {
        return JSON.parse(stored);
      }

      const optimization =
        createMockOptimization();

      localStorage.setItem(
        MOCK_OPTIMIZATION_KEY,
        JSON.stringify(optimization)
      );

      return optimization;
    }

    const response = await apiRequest(
      '/optimization'
    );

    return normalizeOptimization(
      response.data
    );
  },

  async runOptimization() {
    if (USE_MOCK) {
      await new Promise((resolve) =>
        setTimeout(resolve, 1400)
      );

      const optimization = {
        ...createMockOptimization(),
        id: 'opt-' + Date.now(),
        created_at:
          new Date().toISOString()
      };

      localStorage.setItem(
        MOCK_OPTIMIZATION_KEY,
        JSON.stringify(optimization)
      );

      return optimization;
    }

    const response = await apiRequest(
      '/optimization/run',
      {
        method: 'POST'
      }
    );

    return normalizeOptimization(
      response.data
    );
  },

  async getExplanation(optimizationId) {
    if (USE_MOCK) {
      return {
        optimizationId,
        explanations: mockPpoExplanations,

        xai: {
          method: 'Integrated Gradients',
          baseline:
            'zero_normalized_observation',
          steps: 32,
          observation_dimensions: 10,
          action_dimensions: 5
        },

        disclaimer:
          'Integrated Gradients measures the signed sensitivity of the PPO policy outputs to its normalized observation features relative to the selected baseline. These attributions describe model sensitivity and should not be interpreted as proof of physical causality.'
      };
    }

    const response = await apiRequest(
      `/optimization/${optimizationId}/explanation`
    );

    return response.data;
  }
};