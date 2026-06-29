# 面试大师 (MianshiMaster)

一款支持AI问答的PC桌面软件，核心确保提问者与回答者身份绝对隔离，后续可扩展至APP端。

## 技术栈总览

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| **桌面框架** | Electron 32+ | 跨平台PC端(Windows/macOS/Linux) |
| **前端框架** | React 18 + TypeScript | UI渲染层，可复用于Web/React Native |
| **构建工具** | Vite + electron-vite | 极速HMR，一体化Electron构建 |
| **CSS方案** | Tailwind CSS + shadcn/ui | 原子化CSS + 高质量组件库 |
| **状态管理** | Zustand | 轻量级、TypeScript友好 |
| **路由** | React Router v6 | 前端路由管理 |
| **后端框架** | Express.js + TypeScript | RESTful API服务 |
| **ORM** | Prisma | 类型安全的数据库操作 |
| **本地数据库** | SQLite (better-sqlite3) | Electron端内嵌数据库 |
| **服务端数据库** | PostgreSQL | 服务器端持久化 |
| **实时通信** | Socket.IO | WebSocket双向通信 |
| **AI集成** | LangChain + OpenAI SDK | 多模型兼容，统一调用接口 |
| **文件处理** | pdf-parse, mammoth | PDF/Word文档解析 |
| **未来APP** | React Native | 共享TypeScript类型与业务逻辑 |

## 项目结构

```
mianshimaster/
├── docs/                         # 项目文档
│   ├── functional-doc.md         # 功能文档
│   ├── development-doc.md        # 开发文档
│   ├── frontend-doc.md           # 前端文档
│   └── backend-doc.md            # 服务端文档
├── client/                       # Electron + React 前端
│   ├── electron/                 # Electron主进程
│   │   ├── main.ts
│   │   └── preload.ts
│   ├── src/                      # React渲染进程
│   │   ├── components/           # 通用组件
│   │   ├── pages/                # 页面组件
│   │   ├── stores/               # Zustand状态
│   │   ├── hooks/                # 自定义Hook
│   │   ├── services/             # API服务层
│   │   ├── types/                # TypeScript类型
│   │   └── utils/                # 工具函数
│   └── package.json
├── server/                       # Express 服务端
│   ├── src/
│   │   ├── routes/               # API路由
│   │   ├── controllers/          # 控制器
│   │   ├── services/             # 业务逻辑层
│   │   ├── models/               # 数据模型
│   │   ├── middleware/           # 中间件
│   │   ├── socket/               # WebSocket处理
│   │   └── utils/                # 工具函数
│   ├── prisma/                   # Prisma Schema
│   └── package.json
└── shared/                       # 共享类型定义
    └── types/
```

## 快速开始

```bash
# 1. 克隆项目
git clone <repo-url> && cd mianshimaster

# 2. 安装前端依赖
cd client && npm install

# 3. 安装服务端依赖
cd ../server && npm install

# 4. 初始化数据库
npx prisma migrate dev

# 5. 启动开发模式
# 终端1 - 启动服务端
cd server && npm run dev

# 终端2 - 启动Electron客户端
cd client && npm run dev
```
