import axios from 'axios';

export const setupAxiosInterceptors = () => {
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('gnv_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};

export class AuthService {
  private baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

  async login(username: string, passwordPlain: string) {
    const response = await axios.post(`${this.baseURL}/auth/login`, {
      username,
      password: passwordPlain
    });
    
    const data = response.data;
    if (data.token) {
      localStorage.setItem('gnv_token', data.token);
      localStorage.setItem('gnv_user', JSON.stringify(data.user));
    }
    return data;
  }

  logout() {
    localStorage.removeItem('gnv_token');
    localStorage.removeItem('gnv_user');
  }

  getToken() {
    return localStorage.getItem('gnv_token');
  }

  getUser() {
    const userStr = localStorage.getItem('gnv_user');
    return userStr ? JSON.parse(userStr) : null;
  }
}

export const authService = new AuthService();
