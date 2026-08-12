import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const riskZones = [
  { lat: 28.6139, lng: 77.2090, city: "Delhi, India", risk: 0.92, disease: "Dengue", cases: 1240 },
  { lat: 19.0760, lng: 72.8777, city: "Mumbai, India", risk: 0.78, disease: "Dengue", cases: 890 },
  { lat: 13.0827, lng: 80.2707, city: "Chennai, India", risk: 0.71, disease: "Dengue/Malaria", cases: 670 },
  { lat: 14.5995, lng: 120.9842, city: "Manila, Philippines", risk: 0.88, disease: "Dengue", cases: 2100 },
  { lat: -23.5505, lng: -46.6333, city: "São Paulo, Brazil", risk: 0.83, disease: "Dengue", cases: 3400 },
  { lat: 6.5244, lng: 3.3792, city: "Lagos, Nigeria", risk: 0.95, disease: "Malaria", cases: 4200 },
  { lat: 1.3521, lng: 103.8198, city: "Singapore", risk: 0.42, disease: "Dengue", cases: 180 },
  { lat: 3.1390, lng: 101.6869, city: "Kuala Lumpur", risk: 0.65, disease: "Dengue", cases: 540 },
  { lat: 23.8103, lng: 90.4125, city: "Dhaka, Bangladesh", risk: 0.87, disease: "Dengue", cases: 1780 },
  { lat: -1.2921, lng: 36.8219, city: "Nairobi, Kenya", risk: 0.74, disease: "Malaria", cases: 920 },
  { lat: 5.5502, lng: -0.2174, city: "Accra, Ghana", risk: 0.80, disease: "Malaria", cases: 1100 },
  { lat: 10.5105, lng: 7.4165, city: "Abuja, Nigeria", risk: 0.70, disease: "Malaria", cases: 760 },
];

function getRiskColor(risk) {
  if (risk >= 0.9) return '#ff3b5c';
  if (risk >= 0.75) return '#ff6b35';
  if (risk >= 0.55) return '#ffd700';
  return '#00ff88';
}

function getRiskLabel(risk) {
  if (risk >= 0.9) return 'CRITICAL';
  if (risk >= 0.75) return 'HIGH';
  if (risk >= 0.55) return 'MEDIUM';
  return 'LOW';
}

export default function RiskMap() {
  const [selectedZone, setSelectedZone] = useState(null);
  const [filter, setFilter] = useState('All');
  const diseases = ['All', 'Dengue', 'Malaria'];

  const filtered = filter === 'All' ? riskZones : riskZones.filter(z => z.disease.includes(filter));

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div className="chart-title">🌍 Global Disease Risk Heatmap</div>
          <div className="chart-subtitle">AI-predicted outbreak risk zones — 4-week forecast window</div>
        </div>
        <div className="select-group">
          {diseases.map(d => (
            <button key={d} className={`select-btn ${filter === d ? 'active' : ''}`} onClick={() => setFilter(d)}>{d}</button>
          ))}
        </div>
      </div>

      <div className="map-wrapper" style={{ height: '420px', position: 'relative' }}>
        <div className="map-overlay">
          <div className="map-legend-title">Risk Level</div>
          {[['CRITICAL', '#ff3b5c'], ['HIGH', '#ff6b35'], ['MEDIUM', '#ffd700'], ['LOW', '#00ff88']].map(([label, color]) => (
            <div className="map-legend-item" key={label}>
              <div className="legend-color" style={{ background: color }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
        <MapContainer center={[15, 20]} zoom={2} style={{ height: '100%', width: '100%', background: '#020d18' }} zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {filtered.map((zone, idx) => (
            <CircleMarker
              key={idx}
              center={[zone.lat, zone.lng]}
              radius={18 + zone.risk * 14}
              fillColor={getRiskColor(zone.risk)}
              fillOpacity={0.35}
              color={getRiskColor(zone.risk)}
              weight={2}
              opacity={0.8}
              eventHandlers={{ click: () => setSelectedZone(zone) }}
            >
              <Tooltip>
                <div style={{ background: '#020d18', color: '#e8f4f8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', fontSize: '0.8rem', fontFamily: 'Inter, sans-serif', minWidth: '160px' }}>
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>{zone.city}</div>
                  <div>Disease: {zone.disease}</div>
                  <div>Risk Score: <span style={{ color: getRiskColor(zone.risk), fontWeight: 700 }}>{(zone.risk * 100).toFixed(0)}%</span></div>
                  <div>Predicted Cases: {zone.cases.toLocaleString()}</div>
                  <div style={{ marginTop: '4px', fontSize: '0.7rem', color: '#ff6b35', fontStyle: 'italic' }}>⚠ Click for details</div>
                </div>
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {selectedZone && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', border: `1px solid ${getRiskColor(selectedZone.risk)}40`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#8fafc4' }}>SELECTED ZONE</span>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '2px' }}>{selectedZone.city}</div>
            <div style={{ fontSize: '0.82rem', color: '#8fafc4', marginTop: '2px' }}>Disease Focus: {selectedZone.disease}</div>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: getRiskColor(selectedZone.risk) }}>{(selectedZone.risk * 100).toFixed(0)}%</div>
              <div style={{ fontSize: '0.72rem', color: '#8fafc4' }}>Risk Score</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#e8f4f8' }}>{selectedZone.cases.toLocaleString()}</div>
              <div style={{ fontSize: '0.72rem', color: '#8fafc4' }}>Predicted Cases (4wk)</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span className={`risk-badge risk-${getRiskLabel(selectedZone.risk).toLowerCase()}`}>{getRiskLabel(selectedZone.risk)}</span>
            </div>
          </div>
          <button onClick={() => setSelectedZone(null)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#8fafc4', cursor: 'pointer', padding: '6px 12px', fontSize: '0.8rem' }}>✕ Close</button>
        </div>
      )}

      <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
        {filtered.slice(0, 6).map((zone, idx) => (
          <div
            key={idx}
            style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${getRiskColor(zone.risk)}30`, cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setSelectedZone(zone)}
          >
            <div style={{ fontSize: '0.7rem', color: '#8fafc4', marginBottom: '3px' }}>{zone.city.split(',')[0]}</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: getRiskColor(zone.risk) }}>{(zone.risk * 100).toFixed(0)}%</div>
            <div style={{ fontSize: '0.68rem', color: '#4a6b80' }}>{zone.disease}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
