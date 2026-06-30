import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { useConfigStore } from '../../stores/configStore';
import { useSessionStore } from '../../stores/sessionStore';
import TitleBar from './TitleBar';
import {
  Home,
  MessageSquare,
  History,
  BookOpen,
  Settings,
  Mail,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Wifi,
  WifiOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

const navigation = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/workspace', icon: MessageSquare, label: '工作台' },
  { path: '/history', icon: History, label: '历史记录' },
  { path: '/knowledge', icon: BookOpen, label: '知识库' },
  { path: '/settings', icon: Settings, label: '设置' },
  { path: '/contact', icon: Mail, label: '联系我们' },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const { theme, setTheme, apiMode, serverApi, clearServerSession, setApiMode, localApi, apiVerified } = useConfigStore();
  const isActive = useSessionStore((s) => s.isActive);
  const [checking, setChecking] = useState(false);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const current = themes.indexOf(theme);
    setTheme(themes[(current + 1) % themes.length]);
  };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  // 验证服务器连接
  const checkServerConnection = async () => {
    if (apiMode !== 'server') return;
    setChecking(true);
    try {
      const resp = await fetch(`${serverApi.baseUrl}/health`, { signal: AbortSignal.timeout(3000) });
      setServerOnline(resp.ok);
    } catch {
      setServerOnline(false);
    } finally {
      setChecking(false);
      setTimeout(() => setServerOnline(null), 5000);
    }
  };

  // 登出
  const handleLogout = () => {
    clearServerSession();
    setApiMode('local');
    navigate('/');
  };

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      <TitleBar />

      <div className="flex flex-1 overflow-hidden">
        {/* 侧边栏 */}
        <aside className="w-56 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col">
          {/* Logo */}
          <div className="h-14 flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              面试大师
            </span>
          </div>

          {/* 导航链接 */}
          <nav className="flex-1 py-3 space-y-0.5 px-2">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive: linkActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    linkActive
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* 底部信息 */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
            {/* API 激活状态 */}
            <div
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm"
              title={
                apiVerified
                  ? 'API 已通过连通性测试'
                  : localApi.apiKey
                    ? 'API 已配置但未测试，建议前往设置页测试连接'
                    : '未配置 API Key，请前往设置页配置'
              }
            >
              {apiVerified ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : localApi.apiKey ? (
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              ) : (
                <HelpCircle className="w-4 h-4 text-gray-400" />
              )}
              <span className={cn(
                'text-xs truncate',
                apiVerified
                  ? 'text-green-600 dark:text-green-400'
                  : localApi.apiKey
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-gray-400',
              )}>
                {apiVerified
                  ? 'API 已激活'
                  : localApi.apiKey
                    ? 'API 待测试'
                    : 'API 未配置'}
              </span>
            </div>

            {/* 服务器连接状态 */}
            {apiMode === 'server' && (
              <button
                onClick={checkServerConnection}
                disabled={checking}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="点击验证服务器连接"
              >
                {checking ? (
                  <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
                ) : serverOnline === true ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : serverOnline === false ? (
                  <WifiOff className="w-4 h-4 text-red-500" />
                ) : (
                  <Wifi className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-xs truncate">
                  {checking
                    ? '检测中...'
                    : serverOnline === true
                    ? '服务器在线'
                    : serverOnline === false
                    ? '服务器离线'
                    : serverApi.isLoggedIn
                    ? `已连接 (${serverApi.user?.username})`
                    : serverApi.baseUrl}
                </span>
              </button>
            )}

            {/* 主题切换 */}
            <button
              onClick={cycleTheme}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ThemeIcon className="w-4 h-4" />
              <span>{theme === 'system' ? '跟随系统' : theme === 'dark' ? '深色' : '浅色'}</span>
            </button>

            {/* 登出（服务器模式） */}
            {serverApi.isLoggedIn && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="w-4 h-4" />
                <span>登出</span>
              </button>
            )}
          </div>
        </aside>

        {/* 主内容区域 */}
        <main className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
