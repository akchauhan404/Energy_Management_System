import express from 'express';
import { randomUUID } from 'node:crypto';
import { authMiddleware } from '../middleware/authMiddleware.js';
import prisma from '../config/prisma.js';
import { runPpoInference } from '../services/mlService.js';

const router = express.Router();

const PPO_MODEL_VERSION = 'v1.0.0';
const PPO_MODEL_NAME = 'Best PPO Energy Optimization Model';
const PPO_ARTIFACT_PATH = 'backend/ml/artifacts/ppo';

const TIME_STEP_HOURS = 0.5;

// Simulation assumptions used by the trained PPO environment.
// These are representative simulation parameters, not physical
// measurements of a real household.
const SOLAR_PEAK_KW = 3.0;
const SOLAR_SUNRISE_STEP = 12;
const SOLAR_SUNSET_STEP = 36;

const FLEXIBLE_LOADS = {
  washing_machine: {
    power_kw: 1.0,
    start_step: 18,
    end_step: 39
  },
  water_heater: {
    power_kw: 2.0,
    start_step: 12,
    end_step: 43
  },
  ev_charger: {
    power_kw: 3.0,
    start_step: 14,
    end_step: 45
  }
};

function getTariff(stepIndex) {
  const hour = stepIndex / 2;

  if (hour < 6 || hour >= 22) {
    return 4.0;
  }

  if (hour < 17) {
    return 8.0;
  }

  return 12.0;
}

function getSolarGeneration(stepIndex) {
  if (
    stepIndex < SOLAR_SUNRISE_STEP ||
    stepIndex >= SOLAR_SUNSET_STEP
  ) {
    return 0.0;
  }

  const progress =
    (stepIndex - SOLAR_SUNRISE_STEP) /
    (SOLAR_SUNSET_STEP - SOLAR_SUNRISE_STEP);

  return (
    Math.sin(progress * Math.PI) *
    SOLAR_PEAK_KW /
    1.0
  );
}

function getBaselineFlexibleDemand(stepIndex) {
  let demand = 0.0;

  if (
    stepIndex >= FLEXIBLE_LOADS.washing_machine.start_step &&
    stepIndex <= FLEXIBLE_LOADS.washing_machine.start_step + 1
  ) {
    demand += FLEXIBLE_LOADS.washing_machine.power_kw;
  }

  if (
    stepIndex >= FLEXIBLE_LOADS.water_heater.start_step &&
    stepIndex <= FLEXIBLE_LOADS.water_heater.start_step + 2
  ) {
    demand += FLEXIBLE_LOADS.water_heater.power_kw;
  }

  if (
    stepIndex >= FLEXIBLE_LOADS.ev_charger.start_step &&
    stepIndex <= FLEXIBLE_LOADS.ev_charger.start_step + 5
  ) {
    demand += FLEXIBLE_LOADS.ev_charger.power_kw;
  }

  return demand;
}
function scaleForecastForPpo(forecast) {
  const maxForecast = Math.max(...forecast);

  if (!Number.isFinite(maxForecast) || maxForecast <= 0) {
    throw new Error('Forecast maximum must be greater than zero');
  }

  return forecast.map(
    (value) => (Number(value) / maxForecast) * 3.0
  );
}
function calculateBaseline(forecast) {
  const scaledForecast = scaleForecastForPpo(forecast);

  let totalGridEnergy = 0.0;
  let totalCost = 0.0;
  let peakDemandKw = 0.0;

  for (let i = 0; i < scaledForecast.length; i++) {
    // Forecast is already kWh per 30-minute step.
    const forecastDemand = Number(scaledForecast[i]);

    // Flexible-load values are kW, so convert to kWh for this
    // 30-minute interval.
    const flexiblePower = getBaselineFlexibleDemand(i);
    const flexibleEnergy =
      flexiblePower * TIME_STEP_HOURS;

    // Solar generation is kW, so convert to kWh for this interval.
    const solarPower = getSolarGeneration(i);
    const solarEnergy =
      solarPower * TIME_STEP_HOURS;

    const loadBeforeSolar =
      forecastDemand + flexibleEnergy;

    const solarUsed = Math.min(
      solarEnergy,
      loadBeforeSolar
    );

    const gridEnergy = Math.max(
      loadBeforeSolar - solarUsed,
      0
    );

    const gridPowerKw =
      gridEnergy / TIME_STEP_HOURS;

    const tariff = getTariff(i);

    totalGridEnergy += gridEnergy;
    totalCost += gridEnergy * tariff;

    peakDemandKw = Math.max(
      peakDemandKw,
      gridPowerKw
    );
  }

  return {
    grid_energy_kwh: totalGridEnergy,
    cost: totalCost,
    peak_demand_kw: peakDemandKw
  };
}

function getActionDescription(step) {
  const actions = [];

  if (step.washing_machine_power_kw > 0) {
    actions.push('RUN_WASHING_MACHINE');
  }

  if (step.water_heater_power_kw > 0) {
    actions.push('RUN_WATER_HEATER');
  }

  if (step.ev_charger_power_kw > 0) {
    actions.push('RUN_EV_CHARGER');
  }

  if (step.charge_power_kw > 0) {
    actions.push('CHARGE_BATTERY');
  }

  if (step.discharge_power_kw > 0) {
    actions.push('DISCHARGE_BATTERY');
  }

  if (actions.length === 0) {
    return 'IDLE';
  }

  return actions.join(' + ');
}

function calculatePeakRisk(peakDemandKw, gridPowerKw) {
  if (peakDemandKw <= 0) {
    return 'LOW';
  }

  const ratio = gridPowerKw / peakDemandKw;

  if (ratio >= 0.9) {
    return 'HIGH';
  }

  if (ratio >= 0.7) {
    return 'MEDIUM';
  }

  return 'LOW';
}

async function getPpoModel() {
  let model = await prisma.pPOModelVersion.findUnique({
    where: {
      version: PPO_MODEL_VERSION
    }
  });

  if (!model) {
    model = await prisma.pPOModelVersion.create({
      data: {
        name: PPO_MODEL_NAME,
        version: PPO_MODEL_VERSION,
        algorithm: 'Stable-Baselines3 PPO',
        policy: 'MlpPolicy',
        artifact_path: PPO_ARTIFACT_PATH,
        horizon: 48,
        sampling_interval_minutes: 30,
        status: 'ACTIVE'
      }
    });
  }

  return model;
}

async function getOptimizationWithRelations(id, userId) {
  return prisma.optimizationRun.findFirst({
    where: {
      id,
      user_id: userId
    },
    include: {
      ppo_model: true,
      forecast: {
        include: {
          points: {
            orderBy: {
              step_index: 'asc'
            }
          }
        }
      },
      steps: {
        orderBy: {
          step_index: 'asc'
        },
        include: {
          explanations: true
        }
      },
      summary: true
    }
  });
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    const optimization = await prisma.optimizationRun.findFirst({
      where: {
        user_id: req.user.id
      },
      orderBy: {
        created_at: 'desc'
      },
      include: {
        ppo_model: true,
        forecast: true,
        steps: {
          orderBy: {
            step_index: 'asc'
          }
        },
        summary: true
      }
    });

    if (!optimization) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'OPTIMIZATION_NOT_FOUND',
          message: 'No optimization run found'
        }
      });
    }

    return res.json({
      success: true,
      data: optimization
    });
  } catch (error) {
    console.error('Failed to retrieve optimization:', error);

    return res.status(500).json({
      success: false,
      error: {
        code: 'OPTIMIZATION_RETRIEVAL_FAILED',
        message: 'Failed to retrieve optimization'
      }
    });
  }
});

router.post('/run', authMiddleware, async (req, res) => {
  try {
    const { forecast_id } = req.body;

    if (!forecast_id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FORECAST_ID_REQUIRED',
          message: 'forecast_id is required'
        }
      });
    }

    const forecast = await prisma.forecast.findFirst({
      where: {
        id: forecast_id,
        user_id: req.user.id
      },
      include: {
        points: {
          orderBy: {
            step_index: 'asc'
          }
        }
      }
    });

    if (!forecast) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FORECAST_NOT_FOUND',
          message: 'Forecast not found for the authenticated user'
        }
      });
    }

    if (forecast.points.length !== 48) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FORECAST_HORIZON',
          message: `Forecast must contain exactly 48 points. Received ${forecast.points.length}.`
        }
      });
    }

    const forecastValues = forecast.points
      .sort((a, b) => a.step_index - b.step_index)
      .map((point) => Number(point.predicted_energy_kwh));

    if (
      forecastValues.some(
        (value) =>
          !Number.isFinite(value) ||
          value < 0
      )
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FORECAST_VALUES',
          message: 'Forecast contains invalid energy values'
        }
      });
    }

    const ppoModel = await getPpoModel();

    const ppoResult = await runPpoInference({
      action: 'optimize',
      forecast: forecastValues
    });

    if (
      !ppoResult ||
      ppoResult.success !== true ||
      ppoResult.status !== 'COMPLETED'
    ) {
      return res.status(502).json({
        success: false,
        error: {
          code: 'PPO_INFERENCE_FAILED',
          message: 'PPO optimization did not complete successfully'
        },
        ml_result: ppoResult || null
      });
    }

    if (
      !Array.isArray(ppoResult.actions) ||
      ppoResult.actions.length !== 48
    ) {
      return res.status(502).json({
        success: false,
        error: {
          code: 'INVALID_PPO_RESULT',
          message: 'PPO returned an invalid optimization schedule'
        }
      });
    }

    const baseline = calculateBaseline(
      forecastValues
    );

    const optimizedGridEnergy =
      Number(ppoResult.optimized_grid_energy_kwh);

    const optimizedCost =
      Number(ppoResult.optimized_cost);

    const optimizedPeak =
      Number(ppoResult.optimized_peak_demand_kw);

    const gridReductionPct =
      baseline.grid_energy_kwh > 0
        ? (
            (
              baseline.grid_energy_kwh -
              optimizedGridEnergy
            ) /
            baseline.grid_energy_kwh
          ) * 100
        : 0;

    const costReductionPct =
      baseline.cost > 0
        ? (
            (
              baseline.cost -
              optimizedCost
            ) /
            baseline.cost
          ) * 100
        : 0;

    const peakReductionPct =
      baseline.peak_demand_kw > 0
        ? (
            (
              baseline.peak_demand_kw -
              optimizedPeak
            ) /
            baseline.peak_demand_kw
          ) * 100
        : 0;

        const optimization = await prisma.$transaction(
          async (tx) => {
            const optimizationRun =
              await tx.optimizationRun.create({
                data: {
                  user_id: req.user.id,
                  forecast_id: forecast.id,
                  ppo_model_id: ppoModel.id,
                  status: 'COMPLETED',
                  completed_at: new Date()
                }
              });
        
            /*
             * Generate the OptimizationStep IDs before inserting.
             * This allows OptimizationStep and OptimizationExplanation
             * records to be inserted with createMany() instead of
             * performing 96 sequential database operations.
             */
            const stepData = ppoResult.actions.map(
              (step, index) => {
                const forecastPoint =
                  forecast.points[index];
        
                const gridEnergy =
                  Number(step.grid_energy_kwh);
        
                const gridPower =
                  Number(step.grid_power_kw);
        
                const tariff =
                  Number(step.tariff);
        
                const batterySoc =
                  Number(step.battery_soc);
        
                const stepId = randomUUID();
        
                const action =
                  getActionDescription(step);
        
                const peakRisk =
                  calculatePeakRisk(
                    optimizedPeak,
                    gridPower
                  );
        
                return {
                  id: stepId,
                  optimization_id: optimizationRun.id,
                  timestamp: forecastPoint.timestamp,
                  step_index: index,
                  action,
                  battery_soc: batterySoc,
                  grid_energy_kwh: gridEnergy,
                  electricity_cost:
                    Number(step.electricity_cost),
                  peak_demand_kw: gridPower,
                  solar_generation_kwh:
                    Number(step.solar_generation_kwh),
                  solar_used_kwh:
                    Number(step.solar_used_kwh),
        
                  explanation: {
                    id: randomUUID(),
                    optimization_step_id: stepId,
                    forecast_demand:
                      Number(step.forecast_demand_kwh),
                    tariff,
                    battery_soc: batterySoc,
                    peak_risk: peakRisk,
                    selected_action: action,
                    reason:
                      'PPO selected the action from the observed forecast demand, tariff, battery state, solar availability, and flexible-load state.'
                  }
                };
              }
            );
        
            /*
             * Insert all 48 optimization steps in one database
             * operation.
             */
            await tx.optimizationStep.createMany({
              data: stepData.map(
                ({
                  explanation,
                  ...step
                }) => step
              )
            });
        
            /*
             * Insert all 48 explanations in one database
             * operation.
             */
            await tx.optimizationExplanation.createMany({
              data: stepData.map(
                ({ explanation }) =>
                  explanation
              )
            });
        
            /*
             * Store the final optimization summary.
             */
            await tx.optimizationSummary.create({
              data: {
                optimization_id:
                  optimizationRun.id,
        
                baseline_grid_energy:
                  baseline.grid_energy_kwh,
        
                optimized_grid_energy:
                  optimizedGridEnergy,
        
                baseline_cost:
                  baseline.cost,
        
                optimized_cost:
                  optimizedCost,
        
                baseline_peak_demand:
                  baseline.peak_demand_kw,
        
                optimized_peak_demand:
                  optimizedPeak,
        
                renewable_utilization:
                  Number(
                    ppoResult.renewable_utilization_pct
                  ),
        
                constraint_violations:
                  Number(
                    ppoResult.constraint_violations
                  ),
        
                reward:
                  Number.isFinite(
                    Number(ppoResult.reward)
                  )
                    ? Number(ppoResult.reward)
                    : null
              }
            });
        
            return optimizationRun;
          },
          {
            maxWait: 10000,
            timeout: 30000
          }
        );

    const result =
      await getOptimizationWithRelations(
        optimization.id,
        req.user.id
      );

    return res.status(201).json({
      success: true,
      data: {
        ...result,
        evaluation: {
          grid_reduction_pct:
            gridReductionPct,
          cost_reduction_pct:
            costReductionPct,
          peak_reduction_pct:
            peakReductionPct
        }
      }
    });
  } catch (error) {
    console.error(
      'PPO optimization failed:',
      error
    );

    return res.status(500).json({
      success: false,
      error: {
        code: 'OPTIMIZATION_FAILED',
        message: error.message ||
          'Failed to run PPO optimization'
      }
    });
  }
});

router.get('/:id/steps', authMiddleware, async (req, res) => {
  try {
    const optimization =
      await getOptimizationWithRelations(
        req.params.id,
        req.user.id
      );

    if (!optimization) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'OPTIMIZATION_NOT_FOUND',
          message: 'Optimization not found'
        }
      });
    }

    return res.json({
      success: true,
      data: optimization.steps
    });
  } catch (error) {
    console.error(
      'Failed to retrieve optimization steps:',
      error
    );

    return res.status(500).json({
      success: false,
      error: {
        code: 'OPTIMIZATION_STEPS_FAILED',
        message: 'Failed to retrieve optimization steps'
      }
    });
  }
});

router.get('/:id/explanation', authMiddleware, async (req, res) => {
  try {
    const optimization =
      await getOptimizationWithRelations(
        req.params.id,
        req.user.id
      );

    if (!optimization) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'OPTIMIZATION_NOT_FOUND',
          message: 'Optimization not found'
        }
      });
    }

    const explanations =
      optimization.steps.flatMap(
        (step) => step.explanations
      );

    return res.json({
      success: true,
      data: {
        optimizationId:
          optimization.id,
        explanations,
        disclaimer:
          'The explanation records describe observable state variables used during PPO optimization. A dedicated explainability layer will be added in the XAI phase.'
      }
    });
  } catch (error) {
    console.error(
      'Failed to retrieve optimization explanations:',
      error
    );

    return res.status(500).json({
      success: false,
      error: {
        code: 'OPTIMIZATION_EXPLANATION_FAILED',
        message: 'Failed to retrieve optimization explanations'
      }
    });
  }
});

export default router;