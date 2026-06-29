import { api } from './api';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

interface RegisterResponse {
  id: string;
  username: string;
  email: string;
}

export const authService = {
  async login(
    email: string,
    password: string,
  ): Promise<LoginResponse> {
    const { data } = await api.post('/auth/login', { email, password });
    return data.data;
  },

  async register(
    username: string,
    email: string,
    password: string,
  ): Promise<RegisterResponse> {
    const { data } = await api.post('/auth/register', {
      username,
      email,
      password,
    });
    return data.data;
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const { data } = await api.post('/auth/refresh', { refreshToken });
    return data.data;
  },

  async getMe(): Promise<LoginResponse['user']> {
    const { data } = await api.get('/auth/me');
    return data.data;
  },
};
