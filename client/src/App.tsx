import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useConfigStore } from './stores/configStore';
import AppLayout from './components/layout/AppLayout';
import { Spinner } from './components/ui/Spinner';
import Modal from './components/ui/Modal';
import ApiConfigForm from './components/settings/ApiConfigForm';
import LoginPage from './pages/LoginPage';

// 页面懒加载
const HomePage = lazy(() => import('./pages/HomePage'));
const WorkspacePage = lazy(() => import('./pages/WorkspacePage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const KnowledgeBasePage = lazy(() => import('./pages/KnowledgeBasePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));

function App() {
  const { isConfigured, apiMode, serverApi } = useConfigStore();

  // 检查是否已配置（本地API或服务器登录）
  const canAccess = isConfigured() || serverApi.isLoggedIn;

  return (
    <>
      <Suspense fallback={
        <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
          <Spinner size="lg" />
        </div>
      }>
        <Routes>
          {/* 登录页面（独立路由，无边栏） */}
          <Route path="/login" element={<LoginPage />} />

          {/* 主应用路由（带侧边栏布局） */}
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="workspace" element={<WorkspacePage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="knowledge" element={<KnowledgeBasePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="contact" element={<ContactPage />} />
          </Route>

          {/* 未匹配路由重定向 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {/* 未配置弹窗 */}
      {!canAccess && (
        <Modal
          open={true}
          onClose={() => {}}
          title="欢迎使用面试大师"
          showClose={false}
        >
          <div className="space-y-4 p-4">
            <p className="text-gray-600 dark:text-gray-400">
              请配置好您的API信息或者进行登录
            </p>
            <div className="flex gap-3">
              <ApiConfigForm mode="dialog" />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

export default App;
