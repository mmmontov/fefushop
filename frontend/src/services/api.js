import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Создаем экземпляр axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем токен в каждый запрос
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Если данные - это FormData, удаляем Content-Type, чтобы браузер установил его с boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Обработчик ошибок и обновление токена
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/users/token/refresh/`, {
            refresh: refreshToken,
          });
          
          localStorage.setItem('access_token', response.data.access);
          api.defaults.headers.common.Authorization = `Bearer ${response.data.access}`;
          
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

// Экспортируем функции для работы с API
export const authAPI = {
  register: (data) => api.post('/users/register/', data),
  login: (email, password) => api.post('/users/login/', { email, password }),
  getCurrentUser: () => api.get('/users/me/'),
  updateProfile: (data) => api.patch('/users/me/', data),
  getUserById: (id) => api.get(`/users/${id}/`),
};

export const itemsAPI = {
  getItems: (params) => api.get('/items/items/', { params }),
  getItemById: (id) => api.get(`/items/items/${id}/`),
  getMyItems: (status = null) => {
    const params = status ? { status } : {};
    return api.get('/items/items/my_items/', { params });
  },
  getSellerItems: (sellerId) => api.get('/items/items/seller_items/', { params: { seller_id: sellerId } }),
  createItem: (data) => api.post('/items/items/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateItem: (id, data) => api.patch(`/items/items/${id}/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteItem: (id) => api.delete(`/items/items/${id}/`),
  getCategories: () => api.get('/items/categories/'),
};

export const favoritesAPI = {
  getFavorites: () => api.get('/favorites/'),
  addFavorite: (itemId) => api.post('/favorites/', { item_id: itemId }),
  removeFavorite: (id) => api.delete(`/favorites/${id}/`),
};

export const contactsAPI = {
  getContactRequests: () => api.get('/contact-requests/'),
  createContactRequest: (data) => api.post('/contact-requests/', data),
  approveContactRequest: (id) => api.patch(`/contact-requests/${id}/`, { status: 'approved' }),
  declineContactRequest: (id) => api.patch(`/contact-requests/${id}/`, { status: 'declined' }),
  getContacts: () => api.get('/contacts/'),
};

export const reviewsAPI = {
  getReviews: (params) => api.get('/reviews/', { params }),
  getSellerReviews: (sellerId) => api.get(`/reviews/seller/${sellerId}/`),
  getSellerStats: (sellerId) => api.get('/reviews/seller_stats/', { params: { seller_id: sellerId } }),
  createReview: (data) => api.post('/reviews/', data),
  updateReview: (id, data) => api.patch(`/reviews/${id}/`, data),
  deleteReview: (id) => api.delete(`/reviews/${id}/`),
};

export const notificationsAPI = {
  getNotifications: () => api.get('/notifications/'),
  getNotificationById: (id) => api.get(`/notifications/${id}/`),
  markAsRead: (id) => api.post(`/notifications/${id}/mark_read/`),
  markAllAsRead: () => api.post('/notifications/mark_all_read/'),
};
