import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useConfigStore } from '../stores/configStore';
import { authService } from '../services/authService';
import { LogIn, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setServerToken, updateLocalApiConfig, serverApi } = useConfigStore();
  const [mode, setMode] = useState<'login' | 'api'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1');
  const [serverUrl, setServerUrl] = useState(serverApi.baseUrl);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleServerLogin = async () => {
    setError('');
    setLoading(true);
    try {
      // 先更新服务器地址
      updateLocalApiConfig({}); // 确保serverApi.baseUrl被更新
      const res = await authService.login(username, password);
      setServerToken(res.accessToken, res.user);
      navigate('/');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '登录失败，请检查用户名和密码';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleApiConfig = () => {
    setError('');
    if (!apiKey.trim()) {
      setError('请输入API Key');
      return;
    }
    updateLocalApiConfig({
      provider: 'openai',
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim() || 'https://api.openai.com/v1',
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 4096,
    });
    navigate('/');
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            面试大师
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">登录或配置API开始使用</p>
        </div>

        {/* 模式切换 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'login'
                  ? 'bg-white dark:bg-gray-600 text-indigo-600 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              服务器登录
            </button>
            <button
              onClick={() => setMode('api')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'api'
                  ? 'bg-white dark:bg-gray-600 text-indigo-600 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              API配置
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <div className="space-y-4">
              <Input
                label="用户名"
                placeholder="输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Input
                label="密码"
                type="password"
                placeholder="输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Input
                label="服务器地址"
                placeholder="http://localhost:3001"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
              />
              <Button
                className="w-full"
                onClick={handleServerLogin}
                disabled={!username || !password || loading}
                isLoading={loading}
              >
                <LogIn className="w-4 h-4 mr-2" />
                {loading ? '登录中...' : '登录'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                label="API Key"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <Input
                label="Base URL (可选)"
                placeholder="https://api.openai.com/v1"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
              <Button
                className="w-full"
                onClick={handleApiConfig}
                disabled={!apiKey}
              >
                保存并开始
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
