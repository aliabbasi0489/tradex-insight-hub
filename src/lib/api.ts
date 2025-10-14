import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface StockData {
  ticker: string;
  name: string;
  current_price: number;
  percent_change: number;
  market_cap: number;
  chart_data?: Array<{ time: string; price: number }>;
}

export interface RecommendationRequest {
  risk_level: 'Low' | 'Medium' | 'High';
  investment_horizon: 'Short' | 'Long';
  sectors?: string[];
}

export interface StockRecommendation {
  ticker: string;
  name: string;
  current_price: number;
  forecast_score: number;
  chart_data?: Array<{ time: string; price: number }>;
}

export interface PredictionRequest {
  ticker: string;
  period: 'Days' | 'Weeks' | 'Seasons' | 'Occasions';
}

export interface PredictionResponse {
  ticker: string;
  forecast_data: Array<{ time: string; predicted_price: number }>;
}

export interface AlertRequest {
  ticker: string;
  trigger_type: 'price' | 'date' | 'event';
  trigger_value: string;
  notification_method: 'Gmail' | 'WhatsApp';
}

export interface ChatMessage {
  message: string;
}

export interface ChatResponse {
  response: string;
}

// API functions
export const apiService = {
  // Authentication
  login: async (email: string, password: string) => {
    const response = await api.post('/api/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    return response.data;
  },

  register: async (email: string, password: string) => {
    const response = await api.post('/api/register', { email, password });
    return response.data;
  },

  // Stock data
  getLiveStock: async (ticker: string): Promise<StockData> => {
    const response = await api.get(`/api/live_stock?ticker=${ticker}`);
    return response.data;
  },

  // Recommendations
  getRecommendations: async (request: RecommendationRequest): Promise<StockRecommendation[]> => {
    const response = await api.post('/api/recommendations', request);
    return response.data;
  },

  // Predictions
  getPrediction: async (ticker: string, period: string): Promise<PredictionResponse> => {
    const response = await api.get(`/api/predict_stock?ticker=${ticker}&period=${period}`);
    return response.data;
  },

  // Alerts
  createAlert: async (alert: AlertRequest) => {
    const response = await api.post('/api/alerts', alert);
    return response.data;
  },

  // Chatbot
  sendChatMessage: async (message: string): Promise<ChatResponse> => {
    const response = await api.post('/api/chatbot_response', { message });
    return response.data;
  },

  // Dashboard
  getSavedStocks: async () => {
    const response = await api.get('/api/my_dashboard');
    return response.data;
  },

  saveStock: async (ticker: string) => {
    const response = await api.post('/api/saved_stocks', { ticker });
    return response.data;
  },

  removeSavedStock: async (ticker: string) => {
    const response = await api.delete(`/api/saved_stocks?ticker=${ticker}`);
    return response.data;
  },
};

export default api;
