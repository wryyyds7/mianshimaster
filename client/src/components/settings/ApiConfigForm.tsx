import { useState } from 'react';
import { useConfigStore } from '../../stores/configStore';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface ApiConfigFormProps {
  mode?: 'dialog' | 'page';
}

export default function ApiConfigForm({ mode = 'page' }: ApiConfigFormProps) {
  const { localApi, updateLocalApiConfig } = useConfigStore();
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState(localApi.baseUrl);
  const [model, setModel] = useState(localApi.model);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateLocalApiConfig({
      apiKey: apiKey || localApi.apiKey,
      baseUrl,
      model,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const containerClass = mode === 'dialog' 
    ? 'min-w-[360px]'
    : 'max-w-md';

  return (
    <div className={containerClass}>
      <div className="space-y-4">
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
        <Button onClick={handleSave} className="w-full">
          {saved ? '已保存 ✓' : '保存配置'}
        </Button>
      </div>
    </div>
  );
}
