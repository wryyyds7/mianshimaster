import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useState } from 'react';
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
  // 直接选择反应式值，避免选择函数引用导致不重新渲染
  const apiKey = useConfigStore(s => s.localApi.apiKey);
  const isLoggedIn = useConfigStore(s => s.serverApi.isLoggedIn);

  // 检查是否已配置（本地API填写了Key 或 服务器已登录）
  const canAccess = apiKey.length > 0 || isLoggedIn;

  // 手动关闭弹窗状态：用户点击 X / 遮罩时临时隐藏弹窗
  const [dismissed, setDismissed] = useState(false);
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
              请配置 LLM 和语音识别 API 信息（保存后自动关闭）
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
