/**
 * api.js
 * Axios API client for Smart Move Traders mobile application.
 * Connects directly to production Vercel Serverless API (24/7, high speed, free).
 */

import axios from 'axios';
import { Platform } from 'react-native';

// Production Vercel Serverless API host
export const PRODUCTION_HOST = 'https://smart-move-traders.vercel.app';

let currentBaseUrl = `${PRODUCTION_HOST}/api`;

const apiClient = axios.create({
  baseURL: currentBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer dev-token' // Connects directly via DEV mode or Supabase JWT
  }
});

export function setApiBaseUrl(newUrl) {
  let cleaned = (newUrl || '').trim();
  if (cleaned.endsWith('/')) cleaned = cleaned.slice(0, -1);
  if (!cleaned.endsWith('/api')) cleaned = `${cleaned}/api`;
  currentBaseUrl = cleaned;
  apiClient.defaults.baseURL = currentBaseUrl;
}

export function getApiBaseUrl() {
  return currentBaseUrl;
}

export function setAuthToken(token) {
  if (token) {
    apiClient.defaults.headers['Authorization'] = `Bearer ${token}`;
  } else {
    apiClient.defaults.headers['Authorization'] = 'Bearer dev-token';
  }
}

// Invoices
export const getInvoices = (params) => apiClient.get('/invoices', { params });
export const getInvoice = (id) => apiClient.get(`/invoices/${id}`);
export const createInvoice = (data) => apiClient.post('/invoices', data);
export const updateInvoice = (id, data) => apiClient.patch(`/invoices/${id}`, data);
export const deleteInvoice = (id) => apiClient.delete(`/invoices/${id}`);

// Reports
export const getSummaryReport = () => apiClient.get('/reports/summary');
export const getMonthlyReport = () => apiClient.get('/reports/monthly');

// Business Profile
export const getBusinessProfile = () => apiClient.get('/business/profile');
export const updateBusinessProfile = (data) => apiClient.patch('/business/profile', data);

// Health
export const getHealth = () => apiClient.get('/health');

export default apiClient;
