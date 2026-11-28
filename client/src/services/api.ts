import { User, Donation, ImpactStats, Notification, HeatmapZone, DemandPrediction, LiveInsight } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://foodrescue-8yh2.onrender.com/api';

const getHeaders = () => {
  const token = localStorage.getItem('fra_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to sign in');
    }
    return res.json();
  },

  async register(data: any): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to register account');
    }
    return res.json();
  },

  async getCurrentUser(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Unauthorized');
    return res.json();
  },

  async getDemoAccounts(): Promise<{ accounts: any[] }> {
    const res = await fetch(`${API_BASE}/auth/demo-accounts`);
    return res.json();
  },

  // Donations
  async getDonations(params: Record<string, string> = {}): Promise<{ count: number; donations: Donation[] }> {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/donations${query ? '?' + query : ''}`);
    if (!res.ok) throw new Error('Failed to fetch donations');
    return res.json();
  },

  async getDonationById(id: string): Promise<{ donation: Donation }> {
    const res = await fetch(`${API_BASE}/donations/${id}`);
    if (!res.ok) throw new Error('Failed to fetch donation details');
    return res.json();
  },

  async createDonation(data: Partial<Donation>): Promise<{ message: string; donation: Donation }> {
    const res = await fetch(`${API_BASE}/donations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create donation');
    }
    return res.json();
  },

  async acceptDonation(id: string): Promise<{ message: string; donation: Donation }> {
    const res = await fetch(`${API_BASE}/donations/${id}/accept`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to accept donation');
    }
    return res.json();
  },

  async assignVolunteer(id: string): Promise<{ message: string; donation: Donation }> {
    const res = await fetch(`${API_BASE}/donations/${id}/assign-volunteer`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to accept pickup task');
    }
    return res.json();
  },

  async deleteDonation(id: string): Promise<{ message: string; id: string }> {
    const res = await fetch(`${API_BASE}/donations/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete donation');
    }
    return res.json();
  },

  // Flipkart-Style Delivery Workflow API Methods
  async confirmPickup(id: string): Promise<{ message: string; donation: Donation }> {
    const res = await fetch(`${API_BASE}/donations/${id}/confirm-pickup`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to confirm food pickup');
    }
    return res.json();
  },

  async startDelivery(id: string): Promise<{ message: string; donation: Donation }> {
    const res = await fetch(`${API_BASE}/donations/${id}/start-delivery`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to start delivery');
    }
    return res.json();
  },

  async markDelivered(
    id: string,
    data: { deliveryProofUrl?: string; deliveryNotes?: string; deliveryLat?: number; deliveryLng?: number }
  ): Promise<{ message: string; donation: Donation }> {
    const res = await fetch(`${API_BASE}/donations/${id}/mark-delivered`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to mark as delivered');
    }
    return res.json();
  },

  async confirmReceived(id: string): Promise<{ message: string; donation: Donation }> {
    const res = await fetch(`${API_BASE}/donations/${id}/confirm-received`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to confirm receipt');
    }
    return res.json();
  },

  async reportNotReceived(id: string, reason: string): Promise<{ message: string; donation: Donation }> {
    const res = await fetch(`${API_BASE}/donations/${id}/report-not-received`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ reason })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to report non-receipt');
    }
    return res.json();
  },

  async resolveDispute(
    id: string,
    data: { resolution: 'verified_completed' | 'cancelled'; notes: string }
  ): Promise<{ message: string; donation: Donation }> {
    const res = await fetch(`${API_BASE}/donations/${id}/resolve-dispute`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to resolve dispute');
    }
    return res.json();
  },

  async adminVerifyDelivery(id: string): Promise<{ message: string; donation: Donation }> {
    const res = await fetch(`${API_BASE}/donations/${id}/admin-verify`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to manually verify delivery');
    }
    return res.json();
  },

  // AI Services
  async evaluateFoodSafety(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/ai/safety-analysis`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Safety evaluation failed');
    return res.json();
  },

  async analyzeFoodImage(data: { imageUrl: string; foodNameHint?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/ai/image-analysis`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Image analysis failed');
    return res.json();
  },

  async getSmartMatches(donation: Partial<Donation>): Promise<{ matches: any[] }> {
    const res = await fetch(`${API_BASE}/ai/match`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ donation })
    });
    if (!res.ok) throw new Error('Matching engine failed');
    return res.json();
  },

  async getDemandPredictions(): Promise<{ forecasts: DemandPrediction[] }> {
    const res = await fetch(`${API_BASE}/ai/demand-predictions`);
    if (!res.ok) throw new Error('Failed to fetch demand forecasts');
    return res.json();
  },

  async getLiveInsights(): Promise<{ insights: LiveInsight[] }> {
    const res = await fetch(`${API_BASE}/ai/insights`);
    if (!res.ok) throw new Error('Failed to fetch live insights');
    return res.json();
  },

  // Tracking
  async getTracking(donationId: string): Promise<{ tracking: any }> {
    const res = await fetch(`${API_BASE}/tracking/${donationId}`);
    if (!res.ok) throw new Error('Failed to load tracking telemetrics');
    return res.json();
  },

  async stepTelemetry(donationId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/tracking/${donationId}/step`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  // Impact
  async getImpactStats(): Promise<{ stats: ImpactStats; disclaimer: string }> {
    const res = await fetch(`${API_BASE}/impact/stats`);
    if (!res.ok) throw new Error('Failed to fetch impact metrics');
    return res.json();
  },

  async getHeatmapZones(): Promise<{ zones: HeatmapZone[] }> {
    const res = await fetch(`${API_BASE}/impact/heatmap`);
    if (!res.ok) throw new Error('Failed to fetch heatmap zones');
    return res.json();
  },

  // Notifications
  async getNotifications(): Promise<{ notifications: Notification[] }> {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: getHeaders()
    });
    if (!res.ok) return { notifications: [] };
    return res.json();
  },

  async markNotificationRead(id: string): Promise<void> {
    await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getHeaders()
    });
  },

  // Admin
  async getAdminOverview(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/overview`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Admin authorization required');
    return res.json();
  },

  async getAdminUsers(): Promise<{ users: User[] }> {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to load users');
    return res.json();
  },

  async toggleUserVerification(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/users/${id}/verify`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    return res.json();
  },

  async toggleUserSuspension(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/users/${id}/suspend`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    return res.json();
  },

  // Firebase Cloud Backend
  async getFirebaseStatus(): Promise<{ status: any }> {
    const res = await fetch(`${API_BASE}/firebase/status`);
    if (!res.ok) throw new Error('Failed to get Firebase status');
    return res.json();
  },

  async updateFirebaseConfig(config: { projectId: string; apiKey?: string; authDomain?: string; emulatorHost?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/firebase/config`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(config)
    });
    if (!res.ok) throw new Error('Failed to update Firebase configuration');
    return res.json();
  },

  async testFirebaseConnection(): Promise<any> {
    const res = await fetch(`${API_BASE}/firebase/test`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  async syncFirebaseData(): Promise<any> {
    const res = await fetch(`${API_BASE}/firebase/sync`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to sync to Firestore');
    return res.json();
  }
};
