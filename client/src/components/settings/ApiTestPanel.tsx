/**
 * API 测试面板 —— 配置后验证 LLM 和 STT 是否可用
 * 可嵌入 SettingsPage 或作为独立弹窗使用
 */
import { useState } from 'react';
import { useConfigStore } from '../../stores/configStore';
import { testLlmApi, testSttApi, testAllApis, type ApiTestResult, type SttTestResult } from '../../services/apiTestService';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Zap,
  Wifi,
  Mic,
  BrainCircuit,
  Clock,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

interface ApiTestPanelProps {
  className?: string;
  onTestPassed?: () => void; // 全部测试通过后的回调
}

export default function ApiTestPanel({ className, onTestPassed }: ApiTestPanelProps) {
  const { localApi, sttApi, setApiVerified } = useConfigStore();

  const [testing, setTesting] = useState(false);
  const [llmResult, setLlmResult] = useState<ApiTestResult | null>(null);
  const [sttResult, setSttResult] = useState<SttTestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const handleRunAllTests = async () => {
    setTesting(true);
    setLlmResult(null);
    setSttResult(null);
    setTestError(null);

    try {
      const results = await testAllApis(localApi, sttApi);
      setLlmResult(results.llm);
      setSttResult(results.stt);

      // 全部通过通知父组件 + 持久化标记
      if (results.llm.success && results.stt.success) {
        setApiVerified(true);
        if (onTestPassed) onTestPassed();
      } else {
        setApiVerified(false);
      }
    } catch (err) {
      setTestError(err instanceof Error ? err.message : '测试过程发生未知错误');
    } finally {
      setTesting(false);
    }
  };

  const handleTestLlmOnly = async () => {
    setTesting(true);
    setLlmResult(null);
    setTestError(null);
    try {
      const r = await testLlmApi(localApi);
      setLlmResult(r);
    } catch (err) {
      setTestError(err instanceof Error ? err.message : 'LLM 测试出错');
    } finally {
      setTesting(false);
    }
  };

  const handleTestSttOnly = async () => {
    setTesting(true);
    setSttResult(null);
    setTestError(null);
    try {
      const r = await testSttApi(sttApi);
      setSttResult(r);
    } catch (err) {
      setTestError(err instanceof Error ? err.message : 'STT 测试出错');
    } finally {
      setTesting(false);
    }
  };

  const allTested = llmResult !== null && sttResult !== null;
  const allPassed = llmResult?.success && sttResult?.success;

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          API 连通性测试
        </h3>
        {allTested && (
          <span className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            allPassed
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
          )}>
            {allPassed ? '全部通过' : '存在失败'}
          </span>
        )}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500">
        在实际使用前验证 API 是否可用。会发送一条最小化请求测试连通性。
      </p>

      {/* 错误提示 */}
      {testError && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{testError}</p>
        </div>
      )}

      {/* 测试结果卡片 */}
      <div className="grid grid-cols-2 gap-3">
        {/* LLM 测试结果 */}
        <div className={cn(
          'p-3 rounded-lg border transition-colors',
          llmResult?.success
            ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10'
            : llmResult
              ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10'
              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50',
        )}>
          <div className="flex items-center gap-2 mb-2">
            <BrainCircuit className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">LLM 大模型</span>
            {llmResult && (
              llmResult.success
                ? <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto" />
                : <XCircle className="w-4 h-4 text-red-500 ml-auto" />
            )}
          </div>
          {llmResult ? (
            <div className="space-y-1">
              <p className={cn(
                'text-xs',
                llmResult.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
              )}>
                {llmResult.message}
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                {llmResult.latencyMs}ms
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400">未测试</p>
          )}
        </div>

        {/* STT 测试结果 */}
        <div className={cn(
          'p-3 rounded-lg border transition-colors',
          sttResult?.success
            ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10'
            : sttResult
              ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10'
              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50',
        )}>
          <div className="flex items-center gap-2 mb-2">
            <Mic className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">STT 语音识别</span>
            {sttResult && (
              sttResult.success
                ? <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto" />
                : <XCircle className="w-4 h-4 text-red-500 ml-auto" />
            )}
          </div>
          {sttResult ? (
            <div className="space-y-1">
              <p className={cn(
                'text-xs',
                sttResult.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
              )}>
                {sttResult.message}
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                {sttResult.latencyMs}ms
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400">未测试</p>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleRunAllTests}
          disabled={testing}
          className="flex-1"
          size="sm"
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              测试中...
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4 mr-1.5" />
              一键测试全部
            </>
          )}
        </Button>
        <Button variant="outline" size="sm" onClick={handleTestLlmOnly} disabled={testing}>
          仅 LLM
        </Button>
        <Button variant="outline" size="sm" onClick={handleTestSttOnly} disabled={testing}>
          仅 STT
        </Button>
      </div>

      {/* 测试全部通过提示 */}
      {allPassed && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              API 全部就绪
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              可以开始使用面试大师的全部功能了
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-500" />
        </div>
      )}
    </div>
  );
}
