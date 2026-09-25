import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

export const ForecastChart = ({ points = [], height = 320 }) => {
  if (!points || points.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-theme-muted">
        No forecast prediction data available.
      </div>
    );
  }

  const chartData = points.map((p) => ({
    time: p.timeFormatted,
    kwh: p.predicted_energy_kwh,
    step: p.step_index + 1
  }));

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke="var(--color-muted)" 
            tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
            tickLine={false}
            interval={3}
            axisLine={{ stroke: 'var(--color-border-subtle)' }}
          />
          <YAxis 
            stroke="var(--color-muted)" 
            tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-border-subtle)' }}
            unit=" kWh"
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
            formatter={(value) => [`${value} kWh`, 'Forecast Demand']}
            labelFormatter={(label, item) => {
              const step = item?.[0]?.payload?.step;
              return `Step ${step}/48 • ${label}`;
            }}
          />
          <Line 
            type="monotone" 
            dataKey="kwh" 
            stroke="var(--color-secondary)" 
            strokeWidth={2.5}
            dot={{ r: 2, fill: 'var(--color-secondary)' }}
            activeDot={{ r: 5, fill: 'var(--color-primary)', stroke: 'var(--color-background)', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
