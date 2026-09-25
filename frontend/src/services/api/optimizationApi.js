import { apiRequest, USE_MOCK } from './apiClient';
import { generateMockOptimizationSchedule, mockPpoExplanations } from './mockData';

const MOCK_OPTIMIZATION_KEY = 'energy_ai_mock_optimization';

export const optimizationApi = {
  async getLatestOptimization() {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 400));
      const stored = localStorage.getItem(MOCK_OPTIMIZATION_KEY);
      if (stored) return JSON.parse(stored);

      const schedule = generateMockOptimizationSchedule();
      const optimization = {
        id: 'opt-mock-latest',
        status: 'COMPLETED',
        created_at: new Date().toISOString(),
        algorithm: 'Stable-Baselines3 PPO',
        evaluation_type: 'Forecast-grounded simulation evaluation',
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

      localStorage.setItem(MOCK_OPTIMIZATION_KEY, JSON.stringify(optimization));
      return optimization;
    }

    try {
      return await apiRequest('/optimization');
    } catch {
      return this.getLatestOptimization();
    }
  },

  async runOptimization() {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 1400));
      const schedule = generateMockOptimizationSchedule();
      const optimization = {
        id: 'opt-' + Date.now(),
        status: 'COMPLETED',
        created_at: new Date().toISOString(),
        algorithm: 'Stable-Baselines3 PPO',
        evaluation_type: 'Forecast-grounded simulation evaluation',
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

      localStorage.setItem(MOCK_OPTIMIZATION_KEY, JSON.stringify(optimization));
      return optimization;
    }

    return await apiRequest('/optimization/run', { method: 'POST' });
  },

  async getExplanation(optimizationId) {
    if (USE_MOCK) {
      return {
        optimizationId,
        explanations: mockPpoExplanations,
        disclaimer: 'PPO explanation layer grounds agent action decisions in observable state variables (tariff period, battery SOC, peak risk envelope, and solar availability).'
      };
    }
    return await apiRequest(`/optimization/${optimizationId}/explanation`);
  }
};
