import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export const ActualVsForecastChart = ({ height = 360 }) => {
  // Generate 48 benchmark comparison steps
  const testData = [];
  const baseProfile = [
    1.15, 1.08, 1.02, 0.98, 0.95, 0.92, 0.96, 1.10,
    1.35, 1.85, 2.40, 2.75, 2.50, 2.20, 1.95, 1.80,
    1.75, 1.82, 1.90, 1.88, 1.85, 1.78, 1.72, 1.68,
    1.65, 1.62, 1.70, 1.85, 2.10, 2.45, 2.90, 3.25,
    3.40, 3.35, 3.15, 2.90, 2.70, 2.45, 2.15, 1.85,
    1.65, 1.50, 1.40, 1.32, 1.25, 1.20, 1.18, 1.14
  ];

  for (let i = 0; i < 48; i++) {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const actual = baseProfile[i];
    const transformer = parseFloat((actual * 0.98 + (Math.sin(i / 2) * 0.08)).toFixed(3));
    const gru = parseFloat((actual * 0.99 + (Math.sin(i / 2) * 0.05)).toFixed(3));
    const seasonalNaive = parseFloat((actual * (0.95 + (i % 3) * 0.03)).toFixed(3));

    testData.push({
      time,
      step: i + 1,
      actual,
      transformer,
      gru,
      seasonalNaive
    });
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={testData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
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
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          <Line 
            type="monotone" 
            dataKey="actual" 
            name="Ground Truth Actual" 
            stroke="var(--color-text)" 
            strokeWidth={2.5}
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="transformer" 
            name="Horizon Transformer (Ours)" 
            stroke="var(--color-primary)" 
            strokeWidth={2}
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="gru" 
            name="GRU Benchmark" 
            stroke="var(--color-secondary)" 
            strokeWidth={1.8}
            strokeDasharray="4 2"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="seasonalNaive" 
            name="Seasonal Naive (48-step)" 
            stroke="var(--color-muted)" 
            strokeWidth={1.2}
            strokeDasharray="2 2"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
