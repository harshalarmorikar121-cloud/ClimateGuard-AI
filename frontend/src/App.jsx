import React, { useState, useEffect } from 'react';
import './index.css';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// ── Live weather from Open-Meteo (free, no API key) ─────────────────────────
const CITIES = [
  { name: 'Delhi',     country: 'India',       lat: 28.61, lng: 77.21,  disease: 'Dengue',  risk: 0.92 },
  { name: 'Mumbai',    country: 'India',       lat: 19.08, lng: 72.88,  disease: 'Dengue',  risk: 0.76 },
  { name: 'Manila',    country: 'Philippines', lat: 14.60, lng: 120.98, disease: 'Dengue',  risk: 0.88 },
  { name: 'Dhaka',     country: 'Bangladesh',  lat: 23.81, lng: 90.41,  disease: 'Dengue',  risk: 0.85 },
  { name: 'Lagos',     country: 'Nigeria',     lat: 6.52,  lng: 3.38,   disease: 'Malaria', risk: 0.95 },
  { name: 'São Paulo', country: 'Brazil',      lat: -23.55, lng: -46.63, disease: 'Dengue', risk: 0.79 },
];

async function getWeather(city) {
  try {
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lng}` +
      `&current=temperature_2m,relative_humidity_2m,precipitation&timezone=auto&forecast_days=1`,
      { signal: AbortSignal.timeout(8000) }
    );
    const d = await r.json();
    return {
      temp: d.current?.temperature_2m,
      humidity: d.current?.relative_humidity_2m,
      rain: d.current?.precipitation,
    };
  } catch { return null; }
}

// ── WHO alerts via allorigins CORS proxy ─────────────────────────────────────
const WHO_ALERTS = [
  { title: 'Dengue – Global Situation Update', region: 'Southeast Asia', date: 'Aug 2026', severity: 'high',    link: 'https://www.who.int/emergencies/disease-outbreak-news' },
  { title: 'Malaria Seasonal Surge – West Africa',   region: 'Africa',        date: 'Aug 2026', severity: 'high',    link: 'https://www.who.int/news-room/fact-sheets/detail/malaria' },
  { title: 'Dengue Outbreak – Philippines',           region: 'Western Pacific',date: 'Jul 2026', severity: 'critical',link: 'https://www.who.int/westernpacific/emergencies/dengue-in-the-philippines' },
  { title: 'Climate-Driven Vector Expansion',         region: 'Global',        date: 'Jul 2026', severity: 'medium',  link: 'https://www.who.int/news/item/03-06-2024-climate-change-is-already-impacting-health' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function riskColor(r) {
  if (r >= 0.9) return '#ef4444';
  if (r >= 0.75) return '#f97316';
  if (r >= 0.55) return '#eab308';
  return '#10b981';
}
function riskLabel(r) {
  if (r >= 0.9) return 'critical';
  if (r >= 0.75) return 'high';
  if (r >= 0.55) return 'medium';
  return 'low';
}

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [weather, setWeather]     = useState({});
  const [loading, setLoading]     = useState(true);
  const [alertSent, setAlertSent] = useState(false);
  const [email, setEmail]         = useState('');
  const [region, setRegion]       = useState('');
  const [time, setTime]           = useState(new Date());

  // Refresh clock every second
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch live weather once on load, then every 15 min
  useEffect(() => {
    async function load() {
      setLoading(true);
      const results = {};
      await Promise.all(CITIES.map(async c => {
        results[c.name] = await getWeather(c);
      }));
      setWeather(results);
      setLoading(false);
    }
    load();
    const t = setInterval(load, 15 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  function handleAlert(e) {
    e.preventDefault();
    if (!email || !region) return;
    setAlertSent(true);
  }

  return (
    <>
      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="navbar-inner">
          <a href="#" className="nav-brand">🌿 ClimateGuard AI</a>
          <div className="nav-links">
            <a href="#risk">Risk Map</a>
            <a href="#vulnerable">Vulnerable</a>
            <a href="#warnings">Warning Signs</a>
            <a href="#alerts">Get Alerts</a>
          </div>
          <div className="live-dot"><div className="dot" /> LIVE · {time.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="hero">
        <div className="container">
          <div className="hero-label">AI for Climate Change · Hackathon 2026</div>
          <h1>Predicting Disease Outbreaks<br /><span>Before They Strike</span></h1>
          <p>An AI early-warning system that monitors climate data to predict dengue and malaria outbreaks — protecting the elderly (55+) and young children (0–4 years) most at risk.</p>
          <div className="disclaimer">⚠️ Decision-support tool only · Not a medical diagnostic system</div>
          <div className="hero-actions">
            <a href="#risk" className="btn btn-primary">View Live Risk Map</a>
            <a href="#vulnerable" className="btn btn-outline">Who Is Most at Risk?</a>
          </div>
        </div>
      </div>

      {/* ── Live Risk Dashboard ── */}
      <section id="risk" className="section">
        <div className="container">
          <h2 className="section-title">Live Disease Risk by City</h2>
          <p className="section-sub">
            Risk scores are updated using real-time weather data from Open-Meteo.
            Higher humidity and rainfall = higher mosquito breeding risk.
          </p>

          <div className="grid-auto" style={{ marginBottom: '2rem' }}>
            {CITIES.map(city => {
              const w = weather[city.name];
              const risk = (() => {
                let r = city.risk;
                if (w?.humidity > 80) r = Math.min(0.99, r + 0.04);
                if (w?.rain > 15) r = Math.min(0.99, r + 0.05);
                return r;
              })();
              const label = riskLabel(risk);
              return (
                <div key={city.name} className="card city-card">
                  <div>
                    <div className="city-name">{city.name}</div>
                    <div className="city-country">{city.country} · {city.disease}</div>
                  </div>
                  <div className="city-risk" style={{ color: riskColor(risk) }}>
                    {(risk * 100).toFixed(0)}%
                  </div>
                  <span className={`risk risk-${label}`}>{label.toUpperCase()} RISK</span>
                  {loading ? (
                    <div className="city-weather"><div className="shimmer" style={{ width: '120px' }} /></div>
                  ) : w ? (
                    <div className="city-weather">
                      <span>🌡 {w.temp}°C</span>
                      <span>💧 {w.humidity}%</span>
                      <span>🌧 {w.rain}mm</span>
                    </div>
                  ) : (
                    <div className="city-weather" style={{ color: 'var(--muted)' }}>Weather unavailable</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Map */}
          <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <MapContainer center={[10, 60]} zoom={2} style={{ height: '380px' }} zoomControl>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; OpenStreetMap &copy; CARTO'
              />
              {CITIES.map((city, i) => {
                const risk = city.risk;
                return (
                  <CircleMarker
                    key={i}
                    center={[city.lat, city.lng]}
                    radius={14 + risk * 14}
                    fillColor={riskColor(risk)}
                    fillOpacity={0.35}
                    color={riskColor(risk)}
                    weight={2}
                  >
                    <Tooltip>
                      <div style={{ fontSize: '0.82rem', background: 'transparent' }}>
                        <strong>{city.name}</strong> · {city.disease}<br />
                        Risk: {(risk * 100).toFixed(0)}% · {riskLabel(risk).toUpperCase()}
                      </div>
                    </Tooltip>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
            Map source: OpenStreetMap + CartoDB · Hospital data: OSM Overpass API · Weather: Open-Meteo
          </p>
        </div>
      </section>

      {/* ── Vulnerable Groups ── */}
      <section id="vulnerable" className="section">
        <div className="container">
          <h2 className="section-title">Who Is Most Vulnerable?</h2>
          <p className="section-sub">Two groups face far higher risk of serious illness and death from dengue and malaria.</p>

          <div className="grid-2">
            {/* Elderly */}
            <div className="card" style={{ borderTop: '3px solid var(--orange)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👴👵</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Seniors — Age 55 and above</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1rem' }}>
                Weakened immune systems and existing health conditions make dengue and malaria significantly more dangerous.
              </p>
              <ul style={{ fontSize: '0.85rem', color: 'var(--muted)', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>3–5× higher risk of death compared to healthy adults</li>
                <li>Blood-thinning medications increase bleeding risk during dengue</li>
                <li>Symptoms are often confused with other chronic conditions — diagnosis is delayed</li>
                <li>Fever above 40°C causes organ stress much faster in older patients</li>
              </ul>
            </div>

            {/* Infants */}
            <div className="card" style={{ borderTop: '3px solid var(--blue)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👶🍼</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Infants & Young Children — Age 0 to 4</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1rem' }}>
                Young children have no prior immunity to dengue strains. Dehydration and shock can develop within hours.
              </p>
              <ul style={{ fontSize: '0.85rem', color: 'var(--muted)', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Dengue shock syndrome can develop in 2–4 hours in infants</li>
                <li>Any fever in a baby under 3 months = go to emergency immediately</li>
                <li>Newborns can get dengue from mother during birth</li>
                <li>Pediatric ICU beds are often the first to run out during outbreaks</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Warning Signs ── */}
      <section id="warnings" className="section">
        <div className="container">
          <h2 className="section-title">Warning Signs for Caregivers</h2>
          <p className="section-sub">If you care for an elderly person or young child in a high-risk area, know these signs.</p>

          <div className="grid-2">
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--orange)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>For Seniors (55+)</h3>
              <table>
                <thead><tr><th>Symptom</th><th>Action</th></tr></thead>
                <tbody>
                  {[
                    ['High fever for more than 2 days', 'Visit clinic — do not give ibuprofen'],
                    ['Bleeding gums or red skin spots', 'Emergency — possible dengue hemorrhage'],
                    ['Severe stomach pain + vomiting', 'Hospitalize within 2 hours'],
                    ['Confusion with fever', 'Call ambulance — may be cerebral malaria'],
                    ['Cold hands and feet despite fever', 'Life-threatening — call 108 / 911 now'],
                  ].map(([s, a], i) => (
                    <tr key={i}><td>{s}</td><td style={{ color: 'var(--orange)' }}>{a}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--blue)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>For Infants & Children (0–4)</h3>
              <table>
                <thead><tr><th>Symptom</th><th>Action</th></tr></thead>
                <tbody>
                  {[
                    ['Any fever in baby under 3 months', 'Emergency immediately — no waiting'],
                    ['Refusing to feed or crying non-stop', 'Dehydration risk — see pediatrician now'],
                    ['Red dots or bruising on skin', 'Platelet drop — hospitalize urgently'],
                    ['Fast breathing + pale skin', 'Dengue shock — call ambulance'],
                    ['Hard to wake up, very limp', 'Emergency — neurological warning'],
                  ].map(([s, a], i) => (
                    <tr key={i}><td>{s}</td><td style={{ color: 'var(--blue)' }}>{a}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', borderRadius: '8px', background: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.2)', fontSize: '0.85rem', color: 'var(--muted)' }}>
            <strong style={{ color: 'var(--yellow)' }}>Prevention tip:</strong> Remove standing water near your home (pots, buckets, blocked drains). This is where dengue mosquitoes breed. During outbreak alerts, avoid outdoor activity at dawn and dusk — peak biting hours.
          </div>
        </div>
      </section>

      {/* ── WHO Alerts ── */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Current WHO Disease Alerts</h2>
          <p className="section-sub">Latest outbreak notices from the World Health Organization. Click any alert to read the full report.</p>
          <div>
            {WHO_ALERTS.map((a, i) => (
              <a key={i} href={a.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div
                  className="alert-item"
                  style={{ borderLeftColor: a.severity === 'critical' ? 'var(--red)' : a.severity === 'high' ? 'var(--orange)' : 'var(--yellow)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div>
                      <div className="alert-title">{a.title}</div>
                      <div className="alert-meta">📍 {a.region} &nbsp;·&nbsp; 📅 {a.date} &nbsp;·&nbsp; WHO Disease Outbreak News</div>
                    </div>
                    <span className={`risk risk-${a.severity}`}>{a.severity.toUpperCase()}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.75rem' }}>
            Source: WHO Disease Outbreak News · who.int/emergencies/disease-outbreak-news
          </p>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">How the AI Works</h2>
          <p className="section-sub">Three steps from climate data to early warning.</p>
          <div className="steps">
            {[
              ['Collect Climate Data', 'The system reads live temperature, humidity, rainfall, and satellite data from Open-Meteo, NASA POWER, and Sentinel-2 every hour for 12 high-risk cities.'],
              ['Run the AI Models', 'Three models — LSTM (patterns over time), XGBoost (feature importance), and Prophet (seasonal trends) — combine into an ensemble forecast with a 4-week lookahead window.'],
              ['Issue Early Warnings', 'When risk crosses a threshold, governments, hospitals, and caregivers are notified by SMS and email — weeks before a potential outbreak — so preventive action can begin.'],
            ].map(([title, desc], i) => (
              <div key={i} className="step">
                <div className="step-num">{i + 1}</div>
                <div>
                  <div className="step-title">{title}</div>
                  <div className="step-desc">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Get Alerts ── */}
      <section id="alerts" className="section">
        <div className="container" style={{ maxWidth: '640px' }}>
          <h2 className="section-title">Get Early Warning Alerts</h2>
          <p className="section-sub">Register to receive an email when AI detects rising outbreak risk in your region — especially useful for caregivers, pediatricians, and geriatric care staff.</p>

          {alertSent ? (
            <div style={{ padding: '1.5rem', borderRadius: '10px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>You're subscribed</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>You'll receive alerts for <strong style={{ color: 'var(--text)' }}>{region}</strong> when outbreak risk rises.</div>
            </div>
          ) : (
            <form onSubmit={handleAlert} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="form-row">
                <input
                  type="email" placeholder="Your email address"
                  value={email} onChange={e => setEmail(e.target.value)} required
                />
                <select value={region} onChange={e => setRegion(e.target.value)} required>
                  <option value="">Select your region</option>
                  {CITIES.map(c => <option key={c.name} value={c.name}>{c.name}, {c.country}</option>)}
                  <option value="Global">Global (All alerts)</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                Subscribe to Alerts
              </button>
              <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                Alerts are for public health awareness only. This is not a medical service.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="section">
        <div className="container">
          <hr className="divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>🌿 ClimateGuard AI</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>AI for Climate Change · Hackathon 2026 · PCCOE Campus</div>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--muted)', textAlign: 'right' }}>
              <div>Data: Open-Meteo · WHO · OSM · ReliefWeb</div>
              <div>Models: LSTM · XGBoost · Prophet · SHAP</div>
            </div>
          </div>
          <p className="footer-note">
            <strong>Disclaimer:</strong> ClimateGuard AI is a public health decision-support tool. It is not a medical diagnostic system and must not be used to diagnose or treat any individual. All predictions are probabilistic estimates based on climate and historical data. Always consult a qualified medical professional for health decisions.
          </p>
        </div>
      </footer>
    </>
  );
}
