/// <reference types="vite/client" />
import axios, { type InternalAxiosRequestConfig } from 'axios';
import { auth } from '../config/firebase';
import { clearSessionExpiry, isSessionExpired } from '../utils/session';
import { logout as firebaseLogout } from './authService';

// Token expiration: Firebase ID token expires in 1 hour. We refresh on 401.
// Session expiration: app-level (see utils/session.ts), default 24h.

// Determine API URL based on environment (exported for use in other services)
export const getApiUrl = (): string => {
  // Dev on localhost/127.0.0.1: always use same-origin so Vite proxy is used (avoids CORS)
  if (import.meta.env.DEV && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return '';
  }

  // If VITE_API_URL is explicitly set (non-empty), use it
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && String(envUrl).trim()) {
    const url = String(envUrl).trim();
    return url.replace(/\/api\/?$/, '').replace(/\/$/, '');
  }

  // In production mode, check if we're on the same domain
  if (import.meta.env.PROD) {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      return '';
    }
    return 'https://truvamate-api.vercel.app';
  }

  // Fallback dev (e.g. no Vite): direct to backend
  return 'http://127.0.0.1:5000';
};

const API_URL = getApiUrl();

// Create axios instance
// Always add /api to base URL (backend expects /api prefix)
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add Firebase token; skip if session expired (app-level)
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined' && isSessionExpired()) {
      clearSessionExpiry();
      try {
        await firebaseLogout();
      } catch (_) {}
      const path = window.location.pathname || '';
      const loginPath = path.startsWith('/admin') ? '/admin/login' : '/login';
      window.location.href = `${loginPath}?redirect=${encodeURIComponent(path || '/')}`;
      return Promise.reject(new Error('Session expired'));
    }
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {
      // Token not available
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Single refresh promise to avoid multiple simultaneous refresh calls
let refreshPromise: Promise<string | null> | null = null;

function getRefreshedToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return Promise.resolve(null);
  if (!refreshPromise) {
    refreshPromise = user.getIdToken(true).then((token) => {
      refreshPromise = null;
      return token;
    }).catch(() => {
      refreshPromise = null;
      return null;
    });
  }
  return refreshPromise;
}

// Response interceptor - On 401: refresh token and retry once; else redirect to login
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Already retried once
    if (originalRequest._retry === true) {
      clearSessionExpiry();
      try {
        await firebaseLogout();
      } catch (_) {}
      localStorage.removeItem('authToken');
      const path = typeof window !== 'undefined' ? window.location.pathname : '';
      const loginPath = path.startsWith('/admin') ? '/admin/login' : '/login';
      window.location.href = `${loginPath}?redirect=${encodeURIComponent(path || '/')}`;
      return Promise.reject(error);
    }

    const token = await getRefreshedToken();
    if (token) {
      originalRequest._retry = true;
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return api.request(originalRequest);
    }

    // Refresh failed (e.g. token revoked, user signed out elsewhere)
    clearSessionExpiry();
    try {
      await firebaseLogout();
    } catch (_) {}
    localStorage.removeItem('authToken');
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    const loginPath = path.startsWith('/admin') ? '/admin/login' : '/login';
    window.location.href = `${loginPath}?redirect=${encodeURIComponent(path || '/')}`;
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    dateOfBirth: string;
  }) => api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  logout: () => api.post('/auth/logout'),

  getMe: () => api.get('/auth/me'),

  updateProfile: (data: any) => api.put('/auth/profile', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
};

// สินค้าพิเศษ API
export const lottoAPI = {
  getJackpots: () => api.get('/lotto/jackpots'),

  getGameRules: () => api.get('/lotto/games'),

  createOrder: (data: { tickets: any[]; location?: any }) =>
    api.post('/lotto/orders', data),

  getUserOrders: () => api.get('/lotto/orders'),

  getOrder: (id: string) => api.get(`/lotto/orders/${id}`),

  cancelOrder: (id: string) => api.put(`/lotto/orders/${id}/cancel`),

  /** Admin: update lotto order status (writes to Firestore so customer sees it) */
  updateOrderStatus: (id: string, data: { status: string; statusHistory?: Array<{ status: string; changedAt: string; changedBy?: string; note?: string }> }) =>
    api.put(`/lotto/orders/${id}/status`, data),

  getUserTickets: () => api.get('/lotto/tickets'),

  getTicket: (id: string) => api.get(`/lotto/tickets/${id}`),

  quickPick: (gameType: string) =>
    api.post('/lotto/quick-pick', { gameType }),

  getDrawHistory: (params?: { gameType?: string; limit?: number }) =>
    api.get('/lotto/draws/history', { params }),

  getDrawResult: (gameType: string, date: string) =>
    api.get(`/lotto/draws/${gameType}/${date}`),
};

// Payment API
export const paymentAPI = {
  createIntent: (data: {
    amount: number;
    currency?: string;
    paymentMethod: string;
  }) => api.post('/payments/create-intent', data),

  confirmPayment: (data: { paymentId: string; paymentIntentId: string }) =>
    api.post('/payments/confirm', data),

  generatePromptPayQR: (data: { orderId: string; orderType: string }) =>
    api.post('/payments/promptpay', data),

  getPaymentStatus: (id: string) => api.get(`/payments/${id}/status`),
  
  getPaymentIntentStatus: (paymentIntentId: string) => 
    api.get(`/payments/intent/${paymentIntentId}/status`),
  
  // Stripe Checkout Session API (Flow 2: Auto)
  createCheckoutSession: async (data: {
    items: Array<{
      name: string;
      price: number;
      quantity: number;
      description?: string;
      image?: string;
    }>;
    total: number;
    orderId: string;
    successUrl: string;
    cancelUrl: string;
    customerEmail?: string;
    isLotto?: boolean;
  }) => {
    const response = await api.post('/payments/create-checkout-session', data);
    return response.data;
  },
  
  verifyCheckoutSession: async (sessionId: string) => {
    const response = await api.get(`/payments/verify-session/${sessionId}`);
    return response.data;
  },
};

// Admin Payment API (for admin panel - Stripe status check)
export const adminPaymentAPI = {
  getPaymentIntentStatus: (paymentIntentId: string) =>
    api.get(`/admin/payment-intent/${paymentIntentId}/status`),
};

// Admin Users API (Super Admin - กำหนด role, รหัสผ่าน)
export const adminUsersAPI = {
  updateUserRole: (userId: string, role: string) =>
    api.put(`/admin/users/${userId}/role`, { role }),
  updateUserPassword: (userId: string, password: string) =>
    api.put(`/admin/users/${userId}/password`, { password }),
  createAdminUser: (data: { email: string; password: string; name?: string; role?: string }) =>
    api.post('/admin/users/create', data),
  getLogs: () => api.get('/admin/logs'),
  logActivity: (data: { action?: string; path?: string; details?: Record<string, unknown> }) =>
    api.post('/admin/log-activity', data),
};

// Billing API
export const billingAPI = {
  generatePDF: (data: {
    data: {
      documentNo: string;
      date: string;
      ref?: string;
      customerName: string;
      customerAddress: string;
      customerTaxId?: string;
      items: Array<{
        description: string;
        quantity?: number;
        amountUSD: number;
        amountTHB: number;
      }>;
      exchangeRate?: number;
    };
    company?: {
      sellerName: string;
      address: string;
      taxId: string;
    };
    type: 'receipt' | 'invoice' | 'tax-invoice';
  }) => api.post('/billing/generate', data, { responseType: 'blob' }),
};

export default api;
