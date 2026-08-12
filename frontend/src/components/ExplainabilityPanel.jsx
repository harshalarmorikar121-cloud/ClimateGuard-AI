import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const shapData = [
  { feature: 'Cumulative Rainfall (30d)', value: 0.38, direction: 'Positive', desc: 'Heavy rainfall creates standing water — prime breeding habitat for Aedes mosquitoes.' },
  { feature: 'Mean Temperature (°C)', value: 0.29, direction: 'Positive', desc: 'Warmer temperatures accelerate mosquito reproduction and shorten dengue incubation period.' },
  { feature: 'Relative Humidity (%)', value: 0.21, direction: 'Positive', desc: 'High humidity extends mosquito survival and increases active biting periods.' },
  { feature: 'NDVI (Vegetation Index)', value: 0.14, direction: 'Positive', desc: 'Dense vegetation from satellite data correlates with mosquito resting habitats.' },
  { feature: 'Lagged Cases (2wk)', value: 0.12, direction: 'Positive', desc: 'Recent case counts are strong short-term predictors due to active vector populations.' },
  { feature: 'Urban Population Density', value: 0.10, direction: 'Positive', desc: 'Denser urban areas accelerate transmission due to host proximity.' },
  { feature: 'Distance to Water Bodies', value: -0.09, direction: 'Negative', desc: 'Proximity to large clean water bodies inversely correlated (indicates control efforts).' },
  { feature: 'Wind Speed', value: -0.06, direction: 'Negative', desc: 'Higher wind speed reduces mosquito activity and breeding.' },
];

const getBarColor = (direction) => direction === 'Positive' ? '#ff6b35' : '#00d4aa';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: 'rgba(2,13,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '0.8rem', fontFamily: 'Inter, sans-serif', maxWidth: '280px' }}>
      <div style={{ fontWeight: 700, color: '#e8f4f8', marginBottom: '6px' }}>{d.feature}</div>
      <div style={{ color: getBarColor(d.direction), fontWeight: 600, marginBottom: '6px' }}>
        {d.direction === 'Positive' ? '↑ Increases' : '↓ Decreases'} outbreak risk
      </div>
      <div style={{ color: '#8fafc4', lineHeight: 1.5 }}>{d.desc}</div>
    </div>
  );
};

export default function ExplainabilityPanel() {
  const [location, setLocation] = useState('Delhi, India');
  const [data, setData] = useState(shapData);
  const [loading, setLoading] = useState(false);

  const locations = ['Delhi, India', 'Manila, Philippines', 'São Paulo, Brazil', 'Lagos, Nigeria', 'Dhaka, Bangladesh'];

  const handleLocationChange = (loc) => {
    setLocation(loc);
    setLoading(true);
    setTimeout(() => {
      // Randomize slightly to simulate different explanations per region
      const newData = shapData.map(d => ({
        ...d,
        value: parseFloat((d.value + (Math.random() - 0.5) * 0.08).toFixed(2))
      })).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
      setData(newData);
      setLoading(false);
    }, 500);
  };

  const totalRisk = data.reduce((sum, d) => d.direction === 'Positive' ? sum + d.value : sum, 0);

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '1.2rem' }}>
        <div className="chart-title">🔍 Explainable AI — Why Is This Outbreak Predicted?</div>
        <div className="chart-subtitle">SHAP (SHapley Additive exPlanations) feature attribution — building trust with transparency</div>
      </div>

      {/* Location Selector */}
      <div style={{ marginBottom: '1.2rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.78rem', color: '#8fafc4', fontWeight: 600 }}>REGION:</span>
        {locations.map(loc => (
          <button key={loc} className={`select-btn ${location === loc ? 'active' : ''}`} style={{ fontSize: '0.73rem', padding: '5px 10px' }} onClick={() => handleLocationChange(loc)}>
            {loc.split(',')[0]}
          </button>
        ))}
      </div>

      {/* Overall Risk Score */}
      <div style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.25)', marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: '#8fafc4', fontWeight: 600, textTransform: 'uppercase' }}>Overall Risk Score</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ff6b35', fontFamily: 'Outfit, sans-serif', lineHeight: 1.1 }}>{Math.min(99, Math.round(totalRisk * 100))}%</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.72rem', color: '#8fafc4', marginBottom: '6px' }}>Risk Breakdown</div>
          <div style={{ height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
            {data.filter(d => d.direction === 'Positive').map((d, i) => (
              <div key={i} style={{ height: '100%', background: getBarColor(d.direction), width: `${(d.value / totalRisk) * 100}%`, transition: 'width 0.8s ease' }} />
            ))}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#4a6b80', marginTop: '4px' }}>Driven by: {data.filter(d => d.direction === 'Positive').slice(0, 2).map(d => d.feature.split(' (')[0]).join(', ')}</div>
        </div>
      </div>

      {/* SHAP Bar Chart */}
      {loading ? (
        <div className="shimmer" style={{ height: '260px' }} />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={[...data].sort((a,b) => b.value - a.value)} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#4a6b80', fontSize: 10 }} tickLine={false} axisLine={false} domain={[-0.5, 0.5]} tickFormatter={v => v.toFixed(1)} />
            <YAxis type="category" dataKey="feature" tick={{ fill: '#8fafc4', fontSize: 10.5 }} tickLine={false} width={175} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry, idx) => (
                <Cell key={idx} fill={getBarColor(entry.direction)} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Feature Cards */}
      <div style={{ marginTop: '1.2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.6rem' }}>
        {data.slice(0, 4).map((d, i) => (
          <div key={i} style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${getBarColor(d.direction)}30` }}>
            <div style={{ fontSize: '0.7rem', color: getBarColor(d.direction), fontWeight: 700, marginBottom: '3px' }}>{d.direction === 'Positive' ? '↑' : '↓'} SHAP: {d.value.toFixed(2)}</div>
            <div style={{ fontSize: '0.78rem', color: '#e8f4f8', fontWeight: 600, marginBottom: '3px' }}>{d.feature.split('(')[0].trim()}</div>
            <div style={{ fontSize: '0.7rem', color: '#4a6b80', lineHeight: 1.4 }}>{d.desc.slice(0, 70)}...</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1rem', padding: '10px 14px', background: 'rgba(0,136,255,0.06)', border: '1px solid rgba(0,136,255,0.2)', borderRadius: '8px', fontSize: '0.77rem', color: '#8fafc4' }}>
        💡 <strong style={{ color: '#0088ff' }}>Why SHAP?</strong> Health agencies trust forecasts more when they understand <em>why</em> a prediction was made. SHAP values decompose the model output to individual climate factors, enabling evidence-based public health decisions.
      </div>
    </div>
  );
}
