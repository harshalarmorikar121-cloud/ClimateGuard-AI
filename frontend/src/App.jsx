import React, { useState, useEffect, useCallback } from 'react';
import './index.css';
import { api } from './services/api';
import { ToastProvider, useToast } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import LiveRiskMap from './components/LiveRiskMap';
import RiskForecastChart from './components/RiskForecastChart';
import ShapWaterfall from './components/ShapWaterfall';
import CustomLocationSearch from './components/CustomLocationSearch';
import ReportSymptomModal from './components/ReportSymptomModal';
import AdminPortal from './components/AdminPortal';

function MainApp() {
  const { addToast } = useToast();
  const { isAuthenticated } = useAuth();

  // State
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [forecastTrajectory, setForecastTrajectory] = useState([]);
  const [whoAlerts, setWhoAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState(false);

  // Alert Form State
  const [subEmail, setSubEmail] = useState('');
  const [subPhone, setSubPhone] = useState('');
  const [subRegion, setSubRegion] = useState('');
  const [subDemographic, setSubDemographic] = useState('ALL');
  const [subLoading, setSubLoading] = useState(false);
  const [subSuccess, setSubSuccess] = useState(false);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial telemetry & WHO feeds
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [riskData, feedsData] = await Promise.all([
        api.getRiskSummary(),
        api.getWhoAlerts().catch(() => ({ alerts: [] })),
      ]);

      setCities(riskData);
      setWhoAlerts(feedsData.alerts || []);

      if (riskData.length > 0) {
        const initialCity = riskData[0];
        setSelectedCity(initialCity);
        // Load initial trajectory
        const traj = await api.getForecastTrajectory(initialCity.city);
        setForecastTrajectory(traj.trajectory || []);
      }
    } catch (err) {
      addToast('Failed to connect to backend surveillance engine.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle selecting city from card/map
  const handleSelectCity = async (city) => {
    setSelectedCity(city);
    try {
      const traj = await api.getForecastTrajectory(city.city);
      setForecastTrajectory(traj.trajectory || []);
    } catch {
      // fallback
    }
  };

  // Handle custom evaluation
  const handleCustomEvaluation = (result) => {
    setSelectedCity(result);
    setForecastTrajectory(result.forecast_trajectory || []);
  };

  // Handle subscription form
  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!subEmail || !subRegion) {
      addToast('Please provide both email and region.', 'warning');
      return;
    }

    setSubLoading(true);
    try {
      await api.subscribeAlerts({
        email: subEmail,
        phone: subPhone || null,
        region: subRegion,
        demographic_target: subDemographic,
        min_risk_threshold: 0.70,
      });
      setSubSuccess(true);
      addToast(`Subscribed ${subEmail} for early warnings in ${subRegion}.`, 'success');
    } catch (err) {
      addToast(err.message || 'Subscription failed.', 'error');
    } finally {
      setSubLoading(false);
    }
  };

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <a href="#" className="nav-brand">
            🌿 ClimateGuard AI
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 400, marginLeft: '6px' }}>
              (Seniors 55+ & Infants 0–4)
            </span>
          </a>

          <div className="nav-links">
            <a href="#telemetry">Live Telemetry</a>
            <a href="#map">Risk Map</a>
            <a href="#forecast">AI Forecast</a>
            <a href="#vulnerable">Caregiver Guide</a>
            <a href="#alerts">Get Alerts</a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="live-dot">
              <div className="dot" />
              LIVE · {time.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <button
              className="btn btn-outline"
              style={{ padding: '5px 12px', fontSize: '0.8rem' }}
              onClick={() => setIsAdminPortalOpen(true)}
            >
              {isAuthenticated ? '🛡️ Officer Console' : 'Officer Login'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero">
        <div className="container">
          <div className="hero-label">AI for Climate Change · Hackathon 2026 · PCCOE Campus</div>
          <h1>
            Predicting Disease Outbreaks<br />
            <span>Before They Strike</span>
          </h1>
          <p>
            An AI-powered early-warning & decision-support system integrating real-time Open-Meteo climate data,
            satellite telemetry, WHO alerts, and OpenStreetMap hospital networks — specifically safeguarding{' '}
            <strong style={{ color: 'var(--orange)' }}>Seniors (55+)</strong> and{' '}
            <strong style={{ color: 'var(--blue)' }}>Infants (0–4 years)</strong>.
          </p>

          {/* Vulnerable Groups Banner */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '640px', margin: '1.5rem auto' }}>
            <div className="card" style={{ padding: '1rem', borderTop: '3px solid var(--orange)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem' }}>👴👵</div>
              <div style={{ fontWeight: 800, color: 'var(--orange)', fontSize: '1.05rem', marginTop: '2px' }}>Seniors 55+</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '2px' }}>
                3–5× higher mortality · Comorbidity risks
              </div>
            </div>
            <div className="card" style={{ padding: '1rem', borderTop: '3px solid var(--blue)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem' }}>👶🍼</div>
              <div style={{ fontWeight: 800, color: 'var(--blue)', fontSize: '1.05rem', marginTop: '2px' }}>Infants 0–4 Yrs</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '2px' }}>
                Immature immunity · Shock in 2–4 hours
              </div>
            </div>
          </div>

          <div className="disclaimer">
            ⚠️ Decision-Support & Early-Warning Platform Only · NOT a Medical Diagnostic System
          </div>

          <div className="hero-actions">
            <a href="#map" className="btn btn-primary">🌍 Live Risk Map</a>
            <button className="btn btn-danger" onClick={() => setIsReportModalOpen(true)}>
              🚨 Report Vulnerable Case / Symptom
            </button>
            <a href="#alerts" className="btn btn-outline">🔔 Subscribe to Alerts</a>
          </div>
        </div>
      </div>

      {/* ── Section 1: Live Climate Telemetry & Sentinel Cities ── */}
      <section id="telemetry" className="section">
        <div className="container">
          <h2 className="section-title">Live Weather & Vector Outbreak Telemetry</h2>
          <p className="section-sub">
            Real-time climate data from <strong>Open-Meteo API</strong> continuously evaluated against vector reproduction and viral incubation models.
          </p>

          {/* Custom Global Evaluator */}
          <CustomLocationSearch onCustomEvaluation={handleCustomEvaluation} />

          {/* Sentinel Cities Grid */}
          <div className="grid-auto" style={{ marginBottom: '1.5rem' }}>
            {loading ? (
              [1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="card city-card" style={{ height: '140px' }}>
                  <div className="shimmer" style={{ width: '60%', height: '16px', marginBottom: '8px' }} />
                  <div className="shimmer" style={{ width: '40%', height: '32px', marginBottom: '8px' }} />
                  <div className="shimmer" style={{ width: '80%', height: '12px' }} />
                </div>
              ))
            ) : (
              cities.map((city) => {
                const isSelected = selectedCity?.city === city.city;
                const riskPercent = (city.risk_score * 100).toFixed(0);
                return (
                  <div
                    key={city.city}
                    className="card city-card"
                    style={{
                      cursor: 'pointer',
                      border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                      background: isSelected ? 'rgba(16,185,129,0.06)' : 'var(--surface)',
                    }}
                    onClick={() => handleSelectCity(city)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div className="city-name">{city.city}</div>
                        <div className="city-country">{city.country} · {city.disease}</div>
                      </div>
                      <span className={`risk risk-${city.risk_level.toLowerCase()}`}>
                        {city.risk_level}
                      </span>
                    </div>

                    <div className="city-risk" style={{ color: city.risk_score >= 0.75 ? 'var(--orange)' : 'var(--accent)' }}>
                      {riskPercent}%
                    </div>

                    {city.weather ? (
                      <div className="city-weather">
                        <span>🌡️ {city.weather.temperature}°C</span>
                        <span>💧 {city.weather.humidity}%</span>
                        <span>🌧️ {city.weather.precipitation}mm</span>
                      </div>
                    ) : (
                      <div className="city-weather" style={{ color: 'var(--muted)' }}>Weather synced</div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* ── Section 2: Interactive Leaflet Map & OSM Overpass Hospitals ── */}
      <section id="map" className="section">
        <div className="container">
          <LiveRiskMap
            cities={cities}
            selectedCity={selectedCity}
            onSelectCity={handleSelectCity}
          />
        </div>
      </section>

      {/* ── Section 3: AI Forecast & SHAP Explainability ── */}
      <section id="forecast" className="section">
        <div className="container">
          <h2 className="section-title">AI Outbreak Forecasting & SHAP Explainability</h2>
          <p className="section-sub">
            Transparent machine learning models providing forward 30-day projection curves and exact feature attributions for{' '}
            <strong style={{ color: 'var(--text)' }}>{selectedCity?.city || 'Selected Location'}</strong>.
          </p>

          <div className="grid-2">
            <RiskForecastChart
              trajectory={forecastTrajectory}
              cityName={selectedCity?.city || 'Selected City'}
            />
            <ShapWaterfall
              attributions={selectedCity?.shap_attributions || []}
              cityName={selectedCity?.city || 'Selected City'}
            />
          </div>
        </div>
      </section>

      {/* ── Section 4: Caregiver & Vulnerable Groups Action Guide ── */}
      <section id="vulnerable" className="section">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 className="section-title">Caregiver Action Guide & Emergency Signs</h2>
              <p className="section-sub" style={{ marginBottom: 0 }}>
                Immediate clinical protocols for protecting elderly individuals and infants in outbreak zones.
              </p>
            </div>
            <button className="btn btn-danger" onClick={() => setIsReportModalOpen(true)}>
              🚨 Submit Emergency Symptom Report
            </button>
          </div>

          <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
            {/* Elderly 55+ */}
            <div className="card" style={{ borderTop: '3px solid var(--orange)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👴👵</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--orange)' }}>
                Protocol: Seniors (55+ Years)
              </h3>
              <table style={{ fontSize: '0.82rem' }}>
                <thead>
                  <tr><th>Observed Sign</th><th>Immediate Action</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Fever &gt;38.5°C &gt;2 days</td>
                    <td style={{ color: 'var(--orange)' }}>Visit clinic; <strong>avoid NSAIDs/Ibuprofen</strong></td>
                  </tr>
                  <tr>
                    <td>Bleeding gums or red petechiae</td>
                    <td style={{ color: 'var(--red)' }}><strong>Urgent hospital admission</strong> (Platelet drop)</td>
                  </tr>
                  <tr>
                    <td>Severe abdominal pain + vomiting</td>
                    <td style={{ color: 'var(--red)' }}>Hospitalize within 2 hours</td>
                  </tr>
                  <tr>
                    <td>Confusion / Disorientation</td>
                    <td style={{ color: 'var(--red)' }}>Call ambulance for cerebral malaria triage</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Infants 0–4 */}
            <div className="card" style={{ borderTop: '3px solid var(--blue)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👶🍼</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--blue)' }}>
                Protocol: Infants & Toddlers (0–4 Years)
              </h3>
              <table style={{ fontSize: '0.82rem' }}>
                <thead>
                  <tr><th>Observed Sign</th><th>Immediate Action</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Any fever in baby &lt;3 months</td>
                    <td style={{ color: 'var(--red)' }}><strong>EMERGENCY</strong> — go to pediatric ER</td>
                  </tr>
                  <tr>
                    <td>Refusal to feed / excessive crying</td>
                    <td style={{ color: 'var(--orange)' }}>High dehydration risk; administer ORS & see doctor</td>
                  </tr>
                  <tr>
                    <td>Rapid breathing + cold extremities</td>
                    <td style={{ color: 'var(--red)' }}>Dengue Shock Syndrome — call ambulance</td>
                  </tr>
                  <tr>
                    <td>Extreme lethargy, limp body</td>
                    <td style={{ color: 'var(--red)' }}>Emergency hospitalization required</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Emergency Hotlines Directory */}
          <div className="card" style={{ padding: '1rem 1.25rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--red)', marginBottom: '6px' }}>
              📞 National Emergency Medical Hotlines
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', fontSize: '0.8rem' }}>
              <div>🇮🇳 <strong>India:</strong> 108 Ambulance / AIIMS Hotline</div>
              <div>🇵🇭 <strong>Philippines:</strong> 911 / DOH 1555</div>
              <div>🇧🇩 <strong>Bangladesh:</strong> 999 / DGHS 16752</div>
              <div>🇳🇬 <strong>Nigeria:</strong> 112 / NCDC 0800-9700-0010</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 5: Live WHO & Health Intelligence ── */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Live Global Health Intelligence</h2>
          <p className="section-sub">Official Disease Outbreak News parsed live from World Health Organization feeds.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {whoAlerts.map((a, i) => (
              <a key={i} href={a.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div className="alert-item" style={{ borderLeftColor: a.severity === 'CRITICAL' ? 'var(--red)' : 'var(--orange)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div>
                      <div className="alert-title">{a.title}</div>
                      <div className="alert-meta">📍 {a.region} &nbsp;·&nbsp; 📅 {a.date} &nbsp;·&nbsp; {a.source || 'WHO DON'}</div>
                    </div>
                    <span className={`risk risk-${a.severity.toLowerCase()}`}>{a.severity}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 6: Real Alert Subscription ── */}
      <section id="alerts" className="section">
        <div className="container" style={{ maxWidth: '680px' }}>
          <h2 className="section-title">Subscribe to Early Warning Alerts</h2>
          <p className="section-sub">
            Receive automated SMS and email advisories when AI models detect escalating vector risk in your region.
          </p>

          {subSuccess ? (
            <div className="card" style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '4px' }}>✅</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Alert Subscription Active</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '4px' }}>
                Early warnings for <strong style={{ color: 'var(--text)' }}>{subRegion}</strong> will be sent to{' '}
                <strong style={{ color: 'var(--text)' }}>{subEmail}</strong>.
              </p>
              <button className="btn btn-outline" style={{ marginTop: '1rem' }} onClick={() => setSubSuccess(false)}>
                Register Another Location
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="form-group-row">
                <div className="form-field">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. caregiver@example.com"
                    value={subEmail}
                    onChange={(e) => setSubEmail(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label>Phone Number (SMS Alerts)</label>
                  <input
                    type="tel"
                    placeholder="e.g. +91-9876543210"
                    value={subPhone}
                    onChange={(e) => setSubPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-field">
                  <label>Monitored City / Region *</label>
                  <select value={subRegion} onChange={(e) => setSubRegion(e.target.value)} required>
                    <option value="">Select city or region</option>
                    {cities.map((c) => (
                      <option key={c.city} value={c.city}>{c.city}, {c.country}</option>
                    ))}
                    <option value="Global">Global (All Alerts)</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Demographic Focus</label>
                  <select value={subDemographic} onChange={(e) => setSubDemographic(e.target.value)}>
                    <option value="ALL">All Populations</option>
                    <option value="SENIORS_55_PLUS">👴 Seniors 55+ Specialized Alerts</option>
                    <option value="INFANTS_0_4">👶 Infants 0–4 Specialized Alerts</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={subLoading}>
                {subLoading ? 'Registering...' : '🔔 Register for Early Warnings'}
              </button>

              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                Zero spam. Only critical outbreak alerts sent. You can unsubscribe anytime.
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="section">
        <div className="container">
          <hr className="divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>🌿 ClimateGuard AI</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                Production Early Warning System · AI for Climate Change · Hackathon 2026 @ PCCOE Campus
              </div>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--muted)', textAlign: 'right' }}>
              <div>Live APIs: Open-Meteo · OSM Overpass · WHO RSS · ReliefWeb</div>
              <div>Intelligence: LSTM · XGBoost · Prophet · SHAP XAI</div>
            </div>
          </div>
          <p className="footer-note">
            <strong>Disclaimer:</strong> ClimateGuard AI is a decision-support early-warning platform for municipal health departments, pediatricians, and caregivers. It is <strong>NOT a clinical diagnostic tool</strong> and must not be used to diagnose or treat individual patients. All forecasts are probabilistic estimates based on climate telemetry.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <ReportSymptomModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      <AdminPortal
        isOpen={isAdminPortalOpen}
        onClose={() => setIsAdminPortalOpen(false)}
      />
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
