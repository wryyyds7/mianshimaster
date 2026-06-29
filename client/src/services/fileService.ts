import { api } from './api';

export const fileService = {
  /**
   * 上传文件并获取解析后的文本内容
   */
  async upload(file: File): Promise<{
    id: string;
    fileName: string;
    fileSize: number;
    contentText: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  /**
   * 获取已上传文件的内容
   */
  async getContent(fileId: string): Promise<{
    id: string;
    fileName: string;
    contentText: string;
  }> {
    const { data } = await api.get(`/files/${fileId}/content`);
    return data.data;
  },

  /**
   * 删除已上传的文件
   */
  async remove(fileId: string): Promise<void> {
    await api.delete(`/files/${fileId}`);
  },
};
