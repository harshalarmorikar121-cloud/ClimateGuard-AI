import React, { useState } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ReportSymptomModal({ isOpen, onClose }) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reporter_name: '',
    contact_phone: '',
    contact_email: '',
    patient_age: '',
    demographic_group: 'SENIORS_55_PLUS',
    city: '',
    address_or_landmark: '',
    symptoms: '',
    severity: 'URGENT'
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.submitEmergencyReport({
        ...formData,
        patient_age: parseInt(formData.patient_age, 10),
      });
      addToast('Emergency report submitted successfully to health authorities.', 'success');
      onClose();
    } catch (err) {
      addToast(err.message || 'Failed to submit emergency report.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">🚨 Report Vulnerable Case / Symptom</h3>
            <p className="modal-subtitle">Directly alerts municipal surveillance officers and pediatric/geriatric triage units.</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group-row">
            <div className="form-field">
              <label>Reporter Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Maria Santos (Caregiver)"
                value={formData.reporter_name}
                onChange={(e) => setFormData({ ...formData, reporter_name: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Contact Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="e.g. +91-9876543210"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group-row">
            <div className="form-field">
              <label>Patient Age *</label>
              <input
                type="number"
                required
                min="0"
                max="120"
                placeholder="e.g. 68 or 2"
                value={formData.patient_age}
                onChange={(e) => setFormData({ ...formData, patient_age: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Vulnerable Target Group *</label>
              <select
                value={formData.demographic_group}
                onChange={(e) => setFormData({ ...formData, demographic_group: e.target.value })}
              >
                <option value="SENIORS_55_PLUS">👴👵 Senior (Age 55+)</option>
                <option value="INFANTS_0_4">👶🍼 Infant / Toddler (Age 0–4)</option>
              </select>
            </div>
          </div>

          <div className="form-group-row">
            <div className="form-field">
              <label>City / Municipality *</label>
              <input
                type="text"
                required
                placeholder="e.g. Delhi, Manila, Lagos"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Severity Assessment *</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              >
                <option value="URGENT">⚠️ URGENT (Fever &gt;2 days, refusal to feed)</option>
                <option value="EMERGENCY">🚨 CRITICAL EMERGENCY (Bleeding, shock, confusion)</option>
                <option value="MILD">ℹ️ MILD (Early symptoms / preventive watch)</option>
              </select>
            </div>
          </div>

          <div className="form-field">
            <label>Observed Danger Symptoms *</label>
            <textarea
              required
              rows={3}
              placeholder="Describe symptoms: e.g. High fever (103°F) for 3 days, bleeding gums, cold hands, severe dehydration, lethargy..."
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-danger" disabled={loading}>
              {loading ? 'Submitting Report...' : 'Submit Emergency Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
