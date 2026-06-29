import apiClient from './api';
import type { ISession, IQuestion, ApiResponse } from '@shared/types';

class SessionService {
  // 创建会话
  async createSession(title: string): Promise<ISession> {
    // 本地模式存SQLite，服务器模式调API
    const { apiMode } = (await import('../stores/configStore')).useConfigStore.getState();

    if (apiMode === 'local') {
      // 使用Electron IPC操作本地SQLite
      const { v4: uuidv4 } = await import('uuid');
      const session: ISession = {
        id: uuidv4(),
        userId: 'local-user',
        title,
        status: 'ACTIVE',
        startedAt: new Date().toISOString(),
        endedAt: null,
        createdAt: new Date().toISOString(),
        backgroundFiles: [],
        questions: [],
      };

      // TODO: 通过IPC存入本地SQLite
      // await window.electronAPI.db.execute(
      //   'INSERT INTO local_sessions (id, title, status, started_at) VALUES (?, ?, ?, ?)',
      //   [session.id, session.title, session.status, session.startedAt]
      // );

      return session;
    } else {
      const res = await apiClient.post<ApiResponse<ISession>>('/api/sessions', { title });
      return res.data.data;
    }
  }

  // 获取会话列表
  async getSessions(): Promise<ISession[]> {
    const res = await apiClient.get<ApiResponse<ISession[]>>('/api/sessions');
    return res.data.data;
  }

  // 获取会话详情
  async getSession(id: string): Promise<ISession> {
    const res = await apiClient.get<ApiResponse<ISession>>(`/api/sessions/${id}`);
    return res.data.data;
  }

  // 结束会话
  async endSession(id: string): Promise<void> {
    await apiClient.put(`/api/sessions/${id}/end`);
  }

  // 删除会话
  async deleteSession(id: string): Promise<void> {
    await apiClient.delete(`/api/sessions/${id}`);
  }
}

export const sessionService = new SessionService();
