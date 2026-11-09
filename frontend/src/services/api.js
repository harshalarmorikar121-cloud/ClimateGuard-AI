const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('climateguard_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        let errorMessage = `HTTP Error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          // ignore parsing error
        }
        throw new Error(errorMessage);
      }
      return await response.json();
    } catch (error) {
      console.error(`[API Error] ${endpoint}:`, error);
      throw error;
    }
  }

  // --- Public Surveillance Endpoints ---
  async getRiskSummary() {
    return this.request('/api/public/risk-summary');
  }

  async evaluateCustomLocation(cityName, latitude, longitude, disease = 'Dengue') {
    return this.request('/api/public/evaluate-custom-location', {
      method: 'POST',
      body: JSON.stringify({ city_name: cityName, latitude, longitude, disease }),
    });
  }

  async getForecastTrajectory(cityName) {
    return this.request(`/api/public/forecast-trajectory/${encodeURIComponent(cityName)}`);
  }

  // --- Subscriptions ---
  async subscribeAlerts(data) {
    return this.request('/api/subscriptions/subscribe', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async unsubscribeAlerts(email, region = 'Global') {
    return this.request(`/api/subscriptions/unsubscribe?email=${encodeURIComponent(email)}&region=${encodeURIComponent(region)}`, {
      method: 'POST',
    });
  }

  // --- Caregiver Emergency Reports ---
  async submitEmergencyReport(reportData) {
    return this.request('/api/reports/submit', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  async getReportsCount(city = '') {
    const q = city ? `?city=${encodeURIComponent(city)}` : '';
    return this.request(`/api/reports/recent-public-count${q}`);
  }

  // --- OpenStreetMap Hospitals ---
  async getNearbyHospitals(lat, lng, radius = 8000) {
    return this.request(`/api/hospitals/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  }

  // --- Feeds ---
  async getWhoAlerts() {
    return this.request('/api/feeds/who-alerts');
  }

  async getReliefWebReports() {
    return this.request('/api/feeds/reliefweb-reports');
  }

  // --- Health Officer Authentication ---
  async login(email, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.access_token) {
      localStorage.setItem('climateguard_token', data.access_token);
      localStorage.setItem('climateguard_user', JSON.stringify(data.user));
    }
    return data;
  }

  logout() {
    localStorage.removeItem('climateguard_token');
    localStorage.removeItem('climateguard_user');
  }

  getSavedUser() {
    const userStr = localStorage.getItem('climateguard_user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  // --- Admin Console (Protected) ---
  async getAdminMetrics() {
    return this.request('/api/admin/metrics');
  }

  async getAdminReports(statusFilter = '') {
    const q = statusFilter ? `?status_filter=${statusFilter}` : '';
    return this.request(`/api/admin/reports${q}`);
  }

  async updateReportStatus(reportId, updateData) {
    return this.request(`/api/admin/reports/${reportId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  }

  async broadcastAlert(alertData) {
    return this.request('/api/admin/broadcast-alert', {
      method: 'POST',
      body: JSON.stringify(alertData),
    });
  }

  async getDispatchLogs() {
    return this.request('/api/admin/dispatch-logs');
  }
}

export const api = new ApiService();
