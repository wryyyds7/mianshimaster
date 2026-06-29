import apiClient from './api';
import type { IKnowledgeItem, ApiResponse } from '@shared/types';

interface CreateKnowledgeDTO {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
}

class KnowledgeService {
  // 获取知识库列表
  async getItems(params?: { category?: string; search?: string }): Promise<IKnowledgeItem[]> {
    const res = await apiClient.get<ApiResponse<IKnowledgeItem[]>>('/api/knowledge', { params });
    return res.data.data;
  }

  // 获取单条知识
  async getItem(id: string): Promise<IKnowledgeItem> {
    const res = await apiClient.get<ApiResponse<IKnowledgeItem>>(`/api/knowledge/${id}`);
    return res.data.data;
  }

  // 创建知识条目
  async createItem(data: CreateKnowledgeDTO): Promise<IKnowledgeItem> {
    const res = await apiClient.post<ApiResponse<IKnowledgeItem>>('/api/knowledge', data);
    return res.data.data;
  }

  // 更新知识条目
  async updateItem(id: string, data: Partial<CreateKnowledgeDTO>): Promise<IKnowledgeItem> {
    const res = await apiClient.put<ApiResponse<IKnowledgeItem>>(`/api/knowledge/${id}`, data);
    return res.data.data;
  }

  // 删除知识条目
  async deleteItem(id: string): Promise<void> {
    await apiClient.delete(`/api/knowledge/${id}`);
  }

  // 搜索
  async search(query: string): Promise<IKnowledgeItem[]> {
    const res = await apiClient.get<ApiResponse<IKnowledgeItem[]>>('/api/knowledge/search', {
      params: { q: query },
    });
    return res.data.data;
  }
}

export const knowledgeService = new KnowledgeService();
