import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useState } from 'react';
import { useConfigStore } from './stores/configStore';
import AppLayout from './components/layout/AppLayout';
import { Spinner } from './components/ui/Spinner';
import ErrorBoundary from './components/ui/ErrorBoundary';
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
  // 直接选择反应式值，避免选择函数引用导致不重新渲染
  const apiKey = useConfigStore(s => s.localApi.apiKey);
  const isLoggedIn = useConfigStore(s => s.serverApi.isLoggedIn);
  const apiVerified = useConfigStore(s => s.apiVerified);

  // 检查是否已配置（服务器已登录 或 本地API已验证通过）
  const canAccess = isLoggedIn || apiVerified;

  // 手动关闭弹窗状态：用户点击 X / 遮罩时临时隐藏弹窗
  const [dismissed, setDismissed] = useState(false);
  // 弹窗在以下情况显示：无Key且未登录，或Key已填但未测试
  const showConfigModal = !canAccess && !dismissed;

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

          {/* 主应用路由（带侧边栏布局 + 错误边界） */}
          <Route element={<AppLayout />}>
            <Route index element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
            <Route path="workspace" element={<ErrorBoundary><WorkspacePage /></ErrorBoundary>} />
            <Route path="history" element={<ErrorBoundary><HistoryPage /></ErrorBoundary>} />
            <Route path="knowledge" element={<ErrorBoundary><KnowledgeBasePage /></ErrorBoundary>} />
            <Route path="settings" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
            <Route path="contact" element={<ErrorBoundary><ContactPage /></ErrorBoundary>} />
          </Route>

          {/* 未匹配路由重定向 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {/* 未配置弹窗：X按钮 + 点击遮罩均可关闭 */}
      {showConfigModal && (
        <Modal
          open={true}
          onClose={() => setDismissed(true)}
          title="欢迎使用面试大师"
          showClose={true}
        >
          <div className="space-y-4 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              请先配置 API 信息并测试连接，确保一切就绪后再开始使用
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              ⚠️ 配置完成后请在设置页面测试 API 连通性，测试通过即可关闭本窗口
            </p>
            <ApiConfigForm
              mode="dialog"
              onSaved={() => setDismissed(true)}
            />
          </div>
        </Modal>
      )}
    </>
  );
}

export default App;
