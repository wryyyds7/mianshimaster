import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
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
  const { theme, setTheme } = useConfigStore();
  const isActive = useSessionStore((s) => s.isActive);

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const current = themes.indexOf(theme);
    setTheme(themes[(current + 1) % themes.length]);
  };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

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
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={cycleTheme}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ThemeIcon className="w-4 h-4" />
              <span>{theme === 'system' ? '跟随系统' : theme === 'dark' ? '深色' : '浅色'}</span>
            </button>
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
