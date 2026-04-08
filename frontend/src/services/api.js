import axios from 'axios';

// Determine backend URL based on environment
const getBackendURL = () => {
  let envURL = undefined;
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    envURL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_BACKEND_URL;
  }
  
  if (envURL) return envURL;
  
  return ''; // Use relative path to let Vite Proxy handle it
};

const API_URL = getBackendURL();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refresh_token: refreshToken });
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('refresh_token', data.refresh_token);
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    return data;
  },
  register: async (email, password, name, role = 'student') => {
    const { data } = await api.post('/api/auth/register', { email, password, name, role });
    return data;
  },
  getMe: async () => {
    const { data } = await api.get('/api/auth/me');
    return data;
  },
};

// Users API
export const usersAPI = {
  getProfile: async () => {
    const { data } = await api.get('/api/users/profile');
    return data;
  },
  updateProfile: async (updates) => {
    const { data } = await api.put('/api/users/profile', updates);
    return data;
  },
  getSettings: async () => {
    const { data } = await api.get('/api/users/settings');
    return data;
  },
  updateSettings: async (settings) => {
    const { data } = await api.put('/api/users/settings', settings);
    return data;
  },
  changePassword: async (currentPassword, newPassword) => {
    const { data } = await api.put('/api/users/password', { current_password: currentPassword, new_password: newPassword });
    return data;
  },
};

// Courses API
export const coursesAPI = {
  getAll: async (publishedOnly = true) => {
    const { data } = await api.get('/api/courses/', { params: { published_only: publishedOnly } });
    return data;
  },
  getOne: async (courseId) => {
    const { data } = await api.get(`/api/courses/${courseId}`);
    return data;
  },
  create: async (courseData) => {
    const { data } = await api.post('/api/courses/', courseData);
    return data;
  },
  update: async (courseId, updates) => {
    const { data } = await api.put(`/api/courses/${courseId}`, updates);
    return data;
  },
  delete: async (courseId) => {
    const { data } = await api.delete(`/api/courses/${courseId}`);
    return data;
  },
  enroll: async (courseId) => {
    const { data } = await api.post(`/api/courses/${courseId}/enroll`);
    return data;
  },
  completeChapter: async (courseId, chapterId) => {
    const { data } = await api.post(`/api/courses/${courseId}/chapters/${chapterId}/complete`);
    return data;
  },
  rateCourse: async (courseId, rating, review = '') => {
    const { data } = await api.post(`/api/courses/${courseId}/rate`, { rating, review });
    return data;
  },
};

// Quizzes API
export const quizzesAPI = {
  getAvailable: async () => {
    const { data } = await api.get('/api/quizzes/available');
    return data;
  },
  get: async (quizId) => {
    const { data } = await api.get(`/api/quizzes/${quizId}`);
    return data;
  },
  submit: async (quizId, answers, timeTaken) => {
    const { data } = await api.post('/api/quizzes/submit', { quiz_id: quizId, answers, time_taken: timeTaken });
    return data;
  },
  getHistory: async () => {
    const { data } = await api.get('/api/quizzes/results/history');
    return data;
  },
  getResult: async (resultId) => {
    const { data } = await api.get(`/api/quizzes/results/${resultId}`);
    return data;
  },
  generate: async (courseId) => {
    const { data } = await api.post(`/api/quizzes/generate`, { course_id: courseId });
    return data;
  },
};

// Competencies API
export const competenciesAPI = {
  getAll: async () => {
    const { data } = await api.get('/api/competencies/');
    return data;
  },
  update: async (competencyId, mastery) => {
    const { data } = await api.put(`/api/competencies/${competencyId}`, { mastery });
    return data;
  },
};

// Recommendations API
export const recommendationsAPI = {
  getAll: async () => {
    const { data } = await api.get('/api/recommendations/');
    return data;
  },
  refresh: async () => {
    const { data } = await api.post('/api/recommendations/refresh');
    return data;
  },
};

// Students API (Instructor only)
export const studentsAPI = {
  getAll: async (riskFilter, courseId) => {
    const params = {};
    if (riskFilter) params.risk_filter = riskFilter;
    if (courseId) params.course_id = courseId;
    const { data } = await api.get('/api/students/', { params });
    return data;
  },
  getOne: async (studentId) => {
    const { data } = await api.get(`/api/students/${studentId}`);
    return data;
  },
  sendMessage: async (recipientId, subject, message) => {
    const { data } = await api.post('/api/students/message', { recipient_id: recipientId, subject, message });
    return data;
  },
  getAtRisk: async () => {
    const { data } = await api.get('/api/students/at-risk/list');
    return data;
  },
};

// Analytics API
export const analyticsAPI = {
  getOverview: async () => {
    const { data } = await api.get('/api/analytics/overview');
    return data;
  },
  getStudentProgress: async (studentId) => {
    const { data } = await api.get(`/api/analytics/student/${studentId}/progress`);
    return data;
  },
};

// Notifications API
export const notificationsAPI = {
  getAll: async (unreadOnly = false) => {
    const { data } = await api.get('/api/notifications/', { params: { unread_only: unreadOnly } });
    return data;
  },
  markAsRead: async (notificationId) => {
    const { data } = await api.put(`/api/notifications/${notificationId}/read`);
    return data;
  },
  markAllAsRead: async () => {
    const { data } = await api.put('/api/notifications/mark-all-read');
    return data;
  },
  delete: async (notificationId) => {
    const { data } = await api.delete(`/api/notifications/${notificationId}`);
    return data;
  },
};

// Search API
export const searchAPI = {
  search: async (query) => {
    const { data } = await api.get('/api/search/', { params: { q: query } });
    return data;
  },
};

// Chat API
export const chatAPI = {
  askAssistant: async (messages) => {
    const { data } = await api.post('/api/chat/assistant', { messages });
    return data;
  },
};

// Messages API
export const messagesAPI = {
  getContacts: async () => {
    const { data } = await api.get('/api/messages/contacts');
    return data;
  },
  getHistory: async (contactId) => {
    const { data } = await api.get(`/api/messages/history/${contactId}`);
    return data;
  },
  sendMessage: async (recipientId, message) => {
    const { data } = await api.post('/api/messages/send', { recipient_id: recipientId, message });
    return data;
  },
};

export default api;
