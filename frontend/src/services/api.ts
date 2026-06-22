import axios from 'axios';

const stripTrailingSlash = (url: string) => url.replace(/\/+$/, '');

export const API_URL = stripTrailingSlash(
  import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api',
);
export const SOCKET_URL = stripTrailingSlash(
  import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3001',
);

const TOKEN_KEY = 'renacer_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      tokenStore.clear();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
