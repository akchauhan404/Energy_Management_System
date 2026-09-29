import express from 'express';

import { authMiddleware } from '../middleware/authMiddleware.js';
import prisma from '../config/prisma.js';
import { runPythonInference } from '../services/mlService.js';

const router = express.Router();

const FORECAST_MODEL_VERSION = 'v1.0.0';
const FORECAST_MODEL_NAME =
  'Horizon-Specific Multi-Scale Transformer';
/**
 * Find or create the active Transformer model version.
 *
 * The trained artifact is stored under:
 * backend/ml/artifacts/forecast/
 */
const getForecastModel = async () => {
  let model = await prisma.forecastModelVersion.findUnique({
    where: {
      version: FORECAST_MODEL_VERSION
    }
  });

  if (!model) {
    model = await prisma.forecastModelVersion.create({
      data: {
        name: 'Transformer-24h',
        version: FORECAST_MODEL_VERSION,
        architecture: FORECAST_MODEL_NAME,
        artifact_path: 'backend/ml/artifacts/forecast',
        lookback: 48,
        horizon: 48,
        sampling_interval_minutes: 30,
        status: 'ACTIVE'
      }
    });
  }

  return model;
};

/**
 * Convert Python forecast values into database forecast points.
 *
 * Python returns only the 48 predicted energy values.
 * Timestamps are therefore generated from the final historical
 * timestamp + 30-minute intervals.
 */
const buildForecastPoints = (
  forecastValues,
  lastHistoricalTimestamp
) => {
  const startTime =
    new Date(lastHistoricalTimestamp).getTime() +
    30 * 60 * 1000;

  return forecastValues.map(
    (predictedEnergy, index) => {
      const timestamp = new Date(
        startTime +
          index * 30 * 60 * 1000
      );

      return {
        timestamp,
        predicted_energy_kwh: Number(
          predictedEnergy
        ),
        step_index: index
      };
    }
  );
};

/**
 * Generate a real Transformer forecast.
 */
const generateForecast = async (userId) => {
  const history =
    await prisma.historicalEnergyRecord.findMany({
      where: {
        user_id: userId
      },
      orderBy: {
        timestamp: 'asc'
      },
      select: {
        timestamp: true,
        energy_kwh: true
      }
    });

  if (history.length < 96) {
    const error = new Error(
      `Insufficient historical data for Transformer inference. ` +
      `At least 96 continuous 30-minute records are required; ` +
      `only ${history.length} records are available.`
    );

    error.statusCode = 400;
    error.code = 'INSUFFICIENT_FORECAST_HISTORY';

    throw error;
  }

  const inferenceResult =
    await runPythonInference({
      action: 'forecast',
      history_records: history.map(
        (record) => ({
          timestamp:
            record.timestamp.toISOString(),
          energy_kwh: record.energy_kwh
        })
      )
    });

  if (
    !inferenceResult.success ||
    inferenceResult.status !== 'COMPLETED'
  ) {
    const error = new Error(
      inferenceResult.message ||
        'Transformer inference failed.'
    );

    error.statusCode = 502;
    error.code = 'TRANSFORMER_INFERENCE_FAILED';

    throw error;
  }

  if (
    !Array.isArray(inferenceResult.forecast) ||
    inferenceResult.forecast.length !== 48
  ) {
    const error = new Error(
      'Transformer returned an invalid forecast. Expected 48 forecast points.'
    );

    error.statusCode = 502;
    error.code = 'INVALID_TRANSFORMER_FORECAST';

    throw error;
  }
  const xaiResult =
    await runPythonInference({
      action: 'xai',
      history_records: history.map(
        (record) => ({
          timestamp:
            record.timestamp.toISOString(),
          energy_kwh: record.energy_kwh
        })
      )
    });

  if (
    !xaiResult.success ||
    xaiResult.status !== 'COMPLETED' ||
    !Array.isArray(xaiResult.explanations) ||
    xaiResult.explanations.length !== 15
  ) {
    const error = new Error(
      'Transformer XAI attribution failed.'
    );

    error.statusCode = 502;
    error.code = 'TRANSFORMER_XAI_FAILED';

    throw error;
  }

  const model = await getForecastModel();

  const points = buildForecastPoints(
    inferenceResult.forecast,
    history[history.length - 1].timestamp
  );

  const energies = points.map(
    (point) => point.predicted_energy_kwh
  );

  const totalForecast =
    energies.reduce(
      (sum, value) => sum + value,
      0
    );

  const averageForecast =
    totalForecast / energies.length;

  const peakForecast =
    Math.max(...energies);

  const startTime = points[0].timestamp;
  const endTime =
    points[points.length - 1].timestamp;

  const forecast =
    await prisma.forecast.create({
      data: {
        user_id: userId,
        model_id: model.id,
        start_time: startTime,
        end_time: endTime,
        horizon: 48,

        points: {
          create: points
        },

        explanations: {
          create:
            xaiResult.explanations.map(
              (explanation) => ({
                feature:
                  explanation.feature,
                contribution:
                  explanation.contribution,
                direction:
                  explanation.direction,
                explanation:
                  explanation.explanation
              })
            )
        }
      },
      include: {
        points: {
          orderBy: {
            step_index: 'asc'
          }
        },
        explanations: true,
        model: true
      }
    });

  return {
    id: forecast.id,
    model_name:
      forecast.model.architecture,
    model_version:
      forecast.model.version,
    created_at:
      forecast.created_at.toISOString(),
    start_time:
      forecast.start_time.toISOString(),
    end_time:
      forecast.end_time.toISOString(),
    horizon_hours: 24,
    sampling_interval_minutes: 30,
    total_points: forecast.points.length,

    summary: {
      peak_forecast_kwh:
        Number(
          peakForecast.toFixed(3)
        ),
      avg_forecast_kwh:
        Number(
          averageForecast.toFixed(3)
        ),
      total_forecast_kwh:
        Number(
          totalForecast.toFixed(3)
        ),
      horizon_text:
        '24 hours (48 steps)'
    },

    points: forecast.points,

    explanations:
      forecast.explanations,

    inference: {
      status:
        inferenceResult.status,
      model_loaded:
        inferenceResult.model_loaded,
      features:
        inferenceResult.features,
      lookback_steps:
        inferenceResult.lookback_steps,
      horizon_steps:
        inferenceResult.horizon_steps
    },
    xai: {
      method: xaiResult.method,
      target: xaiResult.target,
      baseline: xaiResult.baseline,
      steps: xaiResult.steps,
      convergence_delta:
        xaiResult.convergence_delta,
      features:
        xaiResult.features
    }
  };
};

/**
 * GET /api/forecast
 *
 * Returns the most recent forecast for the
 * authenticated user.
 */
router.get(
  '/',
  authMiddleware,
  async (req, res, next) => {
    try {
      const forecast =
        await prisma.forecast.findFirst({
          where: {
            user_id: req.user.id
          },
          orderBy: {
            created_at: 'desc'
          },
          include: {
            model: true,
            points: {
              orderBy: {
                step_index: 'asc'
              }
            },
            explanations: true
          }
        });

      if (!forecast) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'FORECAST_NOT_FOUND',
            message:
              'No forecast has been generated yet.'
          }
        });
      }

      const energies =
        forecast.points.map(
          (point) =>
            point.predicted_energy_kwh
        );

      const totalForecast =
        energies.reduce(
          (sum, value) => sum + value,
          0
        );

      const averageForecast =
        energies.length > 0
          ? totalForecast /
            energies.length
          : 0;

      const peakForecast =
        energies.length > 0
          ? Math.max(...energies)
          : 0;

      return res.status(200).json({
        success: true,
        forecast: {
          id: forecast.id,
          model_name:
            forecast.model.architecture,
          model_version:
            forecast.model.version,
          created_at:
            forecast.created_at.toISOString(),
          start_time:
            forecast.start_time.toISOString(),
          end_time:
            forecast.end_time.toISOString(),
          horizon_hours: 24,
          sampling_interval_minutes: 30,
          total_points:
            forecast.points.length,

          summary: {
            peak_forecast_kwh:
              Number(
                peakForecast.toFixed(3)
              ),
            avg_forecast_kwh:
              Number(
                averageForecast.toFixed(3)
              ),
            total_forecast_kwh:
              Number(
                totalForecast.toFixed(3)
              ),
            horizon_text:
              '24 hours (48 steps)'
          },

          points: forecast.points,
          explanations:
            forecast.explanations
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/forecast/generate
 *
 * Runs the actual Python Transformer inference
 * using historical records from PostgreSQL.
 */
router.post(
  '/generate',
  authMiddleware,
  async (req, res, next) => {
    try {
      const forecast =
        await generateForecast(
          req.user.id
        );

      return res.status(201).json({
        success: true,
        forecast
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/forecast/:id/points
 */
router.get(
  '/:id/points',
  authMiddleware,
  async (req, res, next) => {
    try {
      const forecast =
        await prisma.forecast.findFirst({
          where: {
            id: req.params.id,
            user_id: req.user.id
          }
        });

      if (!forecast) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'FORECAST_NOT_FOUND',
            message: 'Forecast not found.'
          }
        });
      }

      const points =
        await prisma.forecastPoint.findMany({
          where: {
            forecast_id: forecast.id
          },
          orderBy: {
            step_index: 'asc'
          }
        });

      return res.status(200).json({
        success: true,
        points
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/forecast/:id/explanation
 */
router.get(
  '/:id/explanation',
  authMiddleware,
  async (req, res, next) => {
    try {
      const forecast =
        await prisma.forecast.findFirst({
          where: {
            id: req.params.id,
            user_id: req.user.id
          }
        });

      if (!forecast) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'FORECAST_NOT_FOUND',
            message: 'Forecast not found.'
          }
        });
      }

      const explanations =
        await prisma.forecastExplanation.findMany(
          {
            where: {
              forecast_id: forecast.id
            }
          }
        );

      return res.status(200).json({
        success: true,
        forecastId:
          forecast.id,
        explanations,
        disclaimer:
          'Integrated Gradients measures the signed contribution of each model input feature relative to the selected baseline. These attributions describe model sensitivity and should not be interpreted as proof of physical causality.'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;