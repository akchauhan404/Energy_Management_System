import express from 'express';
import cors from 'cors';
import prisma from './config/prisma.js';
import authRoutes from './routes/auth.js';
import energyDataRoutes from './routes/energyData.js';
import forecastRoutes from './routes/forecast.js';
import optimizationRoutes from './routes/optimization.js';
import profileRoutes from './routes/profile.js';
import adminRoutes from './routes/admin.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import datasetRoutes from './routes/dataset.js';

const app = express();


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      service: 'AI-Based Energy Consumption Prediction and Optimization REST API',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    }
  });
});

//database health endpoint
// Database health endpoint
app.get('/api/health/database', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        database: 'postgresql'
      }
    });
  } catch (error) {
    console.error('Database health check failed:', error);

    return res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        database: 'postgresql'
      },
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database connection failed'
      }
    });
  }
});

//ML health endpoint
app.get('/api/health/ml', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      transformer: {
        status: 'not_connected'
      },
      ppo: {
        status: 'not_connected'
      },
      message: 'ML health integration will be enabled in the ML integration phases'
    }
  });
});

// Mount Routes matching Section 19 REST API Contract
app.use('/api/auth', authRoutes);
app.use('/api/energy-data', energyDataRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/optimization', optimizationRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/datasets', datasetRoutes);
// Error Middleware
app.use(errorMiddleware);

export default app;
