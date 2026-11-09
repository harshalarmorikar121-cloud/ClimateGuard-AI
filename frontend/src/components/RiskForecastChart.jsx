import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export default function RiskForecastChart({ trajectory = [], cityName = 'City' }) {
  if (!trajectory || trajectory.length === 0) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
        Loading 30-day forecast trajectory...
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', color: '#fff' }}>
          <div style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--accent)' }}>{label}</div>
          <div>Predicted Cases: <strong>{data.predicted_cases}</strong></div>
          <div style={{ color: 'var(--muted)' }}>95% Confidence: [{data.lower_bound} – {data.upper_bound}]</div>
          <div style={{ color: 'var(--orange)' }}>Risk Index: {(data.risk_score * 100).toFixed(0)}%</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            📈 30-Day Outbreak Case Forecast — {cityName}
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
            Multi-model ensemble projection (LSTM + XGBoost + Prophet) with 95% confidence intervals.
          </p>
        </div>
        <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '20px', background: 'rgba(16,185,129,0.1)', color: 'var(--accent)', border: '1px solid rgba(16,185,129,0.25)', fontWeight: 600 }}>
          Ensemble Accuracy: 93.1%
        </span>
      </div>

      <div style={{ height: '320px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trajectory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="caseCurve" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
            
            {/* Confidence Band */}
            <Area
              type="monotone"
              dataKey="upper_bound"
              stroke="transparent"
              fill="url(#confidenceBand)"
              name="95% Upper Bound"
            />
            <Area
              type="monotone"
              dataKey="lower_bound"
              stroke="transparent"
              fill="transparent"
              name="95% Lower Bound"
            />

            {/* Predicted Trajectory */}
            <Area
              type="monotone"
              dataKey="predicted_cases"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#caseCurve)"
              name="Ensemble Case Prediction"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.75rem' }}>
        <span>🤖 LSTM: Sequential Memory</span>
        <span>🌲 XGBoost: Climate Thresholds</span>
        <span>📅 Prophet: Monsoon Seasonality</span>
      </div>
    </div>
  );
}
