/**
 * API Service for COPPER PRO using Axios
 * Обращается к бэкенду Express на порту 5000
 */

const API_BASE_URL = 'http://localhost:5000/api';

// Создаем экземпляр axios с базовой конфигурацией
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Добавление токена авторизации при наличии
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('copper_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Экспорт функций API
const API = {
  // Получить категории
  getCategories: async () => {
    try {
      const response = await apiClient.get('/categories');
      return response.data;
    } catch (error) {
      console.warn('API getCategories error, fallback to mock data:', error);
      throw error;
    }
  },

  // Получить товары с возможностью фильтрации
  getProducts: async (params = {}) => {
    try {
      const response = await apiClient.get('/products', { params });
      return response.data;
    } catch (error) {
      console.warn('API getProducts error:', error);
      throw error;
    }
  },

  // Получить один товар
  getProductById: async (id) => {
    try {
      const response = await apiClient.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.warn(`API getProductById(${id}) error:`, error);
      throw error;
    }
  },

  // Получить отзывы ("Что думают о нас")
  getReviews: async () => {
    try {
      const response = await apiClient.get('/reviews');
      return response.data;
    } catch (error) {
      console.warn('API getReviews error:', error);
      throw error;
    }
  },

  // Получить преимущества ("Почему выбирают нас")
  getBenefits: async () => {
    try {
      const response = await apiClient.get('/benefits');
      return response.data;
    } catch (error) {
      console.warn('API getBenefits error:', error);
      throw error;
    }
  },

  // Получить FAQ (Часто задаваемые вопросы)
  getFaq: async () => {
    try {
      const response = await apiClient.get('/faq');
      return response.data;
    } catch (error) {
      console.warn('API getFaq error:', error);
      throw error;
    }
  },

  // Регистрация нового пользователя (POST)
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  // Авторизация пользователя (POST)
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  // Отправка формы обратной связи (POST)
  sendContact: async (messageData) => {
    const response = await apiClient.post('/contact', messageData);
    return response.data;
  },

  // Оформление заказа (POST)
  createOrder: async (orderData) => {
    const response = await apiClient.post('/orders', orderData);
    return response.data;
  },

  // Проверка состояния бэкенда
  checkHealth: async () => {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      return { status: 'offline' };
    }
  }
};

window.CopperAPI = API;
