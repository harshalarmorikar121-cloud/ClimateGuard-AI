import React, { useState } from 'react';

const ML_MODELS = [
  { name: 'LSTM', icon: '🧠', type: 'Deep Learning', accuracy: '91.2%', rmse: '4.8', use: 'Long-range temporal patterns, captures multi-week lag effects of rainfall on mosquito populations.', color: '#00d4aa', library: 'TensorFlow / Keras' },
  { name: 'XGBoost', icon: '⚡', type: 'Gradient Boosting', accuracy: '89.7%', rmse: '5.3', use: 'Feature-rich tabular data with non-linear climate interactions; fast inference at scale.', color: '#0088ff', library: 'XGBoost' },
  { name: 'Prophet', icon: '📈', type: 'Time-Series', accuracy: '88.4%', rmse: '5.7', use: 'Captures yearly seasonality and holiday effects; excellent for interpretable trend decomposition.', color: '#ffd700', library: 'Facebook Prophet' },
  { name: 'Ensemble', icon: '🎯', type: 'Stacked Model', accuracy: '93.1%', rmse: '3.9', use: 'Weighted average of LSTM + XGBoost + Prophet; highest performance via bias-variance tradeoff.', color: '#ff6b35', library: 'Custom Stacking' },
];

const DB_SCHEMA = [
  { table: 'locations', icon: '📍', fields: ['id (PK)', 'city', 'country', 'lat', 'lng', 'population', 'region_type'] },
  { table: 'climate_data', icon: '🌦', fields: ['id (PK)', 'location_id (FK)', 'date', 'rainfall_mm', 'temp_max', 'temp_min', 'humidity_pct', 'wind_speed', 'ndvi_index', 'data_source'] },
  { table: 'outbreak_cases', icon: '🦟', fields: ['id (PK)', 'location_id (FK)', 'date', 'disease', 'confirmed_cases', 'suspected_cases', 'deaths', 'source'] },
  { table: 'forecasts', icon: '📊', fields: ['id (PK)', 'location_id (FK)', 'forecast_date', 'disease', 'model_name', 'predicted_cases', 'upper_bound', 'lower_bound', 'risk_score', 'shap_payload'] },
  { table: 'alert_subscribers', icon: '🔔', fields: ['id (PK)', 'email', 'phone', 'region_id (FK)', 'disease_filter', 'min_risk_threshold', 'channel', 'created_at', 'is_active'] },
];

const API_ENDPOINTS = [
  { method: 'GET', path: '/api/forecast/{location}?days=30', desc: 'Time-series case predictions from LSTM/Prophet/XGBoost ensemble model.' },
  { method: 'GET', path: '/api/risk-map', desc: 'Geo-coordinates with risk scores for all monitored cities, powering the heatmap.' },
  { method: 'GET', path: '/api/explain/{location}', desc: 'SHAP feature importance values explaining what climate factors are driving the forecast.' },
  { method: 'GET', path: '/api/climate/{location}', desc: 'Real-time climate data integration from Open-Meteo / NASA POWER APIs.' },
  { method: 'POST', path: '/api/alerts/subscribe', desc: 'Register health worker or agency for SMS/email outbreak alerts.' },
  { method: 'GET', path: '/api/alerts/feed', desc: 'Paginated feed of all active outbreak warnings sorted by severity.' },
  { method: 'GET', path: '/api/historical/{location}', desc: 'Historical disease case data with matching climate features for model validation.' },
  { method: 'GET', path: '/health', desc: 'API health check and version info for monitoring/uptime systems.' },
];

const DEPLOY_STEPS = [
  { title: 'Containerization', desc: 'Docker containers for backend (FastAPI + Python) and frontend (React/Vite Nginx). Docker Compose for local orchestration.', tags: ['Docker', 'Nginx', 'Docker Compose'] },
  { title: 'Cloud Infrastructure', desc: 'Deploy to GCP Cloud Run (serverless) for backend; Firebase Hosting or Vercel for frontend. CI/CD via GitHub Actions.', tags: ['GCP Cloud Run', 'Firebase', 'GitHub Actions'] },
  { title: 'ML Pipeline', desc: 'Models retrain weekly using Apache Airflow DAGs ingesting new climate + case data from Open-Meteo and WHO/ProMED APIs.', tags: ['Airflow', 'MLflow', 'Model Registry'] },
  { title: 'Monitoring & Alerts', desc: 'Prometheus + Grafana for API performance monitoring. PagerDuty for on-call alerts. Sentry for error tracking.', tags: ['Prometheus', 'Grafana', 'Sentry'] },
  { title: 'Data Privacy & Security', desc: 'All subscriber data encrypted at rest (AES-256). GDPR / HIPAA-aligned consent flows. No PII in ML training pipeline.', tags: ['AES-256', 'GDPR', 'HIPAA'] },
];

export default function Architecture() {
  const [activeTab, setActiveTab] = useState('models');
  const [activeModel, setActiveModel] = useState(0);

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>

      {/* Tab Bar */}
      <div className="tab-bar">
        {[['models', '🧠 ML Models'], ['pipeline', '⚙️ Pipeline'], ['database', '🗄️ Database'], ['api', '🔌 API'], ['deploy', '🚀 Deployment']].map(([key, label]) => (
          <button key={key} className={`tab-btn ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>{label}</button>
        ))}
      </div>

      {/* ML Models Tab */}
      {activeTab === 'models' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {ML_MODELS.map((m, i) => (
              <div key={i} className={`model-card ${activeModel === i ? 'active' : ''}`} style={{ cursor: 'pointer', borderColor: activeModel === i ? m.color + '60' : undefined }} onClick={() => setActiveModel(i)}>
                <div className="model-icon">{m.icon}</div>
                <div className="model-name">{m.name}</div>
                <div style={{ fontSize: '0.72rem', color: m.color, fontWeight: 600, marginBottom: '6px' }}>{m.type} · {m.library}</div>
                <div className="model-desc">{m.use}</div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <span className="model-accuracy">✓ {m.accuracy} Accuracy</span>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(255,255,255,0.06)', color: '#8fafc4' }}>RMSE: {m.rmse}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Active Model Detail */}
          <div className="card" style={{ borderColor: ML_MODELS[activeModel].color + '40' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '3rem' }}>{ML_MODELS[activeModel].icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.3rem', fontWeight: 700, color: ML_MODELS[activeModel].color }}>{ML_MODELS[activeModel].name}</div>
                <div style={{ fontSize: '0.85rem', color: '#8fafc4', marginTop: '4px' }}>{ML_MODELS[activeModel].use}</div>
                <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                  {[['Input Features', '12 climate vars'], ['Output', '30-day forecast'], ['Training Freq', 'Weekly retrain'], ['Library', ML_MODELS[activeModel].library]].map(([k, v]) => (
                    <div key={k} style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: '0.68rem', color: '#4a6b80', fontWeight: 600, marginBottom: '2px', textTransform: 'uppercase' }}>{k}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e8f4f8' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Tab */}
      {activeTab === 'pipeline' && (
        <div className="card">
          <div className="chart-title" style={{ marginBottom: '1rem' }}>⚙️ ML Data Pipeline</div>
          <div style={{ overflowX: 'auto' }}>
            <div className="pipeline">
              {[
                { icon: '🌦', label: 'Climate APIs', step: 'Open-Meteo\nNASA POWER' },
                null,
                { icon: '🛰', label: 'Satellite Data', step: 'NDVI\nSentinel-2' },
                null,
                { icon: '🏥', label: 'Case Reports', step: 'WHO/ProMED\nState Health' },
                null,
                { icon: '🔧', label: 'Feature Eng.', step: 'Lag features\nNormalization' },
                null,
                { icon: '🧠', label: 'ML Models', step: 'LSTM+XGB\n+Prophet' },
                null,
                { icon: '🔍', label: 'SHAP Explain', step: 'Feature\nAttribution' },
                null,
                { icon: '📡', label: 'API Layer', step: 'FastAPI\nREST/JSON' },
                null,
                { icon: '🗺', label: 'Dashboard', step: 'React\nFrontend' },
              ].map((item, idx) => (
                item === null
                  ? <div key={idx} className="pipeline-arrow">→</div>
                  : (
                    <div key={idx} className="pipeline-step active">
                      <div className="pipeline-icon">{item.icon}</div>
                      <div className="pipeline-label" style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>{item.label}</div>
                      <div style={{ fontSize: '0.62rem', color: '#4a6b80', textAlign: 'center', whiteSpace: 'pre-line', marginTop: '2px' }}>{item.step}</div>
                    </div>
                  )
              ))}
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {[
              { title: 'Data Sources', items: ['Open-Meteo (Weather)', 'NASA POWER (Climate)', 'CHIRPS (Rainfall)', 'Sentinel-2 (Satellite)', 'WHO / ProMED (Cases)'] },
              { title: 'Feature Engineering', items: ['14-day lagged rainfall', '28-day rolling temperature', 'NDVI from satellite', 'Population density', 'Urban vs. rural classification'] },
              { title: 'Model Outputs', items: ['30-day case forecasts', 'Risk score 0–1', 'Confidence intervals', 'SHAP explanations', 'Geo-tagged alerts'] },
            ].map((section, i) => (
              <div key={i} style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#00d4aa', marginBottom: '8px' }}>{section.title}</div>
                {section.items.map((item, j) => (
                  <div key={j} style={{ fontSize: '0.78rem', color: '#8fafc4', padding: '4px 0', borderBottom: j < section.items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    • {item}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Database Tab */}
      {activeTab === 'database' && (
        <div className="card">
          <div className="chart-title" style={{ marginBottom: '1rem' }}>🗄️ Database Schema (SQLite → PostgreSQL in Production)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {DB_SCHEMA.map((table, i) => (
              <div key={i} style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '1.3rem' }}>{table.icon}</span>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#00d4aa', fontSize: '0.9rem' }}>{table.table}</span>
                </div>
                {table.fields.map((field, j) => (
                  <div key={j} style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', margin: '3px 0', background: field.includes('PK') ? 'rgba(0,212,170,0.1)' : field.includes('FK') ? 'rgba(0,136,255,0.1)' : 'rgba(255,255,255,0.03)', color: field.includes('PK') ? '#00d4aa' : field.includes('FK') ? '#0088ff' : '#8fafc4', fontFamily: 'monospace' }}>
                    {field}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API Tab */}
      {activeTab === 'api' && (
        <div className="card">
          <div className="chart-title" style={{ marginBottom: '1rem' }}>🔌 REST API Reference — FastAPI Backend</div>
          <div style={{ marginBottom: '1rem', padding: '10px 14px', background: 'rgba(0,136,255,0.06)', border: '1px solid rgba(0,136,255,0.2)', borderRadius: '8px', fontSize: '0.8rem', color: '#8fafc4' }}>
            <strong style={{ color: '#0088ff' }}>Base URL:</strong> <code style={{ color: '#00d4aa', fontFamily: 'monospace' }}>http://localhost:8000</code> &nbsp;|&nbsp; Interactive docs: <code style={{ color: '#00d4aa' }}>/docs</code>
          </div>
          {API_ENDPOINTS.map((ep, i) => (
            <div key={i} className="api-endpoint">
              <span className={`method-badge ${ep.method === 'GET' ? 'method-get' : 'method-post'}`}>{ep.method}</span>
              <div>
                <div className="endpoint-path">{ep.path}</div>
                <div className="endpoint-desc">{ep.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deployment Tab */}
      {activeTab === 'deploy' && (
        <div className="card">
          <div className="chart-title" style={{ marginBottom: '1.5rem' }}>🚀 Deployment Plan — Production Roadmap</div>
          {DEPLOY_STEPS.map((step, i) => (
            <div key={i} className="deploy-step">
              <div className="deploy-num">{i + 1}</div>
              <div className="deploy-content">
                <h4>{step.title}</h4>
                <p>{step.desc}</p>
                <div className="tech-tags">{step.tags.map(t => <span key={t} className="tech-tag">{t}</span>)}</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            {[['< 200ms', 'API Response Time'], ['99.9%', 'Target Uptime SLA'], ['Weekly', 'Model Retraining'], ['< $50/mo', 'GCP Cloud Run Cost']].map(([v, l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: '#00d4aa' }}>{v}</div>
                <div style={{ fontSize: '0.72rem', color: '#8fafc4', marginTop: '2px' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
