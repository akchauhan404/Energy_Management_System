import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import energyDataRoutes from './routes/energyData.js';
import forecastRoutes from './routes/forecast.js';
import optimizationRoutes from './routes/optimization.js';
import profileRoutes from './routes/profile.js';
import adminRoutes from './routes/admin.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';

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
app.get('/api/health/database', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'not_connected',
      message: 'Database health integration will be enabled in Phase 2'
    }
  });
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

// Error Middleware
app.use(errorMiddleware);

export default app;
