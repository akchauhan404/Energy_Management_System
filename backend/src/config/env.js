import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const requiredProductionVariables = [
  'JWT_SECRET',
  'DATABASE_URL'
];

if (isProduction) {
  const missingVariables = requiredProductionVariables.filter(
    (variable) => !process.env[variable]
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missingVariables.join(', ')}`
    );
  }
}

export const config = {
  port: Number(process.env.PORT || 5000),

  nodeEnv: process.env.NODE_ENV || 'development',

  jwtSecret:
    process.env.JWT_SECRET ||
    'development-only-change-this-secret',

  jwtExpiresIn:
    process.env.JWT_EXPIRES_IN || '7d',

  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/energy_ai?schema=public',

  pythonPath:
    process.env.PYTHON_PATH || 'python',

  forecastModelPath:
    process.env.FORECAST_MODEL_PATH || '',

  forecastScalerPath:
    process.env.FORECAST_SCALER_PATH || '',

  ppoModelPath:
    process.env.PPO_MODEL_PATH || ''
};