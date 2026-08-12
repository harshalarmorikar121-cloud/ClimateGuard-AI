import React, { useState, useEffect } from 'react';

const NEWS_TICKER = [
  '🚨 CRITICAL: Lagos dengue risk at 95% — AI model predicts 4,200 cases over next 4 weeks',
  '⚠️ WHO: Southeast Asia dengue cases up 340% vs 5-year average — monsoon season alert',
  '📡 LIVE: Open-Meteo reports record rainfall in Manila (78mm/day) — outbreak risk elevated',
  '🏥 Delhi AIIMS: Dengue ward capacity increased by 200% in anticipation of seasonal surge',
  '🌍 CDC Travel Advisory: 14 countries with active dengue transmission updated',
  '📊 AI Forecast: LSTM model predicts dengue peak in Dhaka in 18 days (±3 days)',
  '🛰️ Sentinel-2: Satellite data shows expanding stagnant water bodies in São Paulo',
  '🔬 New Research: SHAP analysis confirms humidity &gt;80% doubles vector breeding probability',
  '💊 WHO: Recommends stockpiling dengue test kits for high-risk zones',
  '🌡️ NASA POWER: South Asia temperature anomaly +2.3°C above 30-year normal',
];

export default function NewsTicker() {
  const [position, setPosition] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIdx(i => (i + 1) % NEWS_TICKER.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div
      style={{
        background: 'rgba(255,59,92,0.08)',
        border: '1px solid rgba(255,59,92,0.2)',
        borderRadius: '10px',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <span style={{
        flexShrink: 0,
        background: '#ff3b5c',
        color: 'white',
        fontSize: '0.65rem',
        fontWeight: 800,
        padding: '3px 8px',
        borderRadius: '4px',
        letterSpacing: '0.08em',
        animation: 'pulse-anim 1.5s ease-in-out infinite',
      }}>LIVE</span>

      <div style={{
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
        height: '20px',
      }}>
        <div
          key={currentIdx}
          style={{
            position: 'absolute',
            whiteSpace: 'nowrap',
            fontSize: '0.82rem',
            color: '#e8f4f8',
            fontWeight: 500,
            animation: 'tickerSlide 0.5s ease-out',
          }}
        >
          {NEWS_TICKER[currentIdx]}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
        {NEWS_TICKER.map((_, i) => (
          <div
            key={i}
            onClick={() => setCurrentIdx(i)}
            style={{
              width: '5px', height: '5px', borderRadius: '50%',
              background: i === currentIdx ? '#00d4aa' : 'rgba(255,255,255,0.2)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes tickerSlide {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
