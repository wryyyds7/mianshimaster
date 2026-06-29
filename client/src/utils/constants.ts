export const APP_NAME = '面试大师';
export const APP_VERSION = '1.0.0';

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'text/x-markdown',
];

export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md'];
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const DEFAULT_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o', provider: 'openai' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'openai' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'openai' },
  { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', provider: 'claude' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus', provider: 'claude' },
  { value: 'deepseek-chat', label: 'DeepSeek Chat', provider: 'custom' },
  { value: 'custom', label: '自定义模型', provider: 'custom' },
];

export const API_PROVIDERS = [
  { value: 'openai', label: 'OpenAI', baseUrl: 'https://api.openai.com/v1' },
  { value: 'claude', label: 'Anthropic Claude', baseUrl: 'https://api.anthropic.com/v1' },
  { value: 'custom', label: '自定义兼容接口', baseUrl: '' },
];
