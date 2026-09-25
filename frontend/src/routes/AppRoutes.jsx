import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppShell } from '../components/layout/AppShell';

// Auth Pages
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';

// User Pages
import { Dashboard } from '../pages/Dashboard';
import { EnergyData } from '../pages/EnergyData';
import { Forecast } from '../pages/Forecast';
import { Optimization } from '../pages/Optimization';
import { Profile } from '../pages/Profile';
import { Settings } from '../pages/Settings';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { Datasets } from '../pages/admin/Datasets';
import { Models } from '../pages/admin/Models';
import { Training } from '../pages/admin/Training';
import { ForecastPerformance } from '../pages/admin/ForecastPerformance';
import { PPOPerformance } from '../pages/admin/PPOPerformance';
import { AdminSettings } from '../pages/admin/AdminSettings';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Admin Route Guard
const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes inside AppShell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="energy-data" element={<EnergyData />} />
        <Route path="forecast" element={<Forecast />} />
        <Route path="optimization" element={<Optimization />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />

        {/* Admin Protected Routes */}
        <Route
          path="admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="admin/datasets"
          element={
            <AdminRoute>
              <Datasets />
            </AdminRoute>
          }
        />
        <Route
          path="admin/models"
          element={
            <AdminRoute>
              <Models />
            </AdminRoute>
          }
        />
        <Route
          path="admin/training"
          element={
            <AdminRoute>
              <Training />
            </AdminRoute>
          }
        />
        <Route
          path="admin/forecast-performance"
          element={
            <AdminRoute>
              <ForecastPerformance />
            </AdminRoute>
          }
        />
        <Route
          path="admin/ppo-performance"
          element={
            <AdminRoute>
              <PPOPerformance />
            </AdminRoute>
          }
        />
        <Route
          path="admin/settings"
          element={
            <AdminRoute>
              <AdminSettings />
            </AdminRoute>
          }
        />
      </Route>

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
