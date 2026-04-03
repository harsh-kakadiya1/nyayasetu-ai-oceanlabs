// API configuration for local development
const API_BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
  : 'http://localhost:5000';

export const API_ENDPOINTS = {
  base: API_BASE_URL,
  auth: {
    register: `${API_BASE_URL}/api/auth-register`,
    login: `${API_BASE_URL}/api/auth-login`,
    logout: `${API_BASE_URL}/api/auth-logout`,
    me: `${API_BASE_URL}/api/auth-me`,
  },
  documents: {
    upload: `${API_BASE_URL}/api/documents-upload`,
    analyzeText: `${API_BASE_URL}/api/documents-analyze-text`,
  },
  analysis: {
    get: (analysisId: string) => `${API_BASE_URL}/api/analysis?analysisId=${encodeURIComponent(analysisId)}`,
    getMessages: (analysisId: string) => `${API_BASE_URL}/api/analysis-messages?analysisId=${encodeURIComponent(analysisId)}`,
    askQuestion: (analysisId: string) => `${API_BASE_URL}/api/analysis-question?analysisId=${encodeURIComponent(analysisId)}`,
  },
  history: `${API_BASE_URL}/api/history`,
};

export default API_ENDPOINTS;