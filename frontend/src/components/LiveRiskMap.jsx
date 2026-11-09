import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

// Fix default leaflet marker asset urls
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const hospitalIcon = L.divIcon({
  html: '<div style="background:#3b82f6;color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.6)">🏥</div>',
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const pediatricIcon = L.divIcon({
  html: '<div style="background:#ec4899;color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.6)">👶</div>',
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function getRiskColor(risk) {
  if (risk >= 0.9) return '#ef4444';
  if (risk >= 0.75) return '#f97316';
  if (risk >= 0.55) return '#eab308';
  return '#10b981';
}

export default function LiveRiskMap({ cities = [], onSelectCity, selectedCity }) {
  const { addToast } = useToast();
  const [mapLayer, setMapLayer] = useState('dark');
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);

  const tileLayers = {
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  };

  const handleCityClick = async (city) => {
    if (onSelectCity) onSelectCity(city);
    setLoadingHospitals(true);
    setHospitals([]);

    try {
      const res = await api.getNearbyHospitals(city.latitude, city.longitude, 10000);
      setHospitals(res.hospitals || []);
      if (res.hospitals && res.hospitals.length > 0) {
        addToast(`Loaded ${res.hospitals.length} nearby healthcare facilities for ${city.city} (OSM Overpass).`, 'info');
      } else {
        addToast(`No immediate hospitals returned within 10km for ${city.city}.`, 'info');
      }
    } catch {
      addToast('Failed to fetch hospital geolocation from OpenStreetMap.', 'warning');
    } finally {
      setLoadingHospitals(false);
    }
  };

  return (
    <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
            🌍 Live Outbreak Heatmap & Healthcare Network
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            Click any city marker to dynamically query <strong>OpenStreetMap Overpass API</strong> for nearby hospitals and pediatric wards.
          </p>
        </div>

        {/* Layer Switcher */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            ['dark', '🌑 Dark'],
            ['satellite', '🛰️ Satellite'],
            ['osm', '🗺️ Standard'],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`btn-preset ${mapLayer === key ? 'active' : ''}`}
              onClick={() => setMapLayer(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', position: 'relative' }}>
        <MapContainer center={[15, 45]} zoom={2} style={{ height: '420px', width: '100%' }} zoomControl>
          <TileLayer
            key={mapLayer}
            url={tileLayers[mapLayer]}
            attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          />

          {/* City Risk Markers */}
          {cities.map((city, idx) => {
            const risk = city.risk_score;
            const color = getRiskColor(risk);
            return (
              <CircleMarker
                key={`city-${idx}`}
                center={[city.latitude, city.longitude]}
                radius={14 + risk * 16}
                fillColor={color}
                fillOpacity={0.35}
                color={color}
                weight={2}
                eventHandlers={{
                  click: () => handleCityClick(city),
                }}
              >
                <Tooltip>
                  <div style={{ fontSize: '0.82rem' }}>
                    <strong>{city.city}, {city.country}</strong><br />
                    🦟 {city.disease} Outbreak Risk: <strong>{(risk * 100).toFixed(0)}%</strong> ({city.risk_level})<br />
                    <span style={{ color: 'var(--accent)', fontSize: '0.75rem' }}>Click to load hospitals</span>
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}

          {/* OSM Hospital Pins */}
          {hospitals.map((h, idx) => (
            <Marker
              key={`hosp-${idx}`}
              position={[h.lat, h.lng]}
              icon={h.pediatric ? pediatricIcon : hospitalIcon}
            >
              <Popup>
                <div style={{ padding: '4px', fontSize: '0.82rem', color: '#111827' }}>
                  <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: '2px' }}>
                    {h.pediatric ? '👶' : '🏥'} {h.name}
                  </div>
                  {h.emergency && <div style={{ color: '#dc2626', fontWeight: 600 }}>🚑 24/7 Emergency Care</div>}
                  {h.pediatric && <div style={{ color: '#db2777', fontWeight: 600 }}>🍼 Pediatric Care Unit</div>}
                  {h.phone && <div>📞 {h.phone}</div>}
                  <div style={{ color: '#6b7280', fontSize: '0.7rem', marginTop: '4px' }}>Source: OpenStreetMap</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {loadingHospitals && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--accent)' }}>
          ⏳ Loading nearby medical facilities from OpenStreetMap Overpass API...
        </div>
      )}

      {hospitals.length > 0 && (
        <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '8px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--blue)', marginBottom: '6px' }}>
            🏥 Nearby Hospitals & Clinics Found ({hospitals.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem' }}>
            {hospitals.slice(0, 6).map((h, i) => (
              <div key={i} style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', fontSize: '0.78rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--text)' }}>{h.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                  {h.emergency ? '🚨 Emergency Ward' : 'Clinic'} {h.phone ? `· ${h.phone}` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
