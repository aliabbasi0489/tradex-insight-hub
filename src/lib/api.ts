import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 5 second timeout
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

// Mock data generator
const generateMockStockData = (ticker: string): StockData => ({
  ticker: ticker.toUpperCase(),
  name: `${ticker.toUpperCase()} Corporation`,
  current_price: Math.random() * 500 + 50,
  percent_change: (Math.random() - 0.5) * 10,
  market_cap: Math.random() * 1000000000000,
  chart_data: Array.from({ length: 20 }, (_, i) => ({
    time: `${9 + Math.floor(i / 4)}:${(i % 4) * 15 || '00'}`,
    price: Math.random() * 500 + 50
  }))
});

// API functions
export const apiService = {
  // Authentication
  login: async (email: string, password: string) => {
    if (DEMO_MODE) {
      // Demo mode - simulate successful login
      const mockToken = 'demo_token_' + Date.now();
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('demo_user', email);
      return { token: mockToken, email };
    }

    try {
      const response = await api.post('/api/login', { email, password });
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        // Fallback to demo mode
        const mockToken = 'demo_token_' + Date.now();
        localStorage.setItem('auth_token', mockToken);
        localStorage.setItem('demo_user', email);
        return { token: mockToken, email };
      }
      throw error;
    }
  },

  register: async (email: string, password: string) => {
    if (DEMO_MODE) {
      // Demo mode - simulate successful registration
      localStorage.setItem('demo_user', email);
      return { message: 'User registered successfully (Demo Mode)' };
    }

    try {
      const response = await api.post('/api/register', { email, password });
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        // Fallback to demo mode
        localStorage.setItem('demo_user', email);
        return { message: 'User registered successfully (Demo Mode)' };
      }
      throw error;
    }
  },

  // Stock data
  getLiveStock: async (ticker: string): Promise<StockData> => {
    if (DEMO_MODE) {
      return generateMockStockData(ticker);
    }

    try {
      const response = await api.get(`/api/live_stock?ticker=${ticker}`);
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        return generateMockStockData(ticker);
      }
      throw error;
    }
  },

  // Recommendations
  getRecommendations: async (request: RecommendationRequest): Promise<StockRecommendation[]> => {
    if (DEMO_MODE) {
      const tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
      return tickers.map(ticker => ({
        ticker,
        name: `${ticker} Corporation`,
        current_price: Math.random() * 500 + 50,
        forecast_score: Math.random() * 100,
        chart_data: Array.from({ length: 10 }, (_, i) => ({
          time: `${9 + i}:00`,
          price: Math.random() * 500 + 50
        }))
      }));
    }

    try {
      const response = await api.post('/api/recommendations', request);
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        const tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
        return tickers.map(ticker => ({
          ticker,
          name: `${ticker} Corporation`,
          current_price: Math.random() * 500 + 50,
          forecast_score: Math.random() * 100,
          chart_data: Array.from({ length: 10 }, (_, i) => ({
            time: `${9 + i}:00`,
            price: Math.random() * 500 + 50
          }))
        }));
      }
      throw error;
    }
  },

  // Predictions
  getPrediction: async (ticker: string, period: string): Promise<PredictionResponse> => {
    if (DEMO_MODE) {
      const periods = period === 'Days' ? 30 : period === 'Weeks' ? 12 : 4;
      return {
        ticker: ticker.toUpperCase(),
        forecast_data: Array.from({ length: periods }, (_, i) => ({
          time: `${period} ${i + 1}`,
          predicted_price: Math.random() * 500 + 50
        }))
      };
    }

    try {
      const response = await api.get(`/api/predict_stock?ticker=${ticker}&period=${period}`);
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        const periods = period === 'Days' ? 30 : period === 'Weeks' ? 12 : 4;
        return {
          ticker: ticker.toUpperCase(),
          forecast_data: Array.from({ length: periods }, (_, i) => ({
            time: `${period} ${i + 1}`,
            predicted_price: Math.random() * 500 + 50
          }))
        };
      }
      throw error;
    }
  },

  // Alerts
  createAlert: async (alert: AlertRequest) => {
    if (DEMO_MODE) {
      return { message: 'Alert created successfully (Demo Mode)' };
    }

    try {
      const response = await api.post('/api/alerts', alert);
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        return { message: 'Alert created successfully (Demo Mode)' };
      }
      throw error;
    }
  },

  // Chatbot
  sendChatMessage: async (message: string): Promise<ChatResponse> => {
    if (DEMO_MODE) {
      return {
        response: `This is a demo response. You asked: "${message}". Connect the backend to get real AI-powered insights!`
      };
    }

    try {
      const response = await api.post('/api/chatbot_response', { message });
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        return {
          response: `This is a demo response. You asked: "${message}". Connect the backend to get real AI-powered insights!`
        };
      }
      throw error;
    }
  },

  // Dashboard
  getSavedStocks: async () => {
    if (DEMO_MODE) {
      const saved = JSON.parse(localStorage.getItem('demo_saved_stocks') || '["AAPL", "MSFT"]');
      return {
        saved_stocks: saved.map((ticker: string) => generateMockStockData(ticker)),
        alerts: []
      };
    }

    try {
      const response = await api.get('/api/my_dashboard');
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        const saved = JSON.parse(localStorage.getItem('demo_saved_stocks') || '["AAPL", "MSFT"]');
        return {
          saved_stocks: saved.map((ticker: string) => generateMockStockData(ticker)),
          alerts: []
        };
      }
      throw error;
    }
  },

  saveStock: async (ticker: string) => {
    if (DEMO_MODE) {
      const saved = JSON.parse(localStorage.getItem('demo_saved_stocks') || '[]');
      if (!saved.includes(ticker)) {
        saved.push(ticker);
        localStorage.setItem('demo_saved_stocks', JSON.stringify(saved));
      }
      return { message: 'Stock saved successfully (Demo Mode)' };
    }

    try {
      const response = await api.post('/api/saved_stocks', { ticker });
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        const saved = JSON.parse(localStorage.getItem('demo_saved_stocks') || '[]');
        if (!saved.includes(ticker)) {
          saved.push(ticker);
          localStorage.setItem('demo_saved_stocks', JSON.stringify(saved));
        }
        return { message: 'Stock saved successfully (Demo Mode)' };
      }
      throw error;
    }
  },

  removeSavedStock: async (ticker: string) => {
    if (DEMO_MODE) {
      const saved = JSON.parse(localStorage.getItem('demo_saved_stocks') || '[]');
      const filtered = saved.filter((t: string) => t !== ticker);
      localStorage.setItem('demo_saved_stocks', JSON.stringify(filtered));
      return { message: 'Stock removed successfully (Demo Mode)' };
    }

    try {
      const response = await api.delete(`/api/saved_stocks?ticker=${ticker}`);
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        const saved = JSON.parse(localStorage.getItem('demo_saved_stocks') || '[]');
        const filtered = saved.filter((t: string) => t !== ticker);
        localStorage.setItem('demo_saved_stocks', JSON.stringify(filtered));
        return { message: 'Stock removed successfully (Demo Mode)' };
      }
      throw error;
    }
  },
};

export default api;
