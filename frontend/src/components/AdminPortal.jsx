import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AdminPortal({ isOpen, onClose }) {
  const { user, login, logout, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [email, setEmail] = useState('officer@climateguard.org');
  const [password, setPassword] = useState('HealthOfficer2026!');
  const [loading, setLoading] = useState(false);

  const [metrics, setMetrics] = useState(null);
  const [reports, setReports] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('metrics'); // metrics, reports, broadcast, logs

  // Broadcast state
  const [broadcastData, setBroadcastData] = useState({
    region: 'Delhi',
    subject: 'URGENT: High Vector Breeding Advisory Issued',
    message: 'High humidity (>85%) and standing water detected. Implement larval control and protect seniors 55+ and infants 0-4 years.',
    target_demographic: 'ALL',
    severity: 'HIGH',
  });
  const [broadcasting, setBroadcasting] = useState(false);

  const loadAdminData = async () => {
    try {
      const [m, r, l] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminReports(),
        api.getDispatchLogs(),
      ]);
      setMetrics(m);
      setReports(r);
      setLogs(l);
    } catch (err) {
      addToast(err.message || 'Failed to load surveillance console data.', 'error');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated]);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      addToast('Authenticated as Health Officer successfully.', 'success');
      loadAdminData();
    } catch (err) {
      addToast(err.message || 'Invalid credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    setBroadcasting(true);
    try {
      const res = await api.broadcastAlert(broadcastData);
      addToast(res.message, 'success');
      loadAdminData();
    } catch (err) {
      addToast(err.message || 'Failed to dispatch broadcast alert.', 'error');
    } finally {
      setBroadcasting(false);
    }
  };

  const handleStatusUpdate = async (reportId, newStatus) => {
    try {
      await api.updateReportStatus(reportId, { status: newStatus });
      addToast(`Report #${reportId} updated to ${newStatus}.`, 'success');
      setReports(reports.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r)));
    } catch (err) {
      addToast(err.message || 'Failed to update report status.', 'error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">🛡️ Health Officer & Surveillance Portal</h3>
            <p className="modal-subtitle">Authorized epidemiologist console for outbreak triage and emergency broadcasts.</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {!isAuthenticated ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div className="card" style={{ padding: '1rem', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--blue)', fontWeight: 600, marginBottom: '4px' }}>Demo Officer Credentials:</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                Email: <strong>officer@climateguard.org</strong><br />
                Password: <strong>HealthOfficer2026!</strong>
              </div>
            </div>

            <div className="form-field">
              <label>Officer Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In as Officer'}
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Header info & Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>
                  👤 <strong>{user?.full_name}</strong> ({user?.organization})
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent)', marginLeft: '8px', padding: '2px 8px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)' }}>
                  {user?.role}
                </span>
              </div>
              <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={logout}>
                Sign Out
              </button>
            </div>

            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                ['metrics', '📊 Metrics'],
                ['reports', `🚨 Caregiver Reports (${reports.length})`],
                ['broadcast', '📢 Broadcast Advisory'],
                ['logs', '📋 Dispatch Audit Logs'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  className={`btn-preset ${activeTab === key ? 'active' : ''}`}
                  onClick={() => setActiveTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tab 1: Metrics */}
            {activeTab === 'metrics' && metrics && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                {[
                  ['Active Alert Subscribers', metrics.total_active_subscribers, '👥', 'var(--accent)'],
                  ['Seniors 55+ Focus', metrics.elderly_focused_subscribers, '👴', 'var(--orange)'],
                  ['Infants 0-4 Focus', metrics.infant_focused_subscribers, '👶', 'var(--blue)'],
                  ['Pending Emergency Reports', metrics.pending_caregiver_reports, '⚠️', 'var(--yellow)'],
                  ['Critical Triages', metrics.critical_emergency_reports, '🚨', 'var(--red)'],
                  ['Alerts Dispatched', metrics.total_alerts_dispatched, '📡', 'var(--text)'],
                ].map(([label, val, icon, color]) => (
                  <div key={label} className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{icon}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{label}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color, marginTop: '2px' }}>{val}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 2: Reports Queue */}
            {activeTab === 'reports' && (
              <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {reports.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                    No incoming caregiver reports.
                  </div>
                ) : (
                  reports.map((r) => (
                    <div key={r.id} className="card" style={{ padding: '1rem', borderLeft: `4px solid ${r.severity === 'EMERGENCY' ? 'var(--red)' : 'var(--yellow)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <strong>{r.reporter_name}</strong> (Phone: {r.contact_phone})
                          <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                            Patient Age: {r.patient_age} yrs · {r.demographic_group === 'SENIORS_55_PLUS' ? '👴 Senior' : '👶 Infant'} · City: {r.city}
                          </div>
                        </div>
                        <span className={`risk risk-${r.severity === 'EMERGENCY' ? 'critical' : 'medium'}`}>
                          {r.severity}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.82rem', marginTop: '6px', color: 'var(--text)', background: 'rgba(255,255,255,0.02)', padding: '6px', borderRadius: '4px' }}>
                        <strong>Reported Symptoms:</strong> {r.symptoms}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap', gap: '6px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                          Status: <strong style={{ color: r.status === 'PENDING' ? 'var(--yellow)' : 'var(--accent)' }}>{r.status}</strong>
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-outline"
                            style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                            onClick={() => handleStatusUpdate(r.id, 'REVIEWED')}
                          >
                            Mark Reviewed
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                            onClick={() => handleStatusUpdate(r.id, 'ESCALATED')}
                          >
                            Escalate to Clinic
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 3: Broadcast Advisory */}
            {activeTab === 'broadcast' && (
              <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="form-group-row">
                  <div className="form-field">
                    <label>Target Region *</label>
                    <input
                      type="text"
                      required
                      value={broadcastData.region}
                      onChange={(e) => setBroadcastData({ ...broadcastData, region: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label>Target Demographic</label>
                    <select
                      value={broadcastData.target_demographic}
                      onChange={(e) => setBroadcastData({ ...broadcastData, target_demographic: e.target.value })}
                    >
                      <option value="ALL">All Subscribers</option>
                      <option value="SENIORS_55_PLUS">👴 Seniors 55+ Caregivers Only</option>
                      <option value="INFANTS_0_4">👶 Infants 0-4 Pediatricians Only</option>
                    </select>
                  </div>
                </div>

                <div className="form-field">
                  <label>Advisory Subject *</label>
                  <input
                    type="text"
                    required
                    value={broadcastData.subject}
                    onChange={(e) => setBroadcastData({ ...broadcastData, subject: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Emergency Directive Message *</label>
                  <textarea
                    required
                    rows={3}
                    value={broadcastData.message}
                    onChange={(e) => setBroadcastData({ ...broadcastData, message: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn btn-danger" disabled={broadcasting}>
                  {broadcasting ? 'Dispatching Broadcast...' : '📢 Send Emergency Advisory'}
                </button>
              </form>
            )}

            {/* Tab 4: Logs */}
            {activeTab === 'logs' && (
              <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table style={{ fontSize: '0.78rem' }}>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Recipient</th>
                      <th>Region</th>
                      <th>Subject</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--muted)' }}>No dispatch logs recorded yet.</td></tr>
                    ) : (
                      logs.map((l) => (
                        <tr key={l.id}>
                          <td>{new Date(l.dispatched_at).toLocaleTimeString()}</td>
                          <td>{l.recipient}</td>
                          <td>{l.region}</td>
                          <td>{l.subject}</td>
                          <td style={{ color: l.status === 'SENT' ? 'var(--accent)' : 'var(--red)' }}>{l.status}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
