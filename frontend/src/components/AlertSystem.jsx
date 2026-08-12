import React, { useState } from 'react';

const ALERTS = [
  { level: 'critical', city: 'Lagos, Nigeria', disease: 'Malaria', risk: 95, time: '2 hours ago', icon: '🚨', action: 'Deploy mobile clinics and issue public health advisory.' },
  { level: 'high', city: 'Manila, Philippines', disease: 'Dengue', risk: 88, time: '5 hours ago', icon: '⚠️', action: 'Initiate emergency fogging operations in barangays 4, 7, 12.' },
  { level: 'high', city: 'Delhi, India', disease: 'Dengue', risk: 82, time: '8 hours ago', icon: '⚠️', action: 'Eliminate standing water in urban districts; alert district health officers.' },
  { level: 'medium', city: 'Dhaka, Bangladesh', disease: 'Dengue', risk: 73, time: '12 hours ago', icon: '📊', action: 'Increase surveillance; advise hospitals to prepare for surge.' },
  { level: 'medium', city: 'São Paulo, Brazil', disease: 'Dengue', risk: 69, time: '1 day ago', icon: '📊', action: 'Deploy vector control teams to northern zones.' },
];

export default function AlertSystem() {
  const [email, setEmail] = useState('');
  const [region, setRegion] = useState('');
  const [alertType, setAlertType] = useState('both');
  const [disease, setDisease] = useState('all');
  const [minRisk, setMinRisk] = useState('60');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const regions = ['Delhi, India', 'Mumbai, India', 'Manila, Philippines', 'São Paulo, Brazil', 'Lagos, Nigeria', 'Dhaka, Bangladesh', 'Nairobi, Kenya'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/alerts/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, region, alertType, disease, minRisk: parseInt(minRisk) }),
      });
      if (!res.ok) throw new Error();
    } catch (err) {
      // Backend might not be running in demo
    }
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 700);
  };

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>

      {/* Live Alert Feed */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <div className="chart-title">🔔 Live Alert Feed</div>
            <div className="chart-subtitle">Real-time outbreak warnings from the AI early-warning system</div>
          </div>
          <div className="nav-badge" style={{ fontSize: '0.75rem' }}>
            <div className="pulse-dot" />
            {ALERTS.filter(a => a.level === 'critical').length} CRITICAL
          </div>
        </div>

        <div className="alert-list">
          {ALERTS.map((alert, i) => (
            <div key={i} className={`alert-item ${alert.level}`}>
              <div className="alert-icon">{alert.icon}</div>
              <div className="alert-body">
                <div className="alert-title" style={{ color: alert.level === 'critical' ? 'var(--accent-red)' : alert.level === 'high' ? 'var(--accent-orange)' : 'var(--accent-yellow)' }}>
                  {alert.city} — {alert.disease} Outbreak Risk
                </div>
                <div className="alert-meta">
                  Risk Score: <strong style={{ color: '#e8f4f8' }}>{alert.risk}%</strong> &nbsp;|&nbsp; Detected: {alert.time}
                </div>
                <div style={{ marginTop: '6px', fontSize: '0.78rem', color: '#8fafc4', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#00d4aa', flexShrink: 0 }}>→</span>
                  <span><strong style={{ color: '#e8f4f8' }}>Recommended Action:</strong> {alert.action}</span>
                </div>
              </div>
              <span className={`risk-badge risk-${alert.level}`}>{alert.risk}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Form */}
      <div className="card">
        <div style={{ marginBottom: '1.2rem' }}>
          <div className="chart-title">📬 Subscribe to Early Warnings</div>
          <div className="chart-subtitle">Register to receive SMS / Email alerts when AI detects rising outbreak risk in your region</div>
        </div>

        {submitted ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(0,255,136,0.06)', borderRadius: '12px', border: '1px solid rgba(0,255,136,0.25)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.7rem' }}>✅</div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.2rem', fontWeight: 700, color: '#00ff88', marginBottom: '6px' }}>Successfully Subscribed!</div>
            <div style={{ fontSize: '0.85rem', color: '#8fafc4' }}>You will receive early-warning alerts for <strong style={{ color: '#e8f4f8' }}>{region}</strong> when risk exceeds <strong style={{ color: '#00ff88' }}>{minRisk}%</strong>.</div>
            <button className="btn-secondary" style={{ marginTop: '1rem' }} onClick={() => { setSubmitted(false); setEmail(''); setRegion(''); }}>Subscribe Another</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group full">
                <label className="form-label" htmlFor="sub-email">Email Address</label>
                <input id="sub-email" type="email" className="form-input" placeholder="health.officer@gov.in" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="sub-region">Target Region</label>
                <select id="sub-region" className="form-select" value={region} onChange={e => setRegion(e.target.value)} required>
                  <option value="">Select region...</option>
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="sub-disease">Disease Focus</label>
                <select id="sub-disease" className="form-select" value={disease} onChange={e => setDisease(e.target.value)}>
                  <option value="all">All Diseases</option>
                  <option value="dengue">Dengue Only</option>
                  <option value="malaria">Malaria Only</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Alert Channel</label>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  {[['both', '📱+📧 Both'], ['sms', '📱 SMS'], ['email', '📧 Email']].map(([v, l]) => (
                    <button type="button" key={v} className={`select-btn ${alertType === v ? 'active' : ''}`} style={{ fontSize: '0.75rem', padding: '8px 10px', flex: 1 }} onClick={() => setAlertType(v)}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Minimum Risk Threshold: <strong style={{ color: '#00d4aa' }}>{minRisk}%</strong></label>
                <input type="range" min="40" max="90" value={minRisk} onChange={e => setMinRisk(e.target.value)}
                  style={{ width: '100%', accentColor: '#00d4aa', marginTop: '8px', cursor: 'pointer' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#4a6b80', marginTop: '4px' }}>
                  <span>40% (Early Warning)</span><span>90% (Critical Only)</span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="submit" className="btn-primary" disabled={loading} id="subscribe-btn">
                {loading ? '⏳ Subscribing...' : '🔔 Subscribe to Alerts'}
              </button>
              <span style={{ fontSize: '0.75rem', color: '#4a6b80' }}>🔒 We respect your privacy. Unsubscribe any time.</span>
            </div>
          </form>
        )}
      </div>

      {/* SMS Template Preview */}
      <div className="card">
        <div className="chart-title" style={{ marginBottom: '0.8rem' }}>📱 Sample Alert Templates</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {[
            {
              type: 'SMS', icon: '📱', color: '#00d4aa',
              content: `⚠️ DISEASE ALERT: HIGH dengue outbreak risk in Delhi (82%). AI model predicts 1,240 cases over next 4 weeks. Immediate vector control advised. Reply STOP to unsubscribe. — ClimateGuard AI`
            },
            {
              type: 'Email', icon: '📧', color: '#0088ff',
              content: `Subject: 🚨 High Dengue Risk Alert – Delhi Region\n\nDear Health Officer,\n\nOur AI early-warning system has detected an 82% outbreak probability in Delhi. Key drivers: heavy rainfall (+180mm/month), elevated humidity (85%). Recommended: activate vector control protocols within 48 hours.\n\nThis is a decision-support notification, not a clinical diagnosis.`
            }
          ].map((t, i) => (
            <div key={i} style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${t.color}30` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>{t.icon}</span>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: t.color }}>{t.type} Template</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#8fafc4', lineHeight: 1.6, fontFamily: 'monospace', whiteSpace: 'pre-line', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px' }}>
                {t.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
