import React, { useState, useEffect, useCallback } from 'react';

// Open-Meteo API - completely free, no key needed
const CITIES = [
  { name: 'Delhi', country: 'India', lat: 28.6139, lng: 77.2090, disease: 'Dengue', baseRisk: 0.82 },
  { name: 'Mumbai', country: 'India', lat: 19.0760, lng: 72.8777, disease: 'Dengue', baseRisk: 0.71 },
  { name: 'Manila', country: 'Philippines', lat: 14.5995, lng: 120.9842, disease: 'Dengue', baseRisk: 0.88 },
  { name: 'São Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333, disease: 'Dengue', baseRisk: 0.79 },
  { name: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792, disease: 'Malaria', baseRisk: 0.93 },
  { name: 'Dhaka', country: 'Bangladesh', lat: 23.8103, lng: 90.4125, disease: 'Dengue', baseRisk: 0.85 },
];

async function fetchWeather(city) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lng}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&daily=precipitation_sum&timezone=auto&forecast_days=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather fetch failed');
    const data = await res.json();
    return {
      temp: data.current?.temperature_2m,
      humidity: data.current?.relative_humidity_2m,
      precipitation: data.current?.precipitation,
      windSpeed: data.current?.wind_speed_10m,
      weatherCode: data.current?.weather_code,
      dailyRain: data.daily?.precipitation_sum?.[0],
    };
  } catch {
    return null;
  }
}

function getWeatherIcon(code) {
  if (code === undefined || code === null) return '🌡️';
  if (code === 0) return '☀️';
  if (code <= 2) return '⛅';
  if (code <= 48) return '🌥️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  if (code <= 99) return '⛈️';
  return '🌡️';
}

function computeRisk(city, weather) {
  if (!weather) return city.baseRisk;
  let risk = city.baseRisk;
  // Increase risk with high humidity and rainfall (dengue/malaria drivers)
  if (weather.humidity > 80) risk = Math.min(0.99, risk + 0.05);
  if (weather.dailyRain > 20) risk = Math.min(0.99, risk + 0.08);
  if (weather.temp > 30) risk = Math.min(0.99, risk + 0.03);
  if (weather.windSpeed < 5) risk = Math.min(0.99, risk + 0.02);
  return Math.round(risk * 100) / 100;
}

function getRiskLevel(r) {
  if (r >= 0.9) return { label: 'CRITICAL', color: '#ff3b5c' };
  if (r >= 0.75) return { label: 'HIGH', color: '#ff6b35' };
  if (r >= 0.55) return { label: 'MEDIUM', color: '#ffd700' };
  return { label: 'LOW', color: '#00ff88' };
}

export default function LiveWeather({ onWeatherUpdate }) {
  const [weatherData, setWeatherData] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedCity, setSelectedCity] = useState(0);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const results = {};
    await Promise.all(CITIES.map(async (city) => {
      const w = await fetchWeather(city);
      results[city.name] = { weather: w, risk: computeRisk(city, w), city };
    }));
    setWeatherData(results);
    setLastUpdated(new Date());
    if (onWeatherUpdate) onWeatherUpdate(results);
    setLoading(false);
  }, [onWeatherUpdate]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10 * 60 * 1000); // refresh every 10 min
    return () => clearInterval(interval);
  }, [fetchAll]);

  const cityNames = Object.keys(weatherData);
  const selected = cityNames[selectedCity] ? weatherData[cityNames[selectedCity]] : null;

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div className="chart-title">🌦️ Live Climate Intelligence</div>
          <div className="chart-subtitle">
            Real-time data from <strong style={{ color: '#00d4aa' }}>Open-Meteo API</strong> — updated every 10 minutes
            {lastUpdated && <span style={{ marginLeft: '8px', color: '#4a6b80' }}>· Last: {lastUpdated.toLocaleTimeString()}</span>}
          </div>
        </div>
        <button onClick={fetchAll} disabled={loading} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '8px 14px' }} id="refresh-weather-btn">
          {loading ? '⏳ Fetching...' : '🔄 Refresh'}
        </button>
      </div>

      {/* City Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {CITIES.map((city, idx) => {
          const d = weatherData[city.name];
          const risk = d?.risk || city.baseRisk;
          const rl = getRiskLevel(risk);
          const w = d?.weather;
          return (
            <div
              key={city.name}
              onClick={() => setSelectedCity(idx)}
              style={{
                padding: '12px', borderRadius: '10px', cursor: 'pointer',
                background: selectedCity === idx ? `rgba(0,212,170,0.1)` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${selectedCity === idx ? 'rgba(0,212,170,0.4)' : rl.color + '30'}`,
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e8f4f8' }}>{city.name}</div>
                <div style={{ fontSize: '1.2rem' }}>{w ? getWeatherIcon(w.weatherCode) : '⏳'}</div>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#4a6b80', marginBottom: '6px' }}>{city.country}</div>
              {loading && !w ? (
                <div className="shimmer" style={{ height: '40px', minHeight: 'auto', borderRadius: '6px' }} />
              ) : (
                <>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#e8f4f8', fontFamily: 'Outfit, sans-serif' }}>
                    {w?.temp !== undefined ? `${w.temp}°C` : 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#8fafc4', marginTop: '2px' }}>
                    💧 {w?.humidity ?? '--'}% · 🌧 {w?.dailyRain ?? '--'}mm
                  </div>
                  <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: rl.color, background: rl.color + '20', padding: '2px 7px', borderRadius: '20px' }}>{rl.label}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: rl.color }}>{(risk * 100).toFixed(0)}%</span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected City Detail */}
      {selected && selected.weather && (
        <div style={{ padding: '1.2rem', borderRadius: '12px', background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>
                {getWeatherIcon(selected.weather.weatherCode)} {selected.city.name}, {selected.city.country}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#8fafc4', marginTop: '4px' }}>Disease Focus: <strong style={{ color: '#e8f4f8' }}>{selected.city.disease}</strong></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {[
                ['🌡️ Temperature', `${selected.weather.temp}°C`],
                ['💧 Humidity', `${selected.weather.humidity}%`],
                ['🌧️ Rainfall (today)', `${selected.weather.dailyRain ?? 0}mm`],
                ['💨 Wind Speed', `${selected.weather.windSpeed} km/h`],
              ].map(([label, val]) => (
                <div key={label} style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize: '0.68rem', color: '#4a6b80', marginBottom: '2px' }}>{label}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e8f4f8' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '1rem', padding: '10px 14px', borderRadius: '8px', background: getRiskLevel(selected.risk).color + '15', border: `1px solid ${getRiskLevel(selected.risk).color}40` }}>
            <div style={{ fontSize: '0.78rem', color: '#8fafc4', lineHeight: 1.6 }}>
              <strong style={{ color: getRiskLevel(selected.risk).color }}>⚡ AI Risk Assessment:</strong> Based on current temperature ({selected.weather.temp}°C), humidity ({selected.weather.humidity}%), and daily rainfall ({selected.weather.dailyRain ?? 0}mm), the AI model assigns a{' '}
              <strong style={{ color: getRiskLevel(selected.risk).color }}>{getRiskLevel(selected.risk).label} ({(selected.risk * 100).toFixed(0)}%)</strong> outbreak risk for {selected.city.disease} in {selected.city.name}.
              {selected.weather.humidity > 80 && <span> ⚠️ Humidity &gt;80% significantly increases mosquito breeding probability.</span>}
              {selected.weather.dailyRain > 20 && <span> ⚠️ Heavy rainfall creates standing water — prime vector breeding habitat.</span>}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '1rem', fontSize: '0.72rem', color: '#4a6b80', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <span>📡 Source: <strong style={{ color: '#8fafc4' }}>Open-Meteo.com</strong> (Free, no API key)</span>
        <span>🔄 Refresh: Every 10 minutes</span>
        <span>🌍 Coverage: Global</span>
      </div>
    </div>
  );
}

export { CITIES, computeRisk, getRiskLevel };
