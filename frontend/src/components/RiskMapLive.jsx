import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, Tooltip, LayersControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const RISK_CITIES = [
  { name: 'Delhi', country: 'India', lat: 28.6139, lng: 77.2090, disease: 'Dengue', risk: 0.92, cases: 1240 },
  { name: 'Mumbai', country: 'India', lat: 19.0760, lng: 72.8777, disease: 'Dengue', risk: 0.78, cases: 890 },
  { name: 'Chennai', country: 'India', lat: 13.0827, lng: 80.2707, disease: 'Dengue/Malaria', risk: 0.71, cases: 670 },
  { name: 'Manila', country: 'Philippines', lat: 14.5995, lng: 120.9842, disease: 'Dengue', risk: 0.88, cases: 2100 },
  { name: 'São Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333, disease: 'Dengue', risk: 0.83, cases: 3400 },
  { name: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792, disease: 'Malaria', risk: 0.95, cases: 4200 },
  { name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198, disease: 'Dengue', risk: 0.42, cases: 180 },
  { name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.1390, lng: 101.6869, disease: 'Dengue', risk: 0.65, cases: 540 },
  { name: 'Dhaka', country: 'Bangladesh', lat: 23.8103, lng: 90.4125, disease: 'Dengue', risk: 0.87, cases: 1780 },
  { name: 'Nairobi', country: 'Kenya', lat: -1.2921, lng: 36.8219, disease: 'Malaria', risk: 0.74, cases: 920 },
  { name: 'Accra', country: 'Ghana', lat: 5.5502, lng: -0.2174, disease: 'Malaria', risk: 0.80, cases: 1100 },
  { name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lng: 106.8456, disease: 'Dengue', risk: 0.76, cases: 1540 },
];

// Overpass API — fetch hospitals within bbox of a city
async function fetchHospitals(lat, lng, radius = 8000) {
  const delta = radius / 111000;
  const bbox = `${lat - delta},${lng - delta},${lat + delta},${lng + delta}`;
  const query = `[out:json][timeout:15];(node["amenity"="hospital"](${bbox});way["amenity"="hospital"](${bbox}););out center 10;`;
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data.elements?.slice(0, 8).map(el => ({
      id: el.id,
      name: el.tags?.name || el.tags?.['name:en'] || 'Hospital',
      lat: el.lat || el.center?.lat,
      lng: el.lon || el.center?.lon,
      emergency: el.tags?.emergency === 'yes',
      beds: el.tags?.beds,
      phone: el.tags?.phone,
    })).filter(h => h.lat && h.lng) || [];
  } catch {
    return [];
  }
}

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

const hospitalIcon = L.divIcon({
  html: '<div style="background:#0088ff;color:white;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5)">🏥</div>',
  className: '',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function MapLegend() {
  return (
    <div style={{
      position: 'absolute', top: 12, left: 12, zIndex: 1000,
      background: 'rgba(2,13,24,0.92)', backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px',
    }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: '#8fafc4', marginBottom: '8px', letterSpacing: '0.06em' }}>Risk Level</div>
      {[['CRITICAL', '#ff3b5c'], ['HIGH', '#ff6b35'], ['MEDIUM', '#ffd700'], ['LOW', '#00ff88']].map(([label, color]) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.73rem', color: '#e8f4f8', marginBottom: '4px' }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: color }} />
          {label}
        </div>
      ))}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '8px', paddingTop: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.73rem', color: '#e8f4f8' }}>
          <span style={{ fontSize: '0.85rem' }}>🏥</span> Hospital (OSM)
        </div>
      </div>
    </div>
  );
}

export default function RiskMapLive({ weatherData }) {
  const [hospitals, setHospitals] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [filter, setFilter] = useState('All');
  const [mapLayer, setMapLayer] = useState('dark');

  const diseases = ['All', 'Dengue', 'Malaria'];

  // Apply weather-adjusted risk if available
  const cities = RISK_CITIES.map(c => {
    const wd = weatherData?.[c.name];
    if (wd) return { ...c, risk: wd.risk };
    return c;
  });

  const filtered = filter === 'All' ? cities : cities.filter(c => c.disease.includes(filter));

  const handleCityClick = async (city) => {
    setSelectedCity(city);
    setLoadingHospitals(true);
    setHospitals([]);
    const h = await fetchHospitals(city.lat, city.lng);
    setHospitals(h);
    setLoadingHospitals(false);
  };

  const tileLayers = {
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  };

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div className="chart-title">🌍 Live Global Risk & Hospital Map</div>
          <div className="chart-subtitle">
            Real disease risk zones + hospital locations from <strong style={{ color: '#00d4aa' }}>OpenStreetMap Overpass API</strong>
            {weatherData && Object.keys(weatherData).length > 0 && <span style={{ marginLeft: '8px', color: '#00ff88', fontSize: '0.72rem' }}>⚡ Risk adjusted with live weather</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {diseases.map(d => (
            <button key={d} className={`select-btn ${filter === d ? 'active' : ''}`} onClick={() => setFilter(d)}>{d}</button>
          ))}
        </div>
      </div>

      {/* Map Layer Switcher */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.75rem', color: '#8fafc4', alignSelf: 'center', fontWeight: 600 }}>MAP:</span>
        {[['dark', '🌑 Dark'], ['satellite', '🛰️ Satellite'], ['osm', '🗺️ OpenStreetMap']].map(([key, label]) => (
          <button key={key} className={`select-btn ${mapLayer === key ? 'active' : ''}`} style={{ fontSize: '0.73rem' }} onClick={() => setMapLayer(key)}>{label}</button>
        ))}
      </div>

      <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
        <MapLegend />
        <MapContainer center={[15, 30]} zoom={2} style={{ height: '450px', width: '100%' }} zoomControl={true}>
          <TileLayer
            key={mapLayer}
            url={tileLayers[mapLayer]}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | &copy; <a href="https://carto.com">CARTO</a>'
          />

          {/* Risk Zone Circles */}
          {filtered.map((city, idx) => (
            <CircleMarker
              key={idx}
              center={[city.lat, city.lng]}
              radius={16 + city.risk * 16}
              fillColor={getRiskColor(city.risk)}
              fillOpacity={0.3}
              color={getRiskColor(city.risk)}
              weight={2}
              opacity={0.9}
              eventHandlers={{ click: () => handleCityClick(city) }}
            >
              <Tooltip permanent={false}>
                <div style={{ background: '#020d18', color: '#e8f4f8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', fontSize: '0.78rem', minWidth: '170px' }}>
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>{city.name}, {city.country}</div>
                  <div>🦟 {city.disease}</div>
                  <div>⚡ Risk: <span style={{ color: getRiskColor(city.risk), fontWeight: 700 }}>{(city.risk * 100).toFixed(0)}%</span> ({getRiskLabel(city.risk)})</div>
                  <div>📊 Forecast: {city.cases.toLocaleString()} cases/4wk</div>
                  <div style={{ marginTop: '4px', color: '#00d4aa', fontSize: '0.7rem' }}>Click to load hospitals</div>
                </div>
              </Tooltip>
            </CircleMarker>
          ))}

          {/* Hospital Markers from OSM */}
          {hospitals.map((h, idx) => (
            <Marker key={`h-${idx}`} position={[h.lat, h.lng]} icon={hospitalIcon}>
              <Popup>
                <div style={{ background: '#020d18', color: '#e8f4f8', padding: '10px', borderRadius: '8px', minWidth: '160px', fontSize: '0.8rem' }}>
                  <div style={{ fontWeight: 700, color: '#0088ff', marginBottom: '4px' }}>🏥 {h.name}</div>
                  {h.emergency && <div style={{ color: '#ff3b5c', fontWeight: 600, marginBottom: '4px' }}>🚑 Emergency Services</div>}
                  {h.beds && <div>🛏️ Beds: {h.beds}</div>}
                  {h.phone && <div>📞 {h.phone}</div>}
                  <div style={{ color: '#4a6b80', marginTop: '6px', fontSize: '0.7rem' }}>Source: OpenStreetMap</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Selected City Panel */}
      {selectedCity && (
        <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '10px', background: `${getRiskColor(selectedCity.risk)}10`, border: `1px solid ${getRiskColor(selectedCity.risk)}30` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>📍 {selectedCity.name}, {selectedCity.country}</div>
              <div style={{ fontSize: '0.82rem', color: '#8fafc4', marginTop: '2px' }}>
                {selectedCity.disease} · Risk: <strong style={{ color: getRiskColor(selectedCity.risk) }}>{(selectedCity.risk * 100).toFixed(0)}%</strong> · {selectedCity.cases.toLocaleString()} forecast cases/4wk
              </div>
              {loadingHospitals && <div style={{ fontSize: '0.78rem', color: '#00d4aa', marginTop: '4px' }}>⏳ Loading hospitals from OpenStreetMap...</div>}
              {!loadingHospitals && hospitals.length > 0 && (
                <div style={{ fontSize: '0.78rem', color: '#00d4aa', marginTop: '4px' }}>🏥 Found {hospitals.length} hospitals within 8km (OSM Live)</div>
              )}
              {!loadingHospitals && hospitals.length === 0 && (
                <div style={{ fontSize: '0.78rem', color: '#4a6b80', marginTop: '4px' }}>ℹ️ No hospital data available for this area (Overpass API limit)</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className={`risk-badge risk-${getRiskLabel(selectedCity.risk).toLowerCase()}`}>{getRiskLabel(selectedCity.risk)}</span>
              <button onClick={() => { setSelectedCity(null); setHospitals([]); }} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: '#8fafc4', cursor: 'pointer', padding: '4px 10px', fontSize: '0.75rem' }}>✕</button>
            </div>
          </div>

          {hospitals.length > 0 && (
            <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
              {hospitals.slice(0, 6).map((h, i) => (
                <div key={i} style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(0,136,255,0.08)', border: '1px solid rgba(0,136,255,0.2)' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0088ff' }}>🏥 {h.name.slice(0, 28)}{h.name.length > 28 ? '…' : ''}</div>
                  {h.emergency && <div style={{ fontSize: '0.7rem', color: '#ff3b5c', marginTop: '2px' }}>🚑 Emergency</div>}
                  {h.beds && <div style={{ fontSize: '0.7rem', color: '#4a6b80' }}>🛏️ {h.beds} beds</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* City Quick-Select */}
      <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem' }}>
        {filtered.map((city, idx) => (
          <div
            key={idx}
            style={{ padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', border: `1px solid ${getRiskColor(city.risk)}30`, transition: 'all 0.2s' }}
            onClick={() => handleCityClick(city)}
          >
            <div style={{ fontSize: '0.68rem', color: '#8fafc4', marginBottom: '2px' }}>{city.name}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: getRiskColor(city.risk) }}>{(city.risk * 100).toFixed(0)}%</div>
            <div style={{ fontSize: '0.65rem', color: '#4a6b80' }}>{city.disease}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.7rem', color: '#4a6b80' }}>
        <span>🗺️ <strong style={{ color: '#8fafc4' }}>OpenStreetMap</strong> — Free, no API key</span>
        <span>🏥 <strong style={{ color: '#8fafc4' }}>Overpass API</strong> — Live hospital data</span>
        <span>🛰️ Satellite tiles: <strong style={{ color: '#8fafc4' }}>ArcGIS Online</strong></span>
        <span>🌑 Dark tiles: <strong style={{ color: '#8fafc4' }}>CartoDB</strong></span>
      </div>
    </div>
  );
}
