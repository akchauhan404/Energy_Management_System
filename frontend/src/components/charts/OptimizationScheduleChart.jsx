import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export const OptimizationScheduleChart = ({ schedule = [], height = 320 }) => {
  if (!schedule || schedule.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-theme-muted">
        No optimization schedule available.
      </div>
    );
  }

  const chartData = schedule.map((s) => ({
    time: s.timeFormatted,
    forecastDemand: s.forecastDemand,
    gridEnergy: s.gridEnergy,
    solarGen: s.solarGeneration,
    batterySoc: s.batterySoc
  }));

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 15, right: 20, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke="var(--color-muted)" 
            tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
            interval={3}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-border-subtle)' }}
          />
          <YAxis 
            yAxisId="power"
            stroke="var(--color-muted)" 
            tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-border-subtle)' }}
            unit=" kWh"
          />
          <YAxis 
            yAxisId="soc"
            orientation="right"
            stroke="var(--color-muted)" 
            tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-border-subtle)' }}
            unit="%"
            domain={[0, 100]}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'var(--color-surface-strong)',
              borderColor: 'var(--color-border)',
              borderRadius: '0.5rem',
              color: 'var(--color-text)',
              fontSize: '12px',
              boxShadow: '0 4px 20px -2px var(--color-glow)'
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
          />
          <Area 
            yAxisId="power"
            type="monotone" 
            dataKey="solarGen" 
            name="Solar PV (kWh)" 
            fill="var(--color-accent)" 
            stroke="var(--color-accent)" 
            fillOpacity={0.15} 
          />
          <Line 
            yAxisId="power"
            type="monotone" 
            dataKey="forecastDemand" 
            name="Baseline Demand (kWh)" 
            stroke="var(--color-muted)" 
            strokeDasharray="4 4"
            strokeWidth={1.8}
            dot={false}
          />
          <Line 
            yAxisId="power"
            type="monotone" 
            dataKey="gridEnergy" 
            name="PPO Grid Energy (kWh)" 
            stroke="var(--color-primary)" 
            strokeWidth={2.2}
            dot={false}
          />
          <Line 
            yAxisId="soc"
            type="monotone" 
            dataKey="batterySoc" 
            name="Battery SOC (%)" 
            stroke="var(--color-secondary)" 
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
