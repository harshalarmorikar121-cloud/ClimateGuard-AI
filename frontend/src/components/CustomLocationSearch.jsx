import React, { useState } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function CustomLocationSearch({ onCustomEvaluation }) {
  const { addToast } = useToast();
  const [cityName, setCityName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [disease, setDisease] = useState('Dengue');
  const [loading, setLoading] = useState(false);

  const handleEvaluate = async (e) => {
    e.preventDefault();
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      addToast('Please enter valid latitude (-90 to 90) and longitude (-180 to 180).', 'warning');
      return;
    }

    setLoading(true);
    try {
      const result = await api.evaluateCustomLocation(cityName || `Custom Location (${lat}, ${lng})`, lat, lng, disease);
      addToast(`Live risk evaluated for ${result.city}: ${(result.risk_score * 100).toFixed(0)}% (${result.risk_level})`, 'success');
      if (onCustomEvaluation) {
        onCustomEvaluation(result);
      }
    } catch (err) {
      addToast(err.message || 'Failed to evaluate climate telemetry for this location.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (preset) => {
    setCityName(preset.name);
    setLatitude(preset.lat);
    setLongitude(preset.lng);
    setDisease(preset.disease);
  };

  const PRESETS = [
    { name: 'Bangkok, Thailand', lat: 13.7563, lng: 100.5018, disease: 'Dengue' },
    { name: 'Kinshasa, DR Congo', lat: -4.4419, lng: 15.2663, disease: 'Malaria' },
    { name: 'Pune, India', lat: 18.5204, lng: 73.8567, disease: 'Dengue' },
    { name: 'Rio de Janeiro, Brazil', lat: -22.9068, lng: -43.1729, disease: 'Dengue' },
  ];

  return (
    <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      <div className="section-header" style={{ marginBottom: '1rem', textAlign: 'left' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          🔍 Custom Global Risk Evaluator
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
          Enter any global coordinates to fetch live Open-Meteo climate telemetry and compute real-time vector outbreak risk.
        </p>
      </div>

      <form onSubmit={handleEvaluate} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          <input
            type="text"
            placeholder="Location / City Name (Optional)"
            value={cityName}
            onChange={(e) => setCityName(e.target.value)}
          />
          <input
            type="number"
            step="any"
            required
            placeholder="Latitude (e.g. 18.52)"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
          />
          <input
            type="number"
            step="any"
            required
            placeholder="Longitude (e.g. 73.85)"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
          />
          <select value={disease} onChange={(e) => setDisease(e.target.value)}>
            <option value="Dengue">🦟 Dengue (Aedes Vector)</option>
            <option value="Malaria">🦠 Malaria (Anopheles Vector)</option>
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Quick Presets:</span>
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                className="btn-preset"
                onClick={() => handlePresetSelect(p)}
              >
                {p.name.split(',')[0]}
              </button>
            ))}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Fetching Live Climate...' : '⚡ Evaluate Live Risk'}
          </button>
        </div>
      </form>
    </div>
  );
}
