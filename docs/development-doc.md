# 开发文档 — 面试大师

## 一、技术选型理由

### 1.1 为什么选择 Electron + React + TypeScript？

| 考量维度 | 选型理由 |
|----------|---------|
| **跨平台** | Electron一套代码覆盖Windows/macOS/Linux，用户覆盖面广 |
| **开发效率** | React生态成熟，组件库丰富，HMR极速热更新 |
| **类型安全** | TypeScript全栈类型覆盖，减少运行时错误 |
| **APP扩展** | React代码可直接迁移至React Native，共享80%业务逻辑 |
| **社区支持** | Electron + React是GitHub上最活跃的桌面端技术栈 |
| **包体积** | electron-vite可优化打包，最终安装包约80-120MB |

### 1.2 备选方案对比

| 方案 | 优势 | 劣势 | 结论 |
|------|------|------|------|
| **Tauri + React** | 包体积小(约10MB) | Rust学习曲线陡，插件生态不成熟 | 备选 |
| **Flutter Desktop** | 一套代码跨6端 | PC端成熟度不足，中文生态弱 | 不适合 |
| **WPF + WebView2** | Windows原生性能 | 不跨平台，无法扩展APP | 不适合 |
| **Electron + React** ✅ | 生态成熟，跨平台，可扩展 | 包体积较大 | **首选** |

### 1.3 后端技术选型

| 技术 | 选型理由 |
|------|---------|
| **Express.js** | Node.js最成熟的Web框架，与前端共享TypeScript类型 |
| **Prisma** | 类型安全的ORM，自动生成TypeScript类型 |
| **SQLite** | 零配置本地数据库，适合Electron嵌入 |
| **PostgreSQL** | 服务器端高性能关系型数据库 |
| **Socket.IO** | 成熟的WebSocket库，自动重连、房间管理 |
| **LangChain** | 统一多模型API调用，支持RAG、Chain等高级功能 |

## 二、架构设计

### 2.1 系统架构图

```
┌──────────────────────────────────────────────────────────────┐
│                     Electron 桌面应用                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                  渲染进程 (Renderer)                     │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │  │
│  │  │  React   │  │  Router  │  │  Zustand Store       │  │  │
│  │  │  Pages   │  │          │  │  - authStore         │  │  │
│  │  │  Comps   │  │          │  │  - sessionStore      │  │  │
│  │  └────┬─────┘  └──────────┘  │  - knowledgeStore    │  │  │
│  │       │                       │  - configStore       │  │  │
│  │       │                       └──────────────────────┘  │  │
│  │       │                                                 │  │
│  │  ┌────▼─────────────────────────────────────────────┐   │  │
│  │  │              Service Layer (服务层)               │   │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │   │  │
│  │  │  │ apiService│  │aiService │  │ fileService   │  │   │  │
│  │  │  └──────────┘  └──────────┘  └───────────────┘  │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────┘  │
│                            │ IPC                              │
│  ┌────────────────────────▼───────────────────────────────┐  │
│  │              主进程 (Main Process)                      │  │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────────┐   │  │
│  │  │ 窗口管理  │  │ 文件系统  │  │  本地数据库(SQLite) │   │  │
│  │  └──────────┘  └──────────┘  └────────────────────┘   │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                              │
                    HTTP / WebSocket
                              │
┌─────────────────────────────▼────────────────────────────────┐
│                    Express 服务端                              │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌───────────┐  │
│  │  Auth    │  │ Session  │  │ Knowledge  │  │  AI       │  │
│  │  认证    │  │ 会话管理  │  │  知识库    │  │  AI代理   │  │
│  └──────────┘  └──────────┘  └────────────┘  └───────────┘  │
│                            │                                  │
│              ┌─────────────▼─────────────┐                    │
│              │       PostgreSQL          │                    │
│              └───────────────────────────┘                    │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 数据流设计

```
用户操作 → React组件 → Zustand Store → Service Layer
                                          │
                          ┌───────────────┼───────────────┐
                          ▼               ▼               ▼
                      Electron IPC     HTTP API       Socket.IO
                      (本地操作)      (服务器通信)    (实时推送)
                          │               │               │
                          ▼               ▼               ▼
                       SQLite          Express        WebSocket
                      (本地DB)        (服务器)       (实时通道)
```

### 2.3 身份隔离设计

```
┌─────────────────────────────────────────────┐
│              会话管理核心                     │
│                                              │
│  提问者端                    回答者端          │
│  ┌─────────┐              ┌─────────┐       │
│  │匿名Token│              │用户凭证  │       │
│  │(临时生成)│              │(JWT)    │       │
│  └────┬────┘              └────┬────┘       │
│       │                        │             │
│       ▼                        ▼             │
│  ┌─────────┐              ┌─────────┐       │
│  │问题队列  │───匿名传递──▶│AI处理   │       │
│  │(带会话ID)│              │(无身份信息)│     │
│  └─────────┘              └─────────┘       │
│                                              │
│  ⚠️ 数据清洗规则：                            │
│  1. 提问内容不包含提问者身份标记                │
│  2. AI回答不引用提问者个人信息                  │
│  3. 会话记录中提问者字段为匿名hash              │
└─────────────────────────────────────────────┘
```

## 三、环境搭建

### 3.1 开发环境要求

| 工具 | 版本要求 |
|------|---------|
| Node.js | >= 20.0.0 |
| npm | >= 10.0.0 |
| Git | >= 2.40 |
| PostgreSQL | >= 15 (服务器模式需要) |

### 3.2 客户端初始化

```bash
# 创建项目
mkdir mianshimaster && cd mianshimaster

# 使用 electron-vite 脚手架
npm create @quick-start/electron@latest client -- --template react-ts
cd client
npm install

# 安装核心依赖
npm install react-router-dom zustand socket.io-client axios
npm install tailwindcss @tailwindcss/typography postcss autoprefixer
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install lucide-react class-variance-authority clsx tailwind-merge
npm install better-sqlite3 pdf-parse mammoth marked
npm install langchain @langchain/openai @langchain/core uuid

# 安装开发依赖
npm install -D @types/better-sqlite3 @types/pdf-parse electron-builder
```

### 3.3 服务端初始化

```bash
cd ../server
npm init -y

# 安装核心依赖
npm install express cors helmet jsonwebtoken bcryptjs
npm install socket.io multer dotenv
npm install @prisma/client langchain @langchain/openai uuid
npm install pdf-parse mammoth

# 安装开发依赖
npm install -D typescript @types/express @types/node ts-node nodemon
npm install -D @types/cors @types/jsonwebtoken @types/bcryptjs
npm install -D @types/multer @types/uuid prisma

# 初始化 TypeScript
npx tsc --init

# 初始化 Prisma
npx prisma init --datasource-provider postgresql
```

### 3.4 启动开发环境

```bash
# 启动服务端（端口 3001）
cd server
npm run dev

# 启动客户端（Electron）
cd client
npm run dev
```

## 四、开发规范

### 4.1 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 文件名 | kebab-case | `session-list.tsx`, `use-auth.ts` |
| 组件名 | PascalCase | `SessionList`, `QuestionCard` |
| 函数/变量 | camelCase | `fetchHistory`, `userName` |
| 类型/接口 | PascalCase + I前缀(接口) | `ISession`, `QuestionType` |
| 常量 | UPPER_SNAKE_CASE | `API_BASE_URL` |
| 数据库表 | snake_case | `answer_sessions` |

### 4.2 Git提交规范

```
<type>(<scope>): <subject>

类型：feat / fix / docs / style / refactor / test / chore
范围：client / server / shared / docs
示例：feat(client): 添加回答者工作台左侧问题列表
```

### 4.3 分支策略

```
main          ← 生产分支（受保护）
  └── develop ← 开发分支
        ├── feat/xxx    ← 功能分支
        ├── fix/xxx     ← 修复分支
        └── release/x.x ← 发布分支
```

## 五、安全设计

### 5.1 数据加密
- 本地SQLite数据库使用AES-256-GCM加密
- API Key存储使用系统密钥链(Windows Credential Manager / macOS Keychain)
- JWT Token有效期24小时，Refresh Token 7天

### 5.2 通信安全
- 所有HTTP请求使用HTTPS
- WebSocket使用WSS
- API请求频率限制：100次/分钟/IP
- 敏感操作二次确认

### 5.3 身份安全
- 提问者使用临时UUID + 会话绑定
- 回答者使用JWT认证
- 密码使用bcryptjs(盐轮12)哈希存储
- 会话Token绑定设备指纹（可选）

## 六、性能优化策略

| 策略 | 实施方式 |
|------|---------|
| **虚拟列表** | 历史记录使用react-window，支持万条数据 |
| **懒加载** | React.lazy + Suspense 按需加载页面 |
| **AI流式输出** | SSE流式返回，打字机效果展示 |
| **文件分片上传** | 大文件(>10MB)分片上传 |
| **数据库索引** | 为高频查询字段建立索引 |
| **本地缓存** | 知识库内容本地LRU缓存 |
| **打包优化** | electron-vite代码分割，Tree Shaking |

## 七、更新日志

### 2026年7月1日09时 - LLM API测试增加原始响应调试与兜底解析

**问题：** LLM 大模型 API 测试报错「API 返回了空内容，请检查模型名称是否正确」，但没有显示原始响应数据，无法定位具体原因。

**根因分析：**
- HTTP 200 响应已到达，JSON 解析成功
- 但适配器的 `parseResponse()` 返回空字符串——意味着响应结构与适配器预期不匹配
- 可能原因：API 代理包装了响应、模型名错误导致服务端静默返回空、非标格式等

**修复：**

| 文件 | 变更 |
|------|------|
| `apiTestService.ts` | ① 新增 `console.log` 调试输出（请求URL/头/体 + 原始响应）② 新增 `smartParseContent()` 兜底解析器（支持7种常见响应格式 + 递归 data/response/result 嵌套）③ 新增 `buildModelSuggestion()` 智能提示（Gemini 安全过滤、OpenAI error 等）④ 错误消息现在包含原始响应内容（截断300字符） |
| `ApiTestPanel.tsx` | LLM 错误消息增加 `whitespace-pre-wrap break-all`，支持多行和长文本展示 |

**兜底解析器支持的格式：**
```
1) OpenAI 兼容   { choices: [{ message: { content } }] }
2) 裸字段        { content: "..." } / { text: "..." }
3) Gemini        { candidates: [{ content: { parts: [{ text }] } }] }
4) Anthropic     { content: [{ type: "text", text: "..." }] }
5) Ollama        { message: { content: "..." } }
6) 嵌套 data     { data: { choices: [...] } }
7) response/result 包装  { response: { ... } }
```

### 2026年6月30日11时 - 修复窗口关闭按钮失效（preload路径错误）

**问题：** Electron 窗口右上角 ✕ 按钮（以及最小化/最大化按钮）点击无效，无法关闭应用。

**根因：** `electron-vite` 因项目的 `"type": "module"` 将 preload 编译为 `out/preload/index.mjs`，
但 `main.ts` 的 `preload` 路径写的是 `../preload/index.js`——文件不存在，
`contextBridge` 未能注册，`window.electronAPI` 始终为 `undefined`，所有窗口控制按钮静默失效。

**修复：**
| 文件 | 修改 |
|------|------|
| `electron/main.ts` | `preload` 路径 `index.js` → `index.mjs` |
| `electron.vite.config.ts` | 新增 `output.entryFileNames: '[name].js'` 防止再次出现 |
| `out/main/index.js` | 编译产物同步更新 |

**根因分析链：**
```
"type": "module" → electron-vite 输出 .mjs
→ main.ts 加载 ../preload/index.js（不存在）
→ preload 未执行 → electronAPI 为 undefined
→ TitleBar.tsx 中 electronAPI?.window.close() 不执行
→ 所有按钮（最小化/最大化/关闭）全部失效
```

### 2026年6月30日11时 - 首页新增API测试入口

**改进：**
- HomePage Hero 区域下方新增醒目的 **「进行 API 测试」** 卡片
- 直接内嵌 `ApiTestPanel`，用户无需进入设置页即可一键测试 LLM + STT 连通性
- 卡片使用 amber 橙色渐变边框 + Wifi 图标，视觉突出醒目

**修改文件：**
| 文件 | 变更 |
|------|------|
| `HomePage.tsx` | 新增 `ApiTestPanel` 导入 + 橙色醒目测试卡片 |

### 2026年6月30日10时 - 修复Gemini端点 + 自动填充全字段 + 模型按提供商过滤

**问题修复：**

| 问题 | 描述 | 修复 |
|------|------|------|
| **Gemini 端点缺少模型名** | `buildEndpoint` 仅返回 `/models`，缺少实际模型名 | 接口增加 `model` 和 `stream` 参数；Gemini 适配器正确构建 `/models/{m}:generateContent` 或 `/models/{m}:streamGenerateContent?alt=sse` |
| **切换提供商不自动填充全部字段** | 切换提供商仅更新 baseUrl 和 model | 现在同时自动填充 temperature=0.7, maxTokens=4096 |
| **模型下拉框不按提供商过滤** | 显示所有提供商的全部模型列表 | 新增 `getModelsForProvider()`，下拉框仅显示当前提供商的模型 |
| **Ollama 需要 API Key** | Ollama 本地运行不需要 API Key，但仍提示填写 | Ollama 选中时 API Key 输入框禁用，显示"本地运行无需填写" |

**新增/修改文件：**

| 文件 | 变更 |
|------|------|
| `api-adapters/types.ts` | `buildEndpoint(baseUrl, model?, stream?)` 增加 model 和 stream 参数 |
| `api-adapters/registry.ts` | 所有适配器 `buildEndpoint` 适配新签名；Gemini 端点嵌入模型名 + 支持流式端点切换 |
| `aiService.ts` | 两处 `buildEndpoint` 调用传入 model；streamChat 额外传入 `stream: true` |
| `apiTestService.ts` | 测试调用传入 model 参数 |
| `ApiFormatPreview.tsx` | 预览端点传入 model 参数 |
| `constants.ts` | 新增 `getModelsForProvider(provider)` 导出 |
| `SettingsPage.tsx` | ①切换提供商自动填充全部字段 ②模型下拉按提供商过滤 ③API Key/Based URL 占位符动态适配当前提供商 |

### 2026年6月30日 - 多API适配器架构 + 格式自动生成 + 可视化预览

**架构概述：**
实现了一个声明式的多 API 适配器系统，覆盖 6 大主流 LLM API 提供商，系统能根据用户选择的 API 自动生成符合标准格式的完整请求配置。

**新增模块：**

| 文件 | 职责 |
|------|------|
| `services/api-adapters/types.ts` | 适配器接口定义：认证方式/请求构建/响应解析/流式配置 |
| `services/api-adapters/registry.ts` | 6 大提供商注册表：OpenAI/Anthropic/DeepSeek/Gemini/Ollama/Moonshot |
| `services/api-adapters/index.ts` | 统一导出 |
| `components/settings/ApiFormatPreview.tsx` | 可视化预览面板：展示端点/认证头/请求体/解析代码 |

**支持的 API 格式规范对照：**

| 提供商 | 端点 | 认证方式 | 流式格式 | 特殊说明 |
|--------|------|---------|---------|---------|
| **OpenAI** | `/v1/chat/completions` | Bearer Token | SSE `[DONE]` | 标准 OpenAPI 格式 |
| **Anthropic Claude** | `/v1/messages` | x-api-key + version | SSE `message_stop` | system 独立于 messages |
| **DeepSeek** | `/chat/completions` | Bearer Token | SSE `[DONE]` | OpenAI 兼容 + thinking 参数 |
| **Google Gemini** | `/models/{m}:generateContent` | Bearer | SSE 无 done 标记 | role=model, systemInstruction |
| **Ollama** | `/api/chat` | 无 | NDJSON | maxTokens→num_predict |
| **月之暗面 Kimi** | `/v1/chat/completions` | Bearer Token | SSE `[DONE]` | 标准 OpenAI 兼容 |

**重构文件：**

| 文件 | 修改内容 |
|------|---------|
| `shared/types/index.ts` | `LLMProvider` 联合类型扩展为 8 种提供商 |
| `services/aiService.ts` | 全面改用适配器驱动：请求构建/响应解析/流式读取均由适配器自动生成；新增 NDJSON 流式支持 (Ollama) |
| `services/apiTestService.ts` | 测试请求全面改用适配器生成，移除硬编码的 `anthropic.com` 判断 |
| `utils/constants.ts` | `API_PROVIDERS` / `DEFAULT_MODELS` 从适配器注册表动态聚合 |
| `SettingsPage.tsx` | 集成 `ApiFormatPreview` 可视化面板；提供商切换时自动联动 baseUrl + 模型 |

**设计原则：**
```
用户选择 API → 适配器自动生成：
  ├─ buildEndpoint()     → POST https://api.xxx.com/...
  ├─ buildAuthHeaders()  → { Authorization: 'Bearer ...' }
  ├─ buildRequestBody()  → { model: '...', messages: [...] }
  ├─ parseResponse()     → 非流式 JSON 内容提取
  ├─ parseStreamChunk()  → SSE/NDJSON 增量文本提取
  └─ describe()          → ApiFormatPreview 展示用结构化信息

新增 API 只需在 registry.ts 注册一个对象，无需修改业务代码。
```

### 2025年6月29日 - 全功能审计与修复

**修复的严重Bug：**
- ✅ 服务器模式AI调用路径修复：`aiService.ts` 新增 `streamChatServer()` 方法，正确请求 `/api/ai/chat` 而非 `/chat/completions`
- ✅ `useAI.ts` Hook参数修复：修正与 `aiService` 方法签名的参数顺序不匹配问题，自动检测本地/服务器模式
- ✅ `configStore.isConfigured()` 逻辑修复：custom provider不再绕过API Key校验

**修复的高优先级问题：**
- ✅ LoginPage 接入真实 authService API调用，移除Mock Token
- ✅ FileUploader 接入 FileReader 实现真实文件解析（TXT/MD直接读取，PDF/DOCX标记待Electron环境）
- ✅ 会话数据持久化：sessionStore 添加 historySessions 并用 zustand persist 存入 localStorage
- ✅ HistoryPage 从 sessionStore 加载真实数据，支持导出JSON和删除
- ✅ KnowledgeBasePage 移除Mock数据，知识库数据通过 persist 持久化到 localStorage

**完善的功能：**
- ✅ SettingsPage 新增语言切换、服务器地址配置、主题选择、数据统计与导出
- ✅ ContactPage 新增反馈表单（反馈类型、标题、内容、联系方式）

**数据存储现状：**
| 数据 | 存储位置 | 持久化 |
|------|---------|--------|
| API配置 | localStorage (mianshimaster-config) | ✅ API Key不持久化 |
| 会话历史 | localStorage (mianshimaster-sessions) | ✅ persist中间件 |
| 知识库 | localStorage (mianshimaster-knowledge) | ✅ persist中间件 |
| 临时会话状态 | React内存 | ❌ 关闭丢失（退出时自动保存到historySessions） |

### 2026年6月30日 - 服务连接与页面完整性修复

**修复的服务连接致命Bug（3个）：**
- ✅ `api.ts` 新增命名导出 `{ api }`，解决 `authService.ts` 中 `import { api }` 导入报错问题
- ✅ `authService.ts` 完全重写：`login()` 参数从 `{ email }` 修正为 `{ username, password }`（与服务端一致）；响应字段从 `accessToken` 修正为 `token`（与服务端一致）；增加 `code` 校验逻辑
- ✅ `LoginPage.tsx` 使用新的 `setServerUrl()` 方法实时更新 configStore 服务器地址，确保 api 拦截器能读取正确的 baseURL

**修复的状态持久化问题：**
- ✅ `configStore.ts` persist 配置中 `serverApi.isLoggedIn`、`token`、`user` 字段改为持久化，刷新页面后保持登录状态

**新增功能：**
- ✅ `AppLayout.tsx` 侧边栏新增服务器连接状态指示器（点击验证 `/health` 端点，绿/红/灰三色图标）
- ✅ `AppLayout.tsx` 侧边栏新增登出按钮（服务器登录后可见）
- ✅ `SettingsPage.tsx` 服务器地址输入框 `onBlur` 时实时更新到 configStore
- ✅ `ContactPage.tsx` 反馈表单接入真实 API（服务器模式 `/api/feedback`），支持 loading/error/success 三态
- ✅ `ContactPage.tsx` FAQ 新增"如何连接我的服务器"条目

**服务器连接链路完整说明：**
```
用户输入服务器地址 → LoginPage.setServerUrl() → configStore.serverApi.baseUrl
→ api.ts 拦截器读取 baseUrl → axios 发起请求时的 config.baseURL = serverApi.baseUrl
→ 请求到达 Express 服务器（端口3001）→ 路由处理 → 返回响应
```

### 2026年6月30日 - DeepSeek API 支持 + API Key 本地持久化

**问题分析（4个配置缺陷）：**
1. `API_PROVIDERS` 只有 OpenAI / Claude / 自定义，无 DeepSeek 选项；DeepSeek 与 OpenAI/Claude 的 baseUrl 格式完全不同
2. DeepSeek 模型 `deepseek-chat` 即将于 2026/07/24 弃用，缺少新模型 `deepseek-v4-flash` / `deepseek-v4-pro`
3. `configStore.partialize` 将 `apiKey` 设为空字符串，每次刷新页面 Key 丢失，用户需反复填写
4. 切换提供商时不会自动更新 baseUrl 和模型名

**修复：**

| 文件 | 修改内容 |
|------|---------|
| `constants.ts` | 新增 `deepseek` 提供商（baseUrl `https://api.deepseek.com`）；模型新增 `deepseek-v4-flash` / `deepseek-v4-pro`，`deepseek-chat` 标记为即将弃用；新增 `getDefaultModel()` 辅助函数 |
| `configStore.ts` | `partialize` 移除 `apiKey: ''` 清空逻辑，LLM Key 和 STT Key 均持久化到 localStorage |
| `SettingsPage.tsx` | 提供商选择 `onChange` 时联动自动更新 baseUrl + 模型名（调用 `getDefaultModel`） |

**DeepSeek API 接入说明：**
```
baseUrl: https://api.deepseek.com              ← 不要带 /v1
端点:   {baseUrl}/chat/completions             ← 自动拼接，与 OpenAI SDK 兼容
认证:   Authorization: Bearer {apiKey}          ← 标准 Bearer Token
模型:   deepseek-v4-flash / deepseek-v4-pro
```

### 2026年6月30日 - API测试模块 + 角色区分 + 使用前验证体系

**新增模块：**
- **`apiTestService.ts`** — API 连通性测试服务，支持 LLM（发送最小请求验证 Key/BaseURL/模型）和 STT（检查接口可达性），返回成功/失败/延迟/错误详情
- **`ApiTestPanel.tsx`** — API 测试面板 UI 组件，嵌入 SettingsPage，展示 LLM 和 STT 测试结果卡片（绿/红），支持一键测试全部/单独测试
- **`configStore` 新增 `apiVerified` 字段** — 持久化标记 API 是否通过测试，侧边栏实时读取显示状态

**角色区分（提问者 / 回答者）：**
- Workspace 入口新增身份选择按钮：**我是回答者**（默认）/ **我是提问者**
- 工作台标题栏显示角色标签（回答者 indigo / 提问者 emerald 色）
- 不同身份显示不同引导说明文字

**API 使用前验证流程：**
```
配置API → 设置页测试连通性 → apiVerified=true → 侧边栏绿勾 → 工作台可用
            ↓ 未测试
         工作台入口显示⚠️黄色警告 + "前往设置"链接
         尝试进入 → 弹出 Modal 提醒去测试
```

**侧边栏 API 状态指示器：**
| 状态 | 图标 | 颜色 | 文字 |
|------|------|------|------|
| 已测试通过 | ✅ CheckCircle2 | 绿色 | API 已激活 |
| 已配置未测试 | ⚠️ AlertCircle | 黄色 | API 待测试 |
| 未配置 Key | ❓ HelpCircle | 灰色 | API 未配置 |

### 2026年6月30日 - 修复 WorkspacePage 条件式 Hook 导致崩溃

**问题：** Agent 界面报错 "Rendered fewer hooks than expected. This may be caused by an accidental early return statement."
**根因：** `WorkspacePage.tsx` 第 345 行存在 JSX 内联 hook 调用 `{useSessionStore((s) => s.streamingContent)}`，该 hook 位于 `if (!isActive)` 的 early return 之后，导致 `isActive` 变化时 hooks 调用次数不一致。
**修复：** 将 `streamingContent` 提取到组件顶层，在所有条件分支之前调用 `useSessionStore`。

### 2026年6月30日 - 设置页重构 + 导入路径修复 + 错误边界

**问题：**
1. `AgentChatPanel.tsx` 导入路径错误：`../components/ui/Button` 和 `../utils/cn` 找不到
2. 设置页暴露了服务器端配置（服务器地址等），用户应该只看到自己的API配置
3. STT 语音识别配置缺少 Base URL / API Key 完整字段
4. 懒加载页面报错时白屏，无错误提示和返回按钮

**修复：**
- **AgentChatPanel.tsx** — 导入路径修正为 `../ui/Button` 和 `../../utils/cn`
- **SettingsPage 完全重构：**
  - "API来源"切换：**自己配置API**（默认，显示LLM+STT全部配置） → **使用服务器**（仅显示登录状态，隐藏一切API配置）
  - 服务器模式不暴露服务器URL，用户只需登录即可使用（赚钱模式）
  - STT 配置完善：提供商 + API Key + 接口地址（Base URL），选"浏览器内置"时隐藏 API Key/URL
  - 顶部新增"返回首页"导航按钮
- **ErrorBoundary 组件** — 类组件捕获渲染错误，显示友好提示页 + "返回首页"/"重试"按钮
- **App.tsx** — 所有懒加载页面路由包裹 `<ErrorBoundary>`

### 2026年6月30日 - API配置弹窗双路关闭 + STT双Key配置

**问题：** 启动应用后弹出 API 配置窗口，但(1)只配了LLM Key没有STT Key，(2)弹窗无X按钮且遮罩不可点，无法关闭
**修复：**
- **ApiConfigForm** 拆分为两个区块：LLM 大模型配置（API Key / Base URL / 模型）+ STT 语音识别配置（提供商 / API Key）
- **App.tsx** 新增 `dismissed` 状态，支持三种关闭路径：
  1. 右上角 ✕ 按钮 → `showClose={true}` → `onClose={() => setDismissed(true)}`
  2. 点击遮罩（背景半透明层）→ Modal 组件已内置 `onClick` 关闭
  3. 保存配置后自动关闭 → `onSaved` 回调 800ms 后自动隐藏弹窗

### 2026年6月30日 - AI Agent 面试系统实现

**架构概述：**
实现了一个完整的 AI Agent 面试模拟系统，包含五大模块：

```
agent/
├── types.ts           # Agent 内部类型定义
├── StateMachine.ts    # 状态机 (IDLE→LISTENING→THINKING→RESPONDING)
├── ContextManager.ts  # 上下文管理器（系统提示词构建、消息组装、输出解析）
├── SpeechInput.ts     # 语音输入模块（Web Speech / Whisper / 腾讯云ASR）
├── InterviewAgent.ts  # 核心编排引擎（单例模式）
└── index.ts           # 统一导出
```

**各模块职责：**
| 模块 | 职责 | 关键设计 |
|------|------|---------|
| StateMachine | 对话状态管理 | 合法转换表校验，强制跳转（abort） |
| ContextManager | LLM上下文构建 | 滑动窗口历史、评分标准格式化、META标签解析 |
| SpeechInput | 语音转文字 | 工厂模式，支持3种STT提供商 |
| InterviewAgent | 流程编排 | 事件驱动回调，解耦UI层 |
| AgentChatPanel | 聊天界面 | 独立组件，与原ChatDetail完全解耦 |

**集成方式：**
- WorkspacePage 新增 "问答/Agent" 模式切换标签
- 原有问答模式代码 100% 保持不动
- Agent 模式使用独立的 AgentChatPanel 组件
- configStore 新增 `sttApi` 字段（不破坏现有结构）
- SettingsPage 新增 STT 提供商选择

**Agent 对话流程：**
```
上传简历 → Agent.start() → 生成开场问题(THINKING)
→ 用户回答(IDLE) → Agent.sendText() → LLM 流式输出(THINKING)
→ parseResponse() 分离显示内容/META元数据 → 展示+评分(RESPONDING)
→ 下一轮循环...
```

### 2026年6月30日 - API配置弹窗无法关闭修复

**问题：** 用户在 API Key 配置弹窗中保存后，弹窗不消失
**根因：** `App.tsx` 使用 `useConfigStore(s => s.isConfigured)` 选择了函数引用（稳定不变），导致 Zustand 不能检测 `apiKey` 变化触发重渲染
**修复：** 改为直接选择反应式值 `useConfigStore(s => s.localApi.apiKey)`，Key 变化时自动重渲染，Modal 立即消失

### 2026年6月30日 - better-sqlite3 Electron原生模块重建

**问题：** Electron 启动时报 `NODE_MODULE_VERSION` 不匹配，better-sqlite3 原生模块编译版本与 Electron 内置 Node.js 不一致
**修复：**
- 使用 `electron-rebuild` 重新编译 better-sqlite3 适配 Electron 的 Node.js 版本
- 添加 `@electron/rebuild` 为 devDependencies
- 添加 `postinstall` 脚本自动执行重建，确保每次 `npm install` 后模块都是正确版本

### 2026年6月30日 - tsconfig.node.json 缺失修复

**问题：** `electron-vite dev` 构建时报错 `ENOENT: no such file or directory, open 'tsconfig.node.json'`
**原因：** `tsconfig.json` 中 `references` 字段引用了不存在的 `tsconfig.node.json`
**修复：** 移除 `references` 引用，当前 `tsconfig.json` 的 `include` 已覆盖 `electron/**/*`，不需要单独的 Node 配置

### 2026年6月30日 - AI错误反馈、退出确认与清空保护修复

**修复的可用性问题（3个）：**
- ✅ `WorkspacePage.tsx` AI 失败不再静默吞错：server/local 两种模式下的错误回调均设置 `aiError` 状态，在顶部状态栏下方显示红色错误提示条（含关闭按钮），用户能明确看到失败原因
- ✅ `WorkspacePage.tsx` 退出工作台增加确认弹窗：点击退出先弹出 Modal，显示当前问答记录数量，告知"退出后将自动保存到历史记录"，支持取消/确认退出；移除了旧的误导性 TODO 注释
- ✅ `HistoryPage.tsx` "清空全部"增加二次确认弹窗：点击后弹出 Modal，显示即将删除的会话总数，明确标注"此操作不可撤销"，需再次点击"确认清空"才执行删除

**用户体验提升：**
| 场景 | 修复前 | 修复后 |
|------|--------|--------|
| AI 调用失败 | 界面卡死，用户不知情 | 红色错误条提示具体原因，可关闭 |
| 退出工作台 | 直接退出，无提示 | 确认弹窗，告知数据会保存 |
| 清空全部历史 | 一键删除，无法撤回 | 二次确认，注明不可撤销 |

