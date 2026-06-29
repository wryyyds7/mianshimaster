import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { useConfigStore } from '../stores/configStore';
import { Mail, MessageCircle, ExternalLink, HelpCircle, ChevronDown, Send } from 'lucide-react';

export default function ContactPage() {
  const { apiMode } = useConfigStore();
  const [feedbackType, setFeedbackType] = useState<'BUG' | 'FEATURE' | 'QUESTION' | 'OTHER'>('FEATURE');
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackContact, setFeedbackContact] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const faqs = [
    { q: '如何配置API Key？', a: '进入设置页面，选择"本地API"模式，填入API Key和Base URL即可。' },
    { q: '支持哪些AI模型？', a: '支持OpenAI GPT系列、Claude系列以及任何兼容OpenAI接口的模型。' },
    { q: '背景文件的上下文长度限制？', a: '取决于所选模型的上下文窗口，系统会自动管理Token分配。' },
    { q: '数据存储在哪里？', a: '本地模式数据存储在本地浏览器/Electron中，服务器模式存储在云端PostgreSQL。' },
  ];

  const handleSubmitFeedback = () => {
    if (!feedbackTitle.trim() || !feedbackContent.trim()) return;
    // TODO: 在服务器模式下发送到服务器
    setFeedbackSent(true);
    setFeedbackTitle('');
    setFeedbackContent('');
    setFeedbackContact('');
    setTimeout(() => setFeedbackSent(false), 3000);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">联系我们</h1>

        {/* 联系渠道 */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">联系渠道</h2>
          <div className="grid grid-cols-2 gap-4">
            <a
              href="mailto:support@mianshimaster.com"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">邮件支持</p>
                <p className="text-xs text-gray-400">support@mianshimaster.com</p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 ml-auto" />
            </a>

            <a
              href="#"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">微信客服</p>
                <p className="text-xs text-gray-400">扫描二维码添加</p>
              </div>
            </a>
          </div>
        </section>

        {/* 反馈表单 */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Send className="w-5 h-5" />
            反馈建议
          </h2>
          {feedbackSent ? (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-600 dark:text-green-400">
              感谢您的反馈！我们会尽快处理。
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">反馈类型</label>
                <select
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="BUG">Bug报告</option>
                  <option value="FEATURE">功能建议</option>
                  <option value="QUESTION">使用疑问</option>
                  <option value="OTHER">其他</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">标题</label>
                <input
                  type="text"
                  value={feedbackTitle}
                  onChange={(e) => setFeedbackTitle(e.target.value)}
                  placeholder="简要描述"
                  className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">详细内容</label>
                <textarea
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  placeholder="请描述您的反馈..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">联系方式（选填）</label>
                <input
                  type="text"
                  value={feedbackContact}
                  onChange={(e) => setFeedbackContact(e.target.value)}
                  placeholder="邮箱或微信"
                  className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <Button onClick={handleSubmitFeedback} disabled={!feedbackTitle || !feedbackContent}>
                <Send className="w-4 h-4 mr-1" />
                提交反馈
              </Button>
              <p className="text-xs text-gray-400">
                {apiMode === 'server' ? '反馈将发送至服务器' : '本地模式下仅展示表单'}
              </p>
            </>
          )}
        </section>

        {/* FAQ */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            常见问题
          </h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <details key={i} className="group">
                <summary className="flex items-center justify-between py-3 px-4 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {faq.q}
                  <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="px-4 pb-3 text-sm text-gray-500 dark:text-gray-400">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
