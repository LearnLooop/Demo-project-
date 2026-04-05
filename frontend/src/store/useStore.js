import { create } from 'zustand';
import { authAPI, usersAPI } from '../services/api';

// Load persisted auth state
const loadAuthState = () => {
  const token = localStorage.getItem('access_token');
  const user = localStorage.getItem('user');
  if (token && user) {
    try {
      return { user: JSON.parse(user), isAuthenticated: true };
    } catch (e) {
      return { user: null, isAuthenticated: false };
    }
  }
  return { user: null, isAuthenticated: false };
};

const persistedAuth = loadAuthState();

const useStore = create((set, get) => ({
  // ---------- Auth ----------
  user: persistedAuth.user,
  isAuthenticated: persistedAuth.isAuthenticated,
  authLoading: false,
  authError: null,
  
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  register: async (email, password, name, role) => {
    set({ authLoading: true, authError: null });
    try {
      await authAPI.register(email, password, name, role);
      // Immediately log in upon successful registration
      return await get().login(email, password);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Registration failed';
      set({ authLoading: false, authError: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  login: async (email, password) => {
    set({ authLoading: true, authError: null });
    try {
      const data = await authAPI.login(email, password);
      
      // Store tokens
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      
      // Get user info
      const userInfo = await authAPI.getMe();
      localStorage.setItem('user', JSON.stringify(userInfo));
      
      set({ 
        user: userInfo, 
        isAuthenticated: true, 
        authLoading: false,
        authError: null
      });
      
      return { success: true, role: userInfo.role };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Invalid credentials';
      set({ authLoading: false, authError: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },

  initAuth: async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const userInfo = await authAPI.getMe();
        localStorage.setItem('user', JSON.stringify(userInfo));
        set({ user: userInfo, isAuthenticated: true });
      } catch (error) {
        // Token invalid, clear auth
        get().logout();
      }
    }
  },

  // ---------- UI ----------
  theme: localStorage.getItem('theme') || 'theme-minimal',
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
    document.body.setAttribute('data-theme', theme);
  },
  sidebarOpen: false,
  isSidebarOpen: false,
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen, isSidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false, isSidebarOpen: false }),

  // ---------- Confetti ----------
  showConfetti: false,
  triggerConfetti: () => {
    set({ showConfetti: true });
    setTimeout(() => set({ showConfetti: false }), 5000);
  },

  // ---------- Quiz ----------
  quizState: {
    active: false,
    quizId: null,
    currentIndex: 0,
    answers: {},
    submitted: false,
    score: null,
    startTime: null,
  },

  startQuiz: (quizId) => set({
    quizState: { active: true, quizId, currentIndex: 0, answers: {}, submitted: false, score: null, startTime: Date.now() }
  }),

  answerQuestion: (qIndex, optionIndex) => set(s => ({
    quizState: {
      ...s.quizState,
      answers: { ...s.quizState.answers, [qIndex]: optionIndex }
    }
  })),

  nextQuestion: () => set(s => ({
    quizState: { ...s.quizState, currentIndex: s.quizState.currentIndex + 1 }
  })),

  prevQuestion: () => set(s => ({
    quizState: { ...s.quizState, currentIndex: Math.max(0, s.quizState.currentIndex - 1) }
  })),

  submitQuiz: async (quizId, answers, timeTaken) => {
    const { quizzesAPI } = await import('../services/api');
    try {
      const result = await quizzesAPI.submit(quizId, answers, timeTaken);
      set(s => ({ quizState: { ...s.quizState, submitted: true, score: result.score } }));
      
      // Trigger confetti for high scores
      if (result.score >= 80) {
        get().triggerConfetti();
      }
      
      return result.score;
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      // Fallback to local calculation
      return null;
    }
  },

  resetQuiz: () => set({
    quizState: { active: false, quizId: null, currentIndex: 0, answers: {}, submitted: false, score: null, startTime: null }
  }),
}));

export default useStore;
