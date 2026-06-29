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
