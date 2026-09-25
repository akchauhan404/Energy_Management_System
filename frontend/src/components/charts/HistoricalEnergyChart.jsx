import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

export const HistoricalEnergyChart = ({ records = [], height = 280 }) => {
  if (!records || records.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-theme-muted">
        No historical consumption records available.
      </div>
    );
  }

  // Format data for chart display (take last 48 points if too many to keep visual clarity)
  const displayData = records.slice(-48).map((r) => {
    const d = new Date(r.timestamp);
    return {
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      kwh: parseFloat(r.energy_kwh.toFixed(3))
    };
  });

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="historicalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke="var(--color-muted)" 
            tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
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
            formatter={(value) => [`${value} kWh`, 'Energy Usage']}
            labelFormatter={(label, item) => {
              const obj = item?.[0]?.payload;
              return `${obj?.date || ''} ${label}`;
            }}
          />
          <Area 
            type="monotone" 
            dataKey="kwh" 
            stroke="var(--color-primary)" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#historicalGradient)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
