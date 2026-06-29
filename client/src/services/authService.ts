import { api } from './api';
import type { IUser } from '@shared/types';

interface LoginResponse {
  token: string;
  user: IUser;
}

interface RegisterResponse {
  id: string;
  username: string;
  email: string;
}

export const authService = {
  /** 登录 — 服务端期望 { username, password }，返回 { token, user } */
  async login(
    username: string,
    password: string,
  ): Promise<LoginResponse> {
    const { data } = await api.post('/auth/login', { username, password });
    if (data.code !== 0) {
      throw new Error(data.message || '登录失败');
    }
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
    if (data.code !== 0) {
      throw new Error(data.message || '注册失败');
    }
    return data.data;
  },

  async refreshToken(refreshToken: string): Promise<{ token: string }> {
    const { data } = await api.post('/auth/refresh', { refreshToken });
    return data.data;
  },

  async getMe(): Promise<IUser> {
    const { data } = await api.get('/auth/me');
    return data.data;
  },
};
