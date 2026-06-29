import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { useConfigStore } from '../stores/configStore';

// 创建Axios实例
const apiClient: AxiosInstance = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use((config) => {
  const { apiMode, localApi, serverApi } = useConfigStore.getState();

  if (apiMode === 'server') {
    // 服务器模式：设置baseURL和JWT
    config.baseURL = serverApi.baseUrl;
    if (serverApi.token) {
      config.headers.Authorization = `Bearer ${serverApi.token}`;
    }
  } else {
    // 本地模式：直接调用AI API
    config.baseURL = localApi.baseUrl;
    if (localApi.apiKey) {
      config.headers.Authorization = `Bearer ${localApi.apiKey}`;
    }
  }

  return config;
});

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token过期，清除登录状态
      useConfigStore.getState().clearServerSession();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
export { apiClient as api };
