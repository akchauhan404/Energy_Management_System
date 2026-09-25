import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const AppShell = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  // Generate dynamic title & subtitle based on pathname
  const getHeaderContext = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) {
      return { title: 'Energy Overview', subtitle: 'Real-time telemetry, forecast outlook and autonomous dispatch status' };
    }
    if (path.startsWith('/energy-data')) {
      return { title: 'Energy Data', subtitle: 'Upload historical energy consumption data to generate forecasts' };
    }
    if (path.startsWith('/forecast')) {
      return { title: '24-Hour Energy Forecast', subtitle: 'Transformer-predicted future 48 steps and model attribution' };
    }
    if (path.startsWith('/optimization')) {
      return { title: 'Energy Optimization', subtitle: 'Reinforcement learning schedule for solar, battery and flexible demand' };
    }
    if (path.startsWith('/profile')) {
      return { title: 'User Profile', subtitle: 'Account credentials, role assignment and workspace details' };
    }
    if (path.startsWith('/settings')) {
      return { title: 'Workspace Settings', subtitle: 'Personalization, themes, and application preferences' };
    }
    if (path === '/admin') {
      return { title: 'Admin Overview', subtitle: 'System-wide model registries, datasets and training audits' };
    }
    if (path.startsWith('/admin/datasets')) {
      return { title: 'Dataset Versioning', subtitle: 'Aggregated training records and validation status' };
    }
    if (path.startsWith('/admin/models')) {
      return { title: 'Model Registry', subtitle: 'Production artifacts for Transformer and PPO agents' };
    }
    if (path.startsWith('/admin/training')) {
      return { title: 'Training Operations', subtitle: 'Execution log and metric audits for offline training runs' };
    }
    if (path.startsWith('/admin/forecast-performance')) {
      return { title: 'Forecast Benchmark Performance', subtitle: 'Evaluation metrics on held-out test data (Transformer vs GRU benchmark)' };
    }
    if (path.startsWith('/admin/ppo-performance')) {
      return { title: 'PPO Agent Performance', subtitle: 'Simulation evaluations: grid reduction, cost savings, and peak shaving' };
    }
    if (path.startsWith('/admin/settings')) {
      return { title: 'System Configuration', subtitle: 'Authoritative model constants, horizons and safety parameters' };
    }
    return { title: 'Energy AI Platform', subtitle: 'Prediction and Optimization Dashboard' };
  };

  const { title, subtitle } = getHeaderContext();

  return (
    <div className="flex h-screen overflow-hidden bg-theme-background">
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={title}
          subtitle={subtitle}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
