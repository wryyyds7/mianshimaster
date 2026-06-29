# 前端文档 — 面试大师

## 一、技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3+ | UI框架 |
| TypeScript | 5.5+ | 类型系统 |
| Electron | 32+ | 桌面容器 |
| Vite (electron-vite) | 5+ | 构建工具 |
| React Router | 6.26+ | 客户端路由 |
| Zustand | 4.5+ | 状态管理 |
| Tailwind CSS | 3.4+ | 原子化CSS |
| Radix UI | latest | 无样式无障碍组件 |
| Lucide React | latest | 图标库 |
| Socket.IO Client | 4.7+ | WebSocket客户端 |
| Axios | 1.7+ | HTTP请求 |
| marked | 12+ | Markdown渲染 |
| react-window | 1.8+ | 虚拟列表 |

## 二、项目目录结构

```
client/
├── electron/
│   ├── main.ts                    # Electron主进程入口
│   └── preload.ts                 # 预加载脚本(IPC桥接)
├── src/
│   ├── main.tsx                   # React入口
│   ├── App.tsx                    # 根组件(路由配置)
│   ├── index.css                  # 全局样式(Tailwind)
│   │
│   ├── pages/                     # 页面组件
│   │   ├── HomePage.tsx           # 首页/导航页
│   │   ├── WorkspacePage.tsx      # 回答工作台
│   │   ├── HistoryPage.tsx        # 历史记录
│   │   ├── KnowledgeBasePage.tsx  # 知识库管理
│   │   ├── SettingsPage.tsx       # 设置页面
│   │   ├── ContactPage.tsx        # 联系我们
│   │   └── LoginPage.tsx          # 登录页面
│   │
│   ├── components/                # 通用组件
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx      # 主布局(侧边栏+内容)
│   │   │   ├── Sidebar.tsx        # 侧边导航栏
│   │   │   └── TitleBar.tsx       # 自定义标题栏
│   │   ├── workspace/
│   │   │   ├── QuestionList.tsx   # 左侧问题列表
│   │   │   ├── QuestionItem.tsx   # 问题条目
│   │   │   ├── ChatDetail.tsx     # 右侧对话详情
│   │   │   ├── ChatBubble.tsx     # 对话气泡
│   │   │   ├── ChatInput.tsx      # 输入框
│   │   │   ├── FileUploader.tsx   # 背景文件上传
│   │   │   └── StreamingText.tsx  # 流式文本渲染
│   │   ├── knowledge/
│   │   │   ├── KnowledgeList.tsx  # 知识库列表
│   │   │   ├── KnowledgeEditor.tsx# 知识编辑弹窗
│   │   │   ├── CategoryTree.tsx   # 分类树
│   │   │   └── SearchBar.tsx      # 搜索栏
│   │   ├── history/
│   │   │   ├── SessionList.tsx    # 会话列表
│   │   │   ├── SessionCard.tsx    # 会话卡片
│   │   │   └── SessionDetail.tsx  # 会话详情面板
│   │   ├── settings/
│   │   │   ├── ApiConfigForm.tsx  # API配置表单
│   │   │   ├── ModeSwitch.tsx     # 模式切换开关
│   │   │   └── ThemeSelector.tsx  # 主题选择器
│   │   └── ui/                    # 基础UI组件
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       ├── Dropdown.tsx
│   │       ├── Tabs.tsx
│   │       ├── Toast.tsx
│   │       └── Spinner.tsx
│   │
│   ├── stores/                    # Zustand状态管理
│   │   ├── authStore.ts           # 认证状态
│   │   ├── configStore.ts         # 配置状态(API/模式)
│   │   ├── sessionStore.ts        # 当前会话状态
│   │   ├── knowledgeStore.ts      # 知识库状态
│   │   └── uiStore.ts             # UI状态(主题/侧边栏)
│   │
│   ├── hooks/                     # 自定义Hooks
│   │   ├── useAI.ts               # AI调用Hook(流式)
│   │   ├── useSocket.ts           # WebSocket连接
│   │   ├── useFileUpload.ts       # 文件上传
│   │   ├── useDebounce.ts         # 防抖
│   │   └── useKeyboard.ts         # 快捷键
│   │
│   ├── services/                  # 服务层
│   │   ├── api.ts                 # Axios实例 + 拦截器
│   │   ├── aiService.ts           # AI API调用
│   │   ├── sessionService.ts      # 会话CRUD
│   │   ├── knowledgeService.ts    # 知识库CRUD
│   │   ├── fileService.ts         # 文件上传/解析
│   │   └── authService.ts         # 认证服务
│   │
│   ├── types/                     # TypeScript类型定义
│   │   ├── session.ts             # 会话/问题/回答类型
│   │   ├── knowledge.ts           # 知识库类型
│   │   ├── config.ts              # 配置类型
│   │   ├── auth.ts                # 认证类型
│   │   └── api.ts                 # API响应类型
│   │
│   └── utils/                     # 工具函数
│       ├── format.ts              # 日期/文本格式化
│       ├── crypto.ts              # 本地加密
│       ├── fileParser.ts          # 文件内容提取
│       └── constants.ts           # 常量定义
└── package.json
```

## 三、路由设计

```typescript
// App.tsx 路由配置
const routes = [
  {
    path: '/',
    element: <AppLayout />,      // 带侧边栏的布局
    children: [
      { index: true, element: <HomePage /> },           // 首页
      { path: 'workspace', element: <WorkspacePage /> }, // 回答工作台
      { path: 'history', element: <HistoryPage /> },     // 历史记录
      { path: 'knowledge', element: <KnowledgeBasePage /> }, // 知识库
      { path: 'settings', element: <SettingsPage /> },   // 设置
      { path: 'contact', element: <ContactPage /> },     // 联系我们
    ]
  },
  {
    path: '/login',
    element: <LoginPage />       // 登录页(无边栏)
  }
]
```

### 路由守卫逻辑

```
访问任意页面
    │
    ▼
检查 isConfigured(API) || isLoggedIn
    │                    │
  [是]                [否]
    │                    │
    ▼                    ▼
正常渲染          弹出配置/登录弹窗
                       │
                 ┌─────┴─────┐
                 │           │
            [配置API]    [登录]
                 │           │
                 └─────┬─────┘
                       ▼
                  正常渲染
```

## 四、核心组件详细设计

### 4.1 AppLayout（主布局）

```
┌─────────────────────────────────────────────┐
│  TitleBar (自定义标题栏，可拖拽)              │
├──────────┬──────────────────────────────────┤
│ Sidebar  │                                  │
│          │                                  │
│ 🏠 首页   │       <Outlet />                 │
│ 💬 工作台 │       页面内容区域                │
│ 📋 历史   │                                  │
│ 📚 知识库 │                                  │
│ ⚙ 设置   │                                  │
│ 📧 联系   │                                  │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

### 4.2 WorkspacePage（回答工作台）

**核心状态管理**：
```typescript
interface WorkspaceState {
  // 会话
  sessionId: string | null;
  isActive: boolean;           // 是否在工作台模式

  // 背景文件
  backgroundFiles: FileInfo[];
  contextText: string;         // 提取的文本上下文

  // 问答
  questions: QuestionItem[];   // 问题列表（按时间）
  activeQuestionId: string | null; // 当前选中问题

  // AI回答流
  streamingContent: string;    // 当前流式输出内容
  isStreaming: boolean;        // 是否正在生成

  // 操作
  enterWorkspace: (files: FileInfo[]) => void;
  exitWorkspace: () => void;
  selectQuestion: (id: string) => void;
  sendMessage: (content: string) => void;
}
```

**关键交互流程**：
1. 用户点击"开始回答" → 弹出文件上传对话框
2. 用户上传背景文件 → 系统解析文本 → 存入contextText
3. 进入工作台 → sessionId生成 → 左侧空问题列表
4. 新问题到来 → 加入问题列表(顶部) → AI自动生成回答 → 流式展示
5. 点击历史问题 → 右侧切换为该问题对话详情
6. 点击"退出" → 保存完整会话 → 返回首页

**新问题优先处理逻辑**：
```typescript
// 当新问题到达时
const handleNewQuestion = (question: QuestionItem) => {
  // 1. 如果当前有正在生成的回答，取消
  if (isStreaming) {
    abortController.abort();
  }

  // 2. 将新问题插入列表头部
  setQuestions(prev => [question, ...prev]);

  // 3. 立即切换到新问题
  setActiveQuestionId(question.id);

  // 4. 立即触发AI回答（新请求优先级最高）
  generateAnswer(question);
};
```

### 4.3 ChatDetail（对话详情）

**组件结构**：
```tsx
function ChatDetail({ question }: { question: QuestionItem }) {
  // 对话历史：问题 + AI回答链
  const [messages, setMessages] = useState<Message[]>([]);

  // 流式回答状态
  const { content, isStreaming } = useAIStream();

  return (
    <div className="flex flex-col h-full">
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        {isStreaming && <StreamingText content={content} />}
      </div>

      {/* 输入区域 */}
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
```

### 4.4 FileUploader（文件上传组件）

```tsx
// 支持拖拽上传
function FileUploader({ onFilesParsed }: Props) {
  const handleFiles = async (files: File[]) => {
    const parsed = await Promise.all(
      files.map(async (file) => {
        // 检查文件类型
        if (!ALLOWED_TYPES.includes(file.type)) {
          toast.error(`不支持的文件类型: ${file.name}`);
          return null;
        }
        // 检查文件大小(限制50MB)
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`文件过大: ${file.name}`);
          return null;
        }
        // 解析文件内容
        const text = await parseFileContent(file);
        return { name: file.name, text, size: file.size };
      })
    );
    onFilesParsed(parsed.filter(Boolean));
  };

  return (
    <DropZone onDrop={handleFiles}>
      <p>拖拽文件到此处或点击上传</p>
      <p className="text-sm text-gray-500">
        支持 PDF、Word、TXT、Markdown（最大50MB）
      </p>
    </DropZone>
  );
}
```

## 五、状态管理设计

### 5.1 Store清单

| Store | 职责 | 持久化 |
|-------|------|--------|
| `authStore` | 登录状态、Token、用户信息 | ✅ localStorage |
| `configStore` | API配置、运行模式、主题 | ✅ localStorage+加密 |
| `sessionStore` | 当前会话状态（不持久化） | ❌ 内存 |
| `knowledgeStore` | 知识库数据 | ✅ SQLite/API |
| `uiStore` | 侧边栏展开、Modal状态 | ❌ 内存 |

### 5.2 configStore 详细设计

```typescript
interface ConfigState {
  // API配置
  apiMode: 'local' | 'server';     // 当前模式
  localApi: {
    provider: string;               // openai / claude / custom
    apiKey: string;                 // 加密存储
    baseUrl: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
  serverApi: {
    baseUrl: string;
    isLoggedIn: boolean;
    token: string | null;
  };

  // UI
  theme: 'light' | 'dark' | 'system';
  language: 'zh-CN' | 'en-US';

  // 操作
  setApiMode: (mode: 'local' | 'server') => void;
  updateLocalApiConfig: (config: Partial<LocalApiConfig>) => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  setTheme: (theme: Theme) => void;
}
```

## 六、IPC通信设计（Electron主进程↔渲染进程）

```typescript
// preload.ts - 暴露给渲染进程的API
interface ElectronAPI {
  // 文件操作
  readFile: (path: string) => Promise<Buffer>;
  writeFile: (path: string, data: Buffer) => Promise<void>;
  selectFile: (filters: FileFilter[]) => Promise<string | null>;

  // 数据库操作（本地SQLite）
  db: {
    query: (sql: string, params?: any[]) => Promise<any>;
    execute: (sql: string, params?: any[]) => Promise<void>;
  };

  // 系统功能
  getAppVersion: () => Promise<string>;
  checkUpdate: () => Promise<UpdateInfo | null>;
  setAutoLaunch: (enable: boolean) => Promise<void>;

  // 安全存储（Keychain）
  secureStore: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<void>;
    delete: (key: string) => Promise<void>;
  };

  // 窗口控制
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
  };
}
```

## 七、流式AI响应处理

```typescript
// hooks/useAI.ts
function useAI() {
  const { config } = useConfigStore();
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const streamChat = useCallback(async (
    messages: Message[],
    contextText: string,
    onChunk: (chunk: string) => void,
    onComplete: (fullText: string) => void,
    onError: (error: Error) => void,
  ) => {
    const controller = new AbortController();
    abortRef.current = controller;
    setIsStreaming(true);

    try {
      const response = await fetch(
        config.apiMode === 'local'
          ? `${config.localApi.baseUrl}/chat/completions`
          : `${config.serverApi.baseUrl}/api/ai/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getApiKey()}`,
          },
          body: JSON.stringify({
            model: config.localApi.model,
            messages: [
              { role: 'system', content: contextText }, // 背景文件上下文
              ...messages,
            ],
            stream: true,
          }),
          signal: controller.signal,
        }
      );

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // 解析SSE格式: data: {...}
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          const json = JSON.parse(line.slice(6));
          if (json === '[DONE]') continue;
          const content = json.choices?.[0]?.delta?.content || '';
          fullText += content;
          onChunk(fullText);
        }
      }

      onComplete(fullText);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      onError(err);
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [config]);

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { streamChat, abort, isStreaming };
}
```
