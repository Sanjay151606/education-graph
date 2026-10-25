import axios from 'axios';
import { supabase } from '../api/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for JWT
api.interceptors.request.use(
  async (config) => {
    let token = localStorage.getItem('token');
    if (!token) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          token = session.access_token;
          localStorage.setItem('token', token);
        }
      } catch (err) {
        // ignore
      }
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unauthorized redirection
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  getMe: () => api.get('/api/auth/me'),
  updateProfile: (data) => api.patch('/api/auth/me', data),
};

// Tasks API
export const tasksApi = {
  getAll: () => api.get('/api/tasks'),
  getById: (id) => api.get(`/api/tasks/${id}`),
  create: (data) => api.post('/api/tasks', data),
  update: (id, data) => api.patch(`/api/tasks/${id}`, data),
  delete: (id) => api.delete(`/api/tasks/${id}`),
  breakdown: (id) => api.post(`/api/tasks/${id}/breakdown`),
  addSubtask: (taskId, data) => api.post(`/api/tasks/${taskId}/subtasks`, data),
  updateSubtask: (subtaskId, data) => api.patch(`/api/tasks/subtasks/${subtaskId}`, data),
  deleteSubtask: (subtaskId) => api.delete(`/api/tasks/subtasks/${subtaskId}`),
};

// Study Materials API
export const studyMaterialsApi = {
  getAll: () => api.get('/api/study-materials'),
  getById: (id) => api.get(`/api/study-materials/${id}`),
  simplify: (data) => api.post('/api/study-materials/simplify', data),
  delete: (id) => api.delete(`/api/study-materials/${id}`),
  reviewFlashcard: (cardId, data) => api.patch(`/api/study-materials/flashcards/${cardId}/review`, data),
};

// Focus Sessions API (Task 1)
export const focusSessionsApi = {
  create: (data) => api.post('/api/focus-sessions', data),
  update: (id, data) => api.patch(`/api/focus-sessions/${id}`, data),
  getAll: (limit = 20) => api.get(`/api/focus-sessions?limit=${limit}`),
  getById: (id) => api.get(`/api/focus-sessions/${id}`),
};

// AI Recommendations & Feedback API
export const aiApi = {
  getFocusFeedback: (sessionId) => api.get(`/api/ai/focus-session/${sessionId}/feedback`),
  getRecommendations: () => api.get('/api/ai/recommendations'),
};

// Progress API
export const progressApi = {
  getSummary: (days = 7) => api.get(`/api/progress/summary?days=${days}`),
  getLogs: (limit = 14) => api.get(`/api/progress/logs?limit=${limit}`),
};

// Assessment API (4-Section Assessment Module)
export const assessmentApi = {
  start: (data) => api.post('/api/assessment/start', data || {}),
  getSection: (sessionId, section) => api.get(`/api/assessment/${sessionId}/section/${section}`),
  respond: (sessionId, data) => api.post(`/api/assessment/${sessionId}/respond`, data),
  uploadAudio: (sessionId, formData) =>
    api.post(`/api/assessment/${sessionId}/upload-audio`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  recordTabSwitch: (sessionId, data = { reason: 'Tab switch detected' }) =>
    api.post(`/api/assessment/${sessionId}/tab-switch`, data),
  complete: (sessionId) => api.post(`/api/assessment/${sessionId}/complete`),
  getResults: (sessionId) => api.get(`/api/assessment/${sessionId}/results`),
  getHistory: () => api.get('/api/assessment/history'),
};


export default api;


