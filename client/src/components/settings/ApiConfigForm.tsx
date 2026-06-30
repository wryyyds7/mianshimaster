import { useState } from 'react';
import { useConfigStore } from '../../stores/configStore';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface ApiConfigFormProps {
  mode?: 'dialog' | 'page';
  onSaved?: () => void;  // dialog 模式下保存后关闭弹窗
}

export default function ApiConfigForm({ mode = 'page', onSaved }: ApiConfigFormProps) {
  const { localApi, sttApi, updateLocalApiConfig, updateSTTConfig } = useConfigStore();
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState(localApi.baseUrl);
  const [model, setModel] = useState(localApi.model);
  const [sttApiKey, setSttApiKey] = useState('');
  const [sttProvider, setSttProvider] = useState(sttApi.provider);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateLocalApiConfig({
      apiKey: apiKey || localApi.apiKey,
      baseUrl,
      model,
    });
    updateSTTConfig({
      provider: sttProvider,
      apiKey: sttApiKey || sttApi.apiKey,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // dialog 模式下保存后自动关闭弹窗
    if (mode === 'dialog' && onSaved) {
      setTimeout(() => onSaved(), 800);
    }
  };

  const containerClass = mode === 'dialog'
    ? 'min-w-[360px]'
    : 'max-w-md';

  return (
    <div className={containerClass}>
      <div className="space-y-4">
        {/* LLM 配置区 */}
        <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            🤖 LLM 大模型
          </h3>
          <div className="space-y-3">
            <Input
              label="API Key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
            <Input
              label="Base URL"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
            />
            <Input
              label="模型"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gpt-4o"
            />
          </div>
        </div>

        {/* STT 语音识别配置区 */}
        <div className="pt-1">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            🎤 语音识别 (STT)
          </h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                提供商
              </label>
              <select
                value={sttProvider}
                onChange={(e) => setSttProvider(e.target.value as any)}
                className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="web-speech">浏览器内置 (免费)</option>
                <option value="openai-whisper">OpenAI Whisper</option>
                <option value="tencent-asr">腾讯云 ASR</option>
              </select>
            </div>
            {sttProvider !== 'web-speech' && (
              <Input
                label="STT API Key"
                type="password"
                value={sttApiKey}
                onChange={(e) => setSttApiKey(e.target.value)}
                placeholder={sttProvider === 'openai-whisper' ? 'sk-...' : '腾讯云 SecretId'}
              />
            )}
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          {saved ? '已保存 ✓' : '保存配置'}
        </Button>
      </div>
    </div>
  );
}
