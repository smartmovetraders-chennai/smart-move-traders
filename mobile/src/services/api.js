/**
 * api.js
 * Axios API client for Smart Move Traders mobile application.
 * Automatically resolves the computer's IP address so physical phones can connect seamlessly.
 */

import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

function detectDefaultHost() {
  if (Platform.OS === 'web') {
    return 'http://localhost:4000';
  }

  // Automatically detect host IP from Expo Go bundler
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoClient?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:4000`;
    }
  }

  // Local Wi-Fi IP address of the development machine
  return 'http://192.168.0.103:4000';
}

const DEFAULT_HOST = detectDefaultHost();
let currentBaseUrl = `${DEFAULT_HOST}/api`;

const apiClient = axios.create({
  baseURL: currentBaseUrl,
  timeout: 10000,
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
