import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { MessageSquare, BookOpen, History, Settings, ArrowRight, Wifi } from 'lucide-react';
import { useConfigStore } from '../stores/configStore';
import ApiTestPanel from '../components/settings/ApiTestPanel';

export default function HomePage() {
  const navigate = useNavigate();
  const { apiMode } = useConfigStore();

  const features = [
    {
      icon: MessageSquare,
      title: 'AI 问答工作台',
      desc: '上传背景文件，AI辅助回答。提问者身份绝对隔离。',
      path: '/workspace',
      color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    },
    {
      icon: BookOpen,
      title: '知识库管理',
      desc: '构建个人知识资料库，作为AI回答的上下文参考。',
      path: '/knowledge',
      color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    },
    {
      icon: History,
      title: '历史记录',
      desc: '查看过往会话记录，支持搜索和导出。',
      path: '/history',
      color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    },
    {
      icon: Settings,
      title: '系统设置',
      desc: '配置API、切换模式、自定义偏好。',
      path: '/settings',
      color: 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400',
    },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Hero区域 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            面试大师
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            AI驱动的智能问答助手。确保提问者与回答者身份绝对隔离，
            支持本地API与服务器双模式运行。
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate('/workspace')}>
              <MessageSquare className="w-5 h-5 mr-2" />
              开始回答
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/knowledge')}>
              管理知识库
            </Button>
          </div>
        </div>

        {/* API 测试卡片——醒目入口 */}
        <div className="mb-6 p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl border-2 border-amber-300 dark:border-amber-700 shadow-md">
          <div className="flex items-center gap-2 mb-1">
            <Wifi className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-base font-bold text-amber-800 dark:text-amber-300">
              进行 API 测试
            </h2>
          </div>
          <p className="text-sm text-amber-600 dark:text-amber-400 mb-3">
            在使用前验证 API 连通性，确保 LLM 大模型和 STT 语音识别均可正常调用
          </p>
          <ApiTestPanel className="!border-0 !p-0 !bg-transparent shadow-none" />
        </div>

        {/* 功能卡片 */}
        <div className="grid grid-cols-2 gap-4">
          {features.map((feature) => (
            <button
              key={feature.path}
              onClick={() => navigate(feature.path)}
              className="group p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all text-left"
            >
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-lg ${feature.color}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {feature.desc}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all mt-2" />
              </div>
            </button>
          ))}
        </div>

        {/* 状态指示器 */}
        <div className="mt-8 flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${apiMode === 'local' ? 'bg-green-500' : 'bg-blue-500'}`} />
            <span>当前模式：{apiMode === 'local' ? '本地API' : '服务器API'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
