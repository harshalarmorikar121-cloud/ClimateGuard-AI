import React from 'react';

export default function ShapWaterfall({ attributions = [], cityName = 'Selected City' }) {
  if (!attributions || attributions.length === 0) {
    return (
      <div className="card" style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--muted)' }}>
        No SHAP feature attribution data available for this location.
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          🔍 SHAP Feature Attribution — {cityName}
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
          Explains <strong>why</strong> the AI model predicted this risk score by quantifying individual climate feature contributions (ΔRisk).
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {attributions.map((item, idx) => {
          const isPositive = item.shap_value >= 0;
          const barWidth = Math.min(100, Math.abs(item.shap_value) * 200);

          return (
            <div key={idx} className="shap-row">
              <div className="shap-header">
                <div>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{item.feature}</strong>
                  {item.value_observed && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)', marginLeft: '8px' }}>
                      (Observed: {item.value_observed})
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: isPositive ? 'var(--red)' : 'var(--accent)',
                  }}
                >
                  {isPositive ? `+${item.shap_value}` : item.shap_value}
                </span>
              </div>

              <div className="shap-bar-bg">
                <div
                  className="shap-bar-fill"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: isPositive ? 'var(--red)' : 'var(--accent)',
                  }}
                />
              </div>

              <div className="shap-desc">{item.interpretation}</div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '1rem', padding: '8px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--muted)' }}>
        💡 <strong>XAI Transparency:</strong> Red bars indicate factors increasing mosquito reproduction and viral incubation. Green bars indicate inhibiting climate factors.
      </div>
    </div>
  );
}
