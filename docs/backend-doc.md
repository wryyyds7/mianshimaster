# 服务端文档 — 面试大师

## 一、技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 20+ | 运行时 |
| Express.js | 4.19+ | Web框架 |
| TypeScript | 5.5+ | 类型系统 |
| Prisma | 5.18+ | ORM |
| PostgreSQL | 15+ | 关系型数据库 |
| Socket.IO | 4.7+ | WebSocket实时通信 |
| JWT | 9.0+ | JSON Web Token认证 |
| bcryptjs | 2.4+ | 密码哈希 |
| multer | 1.4+ | 文件上传中间件 |
| LangChain | 0.2+ | AI模型集成 |
| zod | 3.23+ | 请求参数校验 |

## 二、服务端目录结构

```
server/
├── src/
│   ├── index.ts                  # 服务入口
│   ├── app.ts                    # Express应用配置
│   │
│   ├── config/
│   │   └── index.ts              # 环境变量/配置
│   │
│   ├── routes/
│   │   ├── index.ts              # 路由汇总
│   │   ├── auth.routes.ts        # 认证路由
│   │   ├── session.routes.ts     # 会话路由
│   │   ├── knowledge.routes.ts   # 知识库路由
│   │   ├── ai.routes.ts          # AI代理路由
│   │   ├── file.routes.ts        # 文件上传路由
│   │   └── contact.routes.ts     # 联系我们路由
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── session.controller.ts
│   │   ├── knowledge.controller.ts
│   │   ├── ai.controller.ts
│   │   ├── file.controller.ts
│   │   └── contact.controller.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts       # 认证业务逻辑
│   │   ├── session.service.ts    # 会话业务逻辑
│   │   ├── knowledge.service.ts  # 知识库业务逻辑
│   │   ├── ai.service.ts         # AI调用服务
│   │   └── file.service.ts       # 文件处理服务
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts     # JWT认证中间件
│   │   ├── rateLimiter.ts        # 速率限制
│   │   ├── errorHandler.ts       # 全局错误处理
│   │   └── validator.ts          # 请求校验中间件
│   │
│   ├── socket/
│   │   ├── index.ts              # Socket.IO初始化
│   │   └── handlers/
│   │       ├── workspace.handler.ts  # 工作台WebSocket处理
│   │       └── notification.handler.ts
│   │
│   ├── utils/
│   │   ├── jwt.ts                # JWT工具函数
│   │   ├── hash.ts               # 加密工具
│   │   ├── fileParser.ts         # 文件内容提取
│   │   └── idGenerator.ts        # ID生成器
│   │
│   └── types/
│       ├── express.d.ts          # Express类型扩展
│       └── socket.d.ts           # Socket类型扩展
│
├── prisma/
│   └── schema.prisma             # 数据库Schema
│
├── uploads/                      # 上传文件存储
├── .env                          # 环境变量
├── .env.example                  # 环境变量模板
├── tsconfig.json
└── package.json
```

## 三、数据库设计

### 3.1 Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ========== 用户表 ==========
model User {
  id            String    @id @default(uuid())
  username      String    @unique @db.VarChar(50)
  email         String    @unique @db.VarChar(255)
  passwordHash  String    @map("password_hash") @db.VarChar(255)
  role          Role      @default(USER)
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  // 关联
  sessions      Session[]
  knowledgeItems KnowledgeItem[]
  apiConfigs    ApiConfig[]

  @@map("users")
}

enum Role {
  USER
  ADMIN
}

// ========== API配置表 ==========
model ApiConfig {
  id          String    @id @default(uuid())
  userId      String    @map("user_id")
  provider    String    @db.VarChar(50)    // openai / claude / custom
  apiKey      String    @map("api_key") @db.VarChar(512) // 加密存储
  baseUrl     String    @map("base_url") @db.VarChar(255)
  model       String    @db.VarChar(100)
  temperature Float     @default(0.7)
  maxTokens   Int       @default(4096) @map("max_tokens")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  user        User      @relation(fields: [userId], references: [id])

  @@map("api_configs")
}

// ========== 会话表 ==========
model Session {
  id            String    @id @default(uuid())
  userId        String    @map("user_id")
  title         String    @db.VarChar(255)  // 会话标题
  status        SessionStatus @default(ACTIVE)
  startedAt     DateTime  @map("started_at")
  endedAt       DateTime? @map("ended_at")
  createdAt     DateTime  @default(now()) @map("created_at")

  // 关联
  user          User      @relation(fields: [userId], references: [id])
  backgroundFiles BackgroundFile[]
  questions     Question[]

  @@index([userId, startedAt])
  @@map("sessions")
}

enum SessionStatus {
  ACTIVE    // 进行中
  ENDED     // 已结束
}

// ========== 背景文件表 ==========
model BackgroundFile {
  id          String    @id @default(uuid())
  sessionId   String    @map("session_id")
  fileName    String    @map("file_name") @db.VarChar(255)
  fileType    String    @map("file_type") @db.VarChar(50)
  fileSize    Int       @map("file_size")          // 字节
  contentText String    @map("content_text") @db.Text  // 提取的文本内容
  filePath    String    @map("file_path") @db.VarChar(500)
  createdAt   DateTime  @default(now()) @map("created_at")

  session     Session   @relation(fields: [sessionId], references: [id])

  @@map("background_files")
}

// ========== 问题表 ==========
model Question {
  id              String    @id @default(uuid())
  sessionId       String    @map("session_id")
  askerId         String    @map("asker_id") @db.VarChar(64)  // 提问者匿名hash(不可追溯)
  title           String    @db.VarChar(255)
  content         String    @db.Text
  priority        Int       @default(0)    // 优先级(新问题最高)
  status          QuestionStatus @default(PENDING)
  createdAt       DateTime  @default(now()) @map("created_at")
  answeredAt      DateTime? @map("answered_at")

  session         Session   @relation(fields: [sessionId], references: [id])
  answers         Answer[]

  @@index([sessionId, priority, createdAt])
  @@map("questions")
}

enum QuestionStatus {
  PENDING     // 待回答
  ANSWERING   // 回答中
  ANSWERED    // 已回答
  CANCELLED   // 已取消
}

// ========== 回答表 ==========
model Answer {
  id            String    @id @default(uuid())
  questionId    String    @map("question_id")
  content       String    @db.Text
  model         String    @db.VarChar(100)   // 使用的AI模型
  tokensUsed    Int?      @map("tokens_used")
  duration      Int?                        // 生成耗时(ms)
  isStreamed    Boolean   @default(true) @map("is_streamed")
  createdAt     DateTime  @default(now()) @map("created_at")

  question      Question  @relation(fields: [questionId], references: [id])

  @@map("answers")
}

// ========== 知识库条目表 ==========
model KnowledgeItem {
  id          String    @id @default(uuid())
  userId      String    @map("user_id")
  title       String    @db.VarChar(255)
  content     String    @db.Text          // Markdown格式
  category    String    @db.VarChar(100)
  tags        String[]  @db.VarChar(50)[]  // PostgreSQL数组类型
  sourceFile  String?   @map("source_file") @db.VarChar(255) // 原始文件名
  isPublic    Boolean   @default(false) @map("is_public")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  user        User      @relation(fields: [userId], references: [id])

  @@index([userId, category])
  @@index([userId, title])
  @@map("knowledge_items")
}

// ========== 反馈表 ==========
model Feedback {
  id          String    @id @default(uuid())
  userId      String?   @map("user_id")   // 可选，允许匿名反馈
  type        FeedbackType
  title       String    @db.VarChar(255)
  content     String    @db.Text
  contact     String?   @db.VarChar(255)  // 联系方式
  isResolved  Boolean   @default(false) @map("is_resolved")
  createdAt   DateTime  @default(now()) @map("created_at")

  @@map("feedbacks")
}

enum FeedbackType {
  BUG        // Bug报告
  FEATURE    // 功能建议
  QUESTION   // 使用疑问
  OTHER      // 其他
}
```

### 3.2 ER关系图

```
users ──1:N── sessions
users ──1:N── knowledge_items
users ──1:N── api_configs

sessions ──1:N── background_files
sessions ──1:N── questions

questions ──1:N── answers

feedbacks (独立表)
```

## 四、API接口设计

### 4.1 接口总览

| 模块 | 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|------|
| **认证** | POST | `/api/auth/register` | 注册 | ✗ |
| | POST | `/api/auth/login` | 登录 | ✗ |
| | POST | `/api/auth/refresh` | 刷新Token | ✗ |
| | GET | `/api/auth/me` | 获取当前用户 | ✓ |
| **会话** | POST | `/api/sessions` | 创建会话 | ✓ |
| | GET | `/api/sessions` | 会话列表 | ✓ |
| | GET | `/api/sessions/:id` | 会话详情 | ✓ |
| | PUT | `/api/sessions/:id/end` | 结束会话 | ✓ |
| | DELETE | `/api/sessions/:id` | 删除会话 | ✓ |
| **问题** | POST | `/api/sessions/:id/questions` | 创建问题 | ✗ |
| | GET | `/api/sessions/:id/questions` | 问题列表 | ✓ |
| | GET | `/api/questions/:id` | 问题详情 | ✓ |
| **AI** | POST | `/api/ai/chat` | AI对话(流式) | * |
| | POST | `/api/ai/chat/sync` | AI对话(同步) | * |
| **文件** | POST | `/api/files/upload` | 上传文件 | ✓ |
| | GET | `/api/files/:id/content` | 获取文件内容 | ✓ |
| **知识库** | POST | `/api/knowledge` | 创建条目 | ✓ |
| | GET | `/api/knowledge` | 条目列表 | ✓ |
| | GET | `/api/knowledge/:id` | 条目详情 | ✓ |
| | PUT | `/api/knowledge/:id` | 更新条目 | ✓ |
| | DELETE | `/api/knowledge/:id` | 删除条目 | ✓ |
| | GET | `/api/knowledge/search` | 搜索 | ✓ |
| **反馈** | POST | `/api/feedback` | 提交反馈 | ✗ |

*AI接口：本地模式无需认证，服务器模式需JWT

### 4.2 核心接口详情

#### 4.2.1 创建会话

```
POST /api/sessions
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

Request:
  title: string              // 会话标题
  files: File[]              // 背景文件(可选)

Response 201:
{
  "code": 0,
  "data": {
    "id": "uuid",
    "title": "2024年技术面试",
    "status": "ACTIVE",
    "startedAt": "2024-01-15T10:30:00Z",
    "backgroundFiles": [
      {
        "id": "uuid",
        "fileName": "面试提纲.pdf",
        "fileSize": 2048000,
        "contentText": "提取的文本内容..."
      }
    ]
  }
}
```

#### 4.2.2 创建问题（提问者匿名提交）

```
POST /api/sessions/:id/questions
// 无需JWT认证（提问者匿名）
Content-Type: application/json

Request:
{
  "title": "关于React Hooks的问题",
  "content": "请问useEffect和useLayoutEffect有什么区别？"
}

Response 201:
{
  "code": 0,
  "data": {
    "id": "uuid",
    "title": "关于React Hooks的问题",
    "status": "PENDING",
    "createdAt": "2024-01-15T10:35:00Z"
  }
}

// 同时通过WebSocket推送给回答者
// Socket事件: workspace:new-question
```

#### 4.2.3 AI对话（流式SSE）

```
POST /api/ai/chat
Authorization: Bearer <token>  (服务器模式)
Content-Type: application/json

Request:
{
  "sessionId": "uuid",
  "questionId": "uuid",
  "model": "gpt-4o",
  "temperature": 0.7,
  "knowledgeIds": ["uuid1", "uuid2"],  // 选用的知识库条目
  "messages": [
    { "role": "system", "content": "你是面试助手..." },  // 背景文件上下文
    { "role": "user", "content": "请问..." }
  ]
}

Response (SSE Stream):
  Content-Type: text/event-stream

  data: {"type":"start","questionId":"uuid"}

  data: {"type":"chunk","content":"useEffect"}

  data: {"type":"chunk","content":"和useLayoutEffect"}

  data: {"type":"done","questionId":"uuid","tokensUsed":150,"duration":2300}
```

### 4.3 统一响应格式

```typescript
// 成功响应
interface ApiResponse<T> {
  code: 0;
  data: T;
  message?: string;
}

// 错误响应
interface ApiError {
  code: number;         // 错误码
  message: string;      // 错误信息
  details?: any;        // 详细信息
}

// 错误码定义
const ErrorCodes = {
  UNAUTHORIZED: 401,       // 未认证
  FORBIDDEN: 403,          // 无权限
  NOT_FOUND: 404,          // 资源不存在
  CONFLICT: 409,           // 资源冲突
  VALIDATION_ERROR: 422,   // 参数校验失败
  RATE_LIMIT: 429,         // 请求频率限制
  INTERNAL_ERROR: 500,     // 服务器内部错误
  AI_SERVICE_ERROR: 502,   // AI服务错误
};
```

## 五、WebSocket设计

### 5.1 命名空间与事件

```
命名空间: /workspace
─────────────────────────────────────────

客户端 → 服务端:
  workspace:join         加入工作台房间
    payload: { sessionId: string }

  workspace:leave        离开工作台
    payload: { sessionId: string }

  workspace:new-question 新问题通知
    payload: { sessionId, questionId, title, content }


服务端 → 客户端:
  workspace:question-added  通知新问题
    payload: { question: QuestionItem }

  workspace:answer-stream   流式回答推送
    payload: { questionId, chunk: string }

  workspace:answer-complete 回答完成
    payload: { questionId, answer: AnswerItem }

  workspace:error           错误通知
    payload: { message: string, code: number }
```

### 5.2 Socket事件流

```
提问者                          服务器                        回答者
  │                               │                              │
  │── POST /questions ───────────▶│                              │
  │                               │── workspace:question-added ─▶│
  │                               │                              │
  │                               │◀── AI生成回答 ──────────────│
  │                               │                              │
  │                               │── workspace:answer-stream ──▶│
  │◀── SSE chunk ────────────────│    (流式)                    │
  │◀── SSE chunk ────────────────│                              │
  │◀── SSE done ─────────────────│── workspace:answer-complete ▶│
  │                               │                              │
```

## 六、AI服务设计

### 6.1 LangChain集成

```typescript
// services/ai.service.ts
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

class AIService {
  private getModel(config: ApiConfig) {
    switch (config.provider) {
      case 'openai':
        return new ChatOpenAI({
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          apiKey: config.apiKey,
          configuration: { baseURL: config.baseUrl },
          streaming: true,
        });
      case 'claude':
        return new ChatAnthropic({
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          apiKey: config.apiKey,
          streaming: true,
        });
      default:
        // 自定义兼容OpenAI接口的服务
        return new ChatOpenAI({
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          apiKey: config.apiKey,
          configuration: { baseURL: config.baseUrl },
          streaming: true,
        });
    }
  }

  async streamChat(
    config: ApiConfig,
    systemPrompt: string,    // 背景文件上下文 + 知识库内容
    userMessage: string,
    onChunk: (chunk: string) => void,
    onComplete: (result: AIResult) => void,
    onError: (error: Error) => void,
  ) {
    try {
      const model = this.getModel(config);
      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userMessage),
      ];

      const stream = await model.stream(messages);
      let fullContent = '';
      let tokenCount = 0;

      for await (const chunk of stream) {
        const content = typeof chunk.content === 'string' ? chunk.content : '';
        if (content) {
          fullContent += content;
          tokenCount++;
          onChunk(content);
        }
      }

      onComplete({
        content: fullContent,
        tokensUsed: tokenCount,
      });
    } catch (error) {
      onError(error as Error);
    }
  }

  async chat(
    config: ApiConfig,
    systemPrompt: string,
    userMessage: string,
  ): Promise<AIResult> {
    const model = this.getModel(config);
    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(userMessage),
    ];
    const response = await model.invoke(messages);
    return {
      content: typeof response.content === 'string' ? response.content : '',
      tokensUsed: response.usage_metadata?.total_tokens,
    };
  }
}
```

### 6.2 上下文构建策略

```
AI请求上下文构建（优先级从高到低）：
┌─────────────────────────────────────────┐
│ 1. 系统指令（角色设定、身份隔离提示）      │ ← 固定
├─────────────────────────────────────────┤
│ 2. 背景文件内容（上传的PDF/Word文本）      │ ← 会话级：不变
├─────────────────────────────────────────┤
│ 3. 知识库选中条目（回答者勾选的知识）       │ ← 问题级：可选
├─────────────────────────────────────────┤
│ 4. 当前问题历史（同一问题的多轮对话）       │ ← 问题级：累积
├─────────────────────────────────────────┤
│ 5. 用户当前消息                          │ ← 每条新消息
└─────────────────────────────────────────┘

Token预算分配：
- 系统指令：200 tokens
- 背景文件：最多 8000 tokens
- 知识库：最多 4000 tokens
- 对话历史：最多 4000 tokens
- 用户消息：剩余空间
```

## 七、安全中间件

### 7.1 JWT认证中间件

```typescript
// middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
  username: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ code: 401, message: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ code: 401, message: '认证令牌无效或已过期' });
  }
};

// 可选的匿名+认证混合中间件（用于AI接口）
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    } catch {}
  }
  next();
};
```

## 八、环境变量

```bash
# .env.example
# 服务端口
PORT=3001
NODE_ENV=development

# 数据库
DATABASE_URL="postgresql://postgres:password@localhost:5432/mianshimaster?schema=public"

# JWT
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"

# AI默认配置(服务器模式)
AI_PROVIDER="openai"           # openai / claude / custom
AI_MODEL="gpt-4o"
AI_BASE_URL="https://api.openai.com/v1"
AI_MAX_TOKENS=4096
AI_TEMPERATURE=0.7

# 文件上传
MAX_FILE_SIZE=52428800         # 50MB
UPLOAD_DIR="./uploads"

# CORS
CORS_ORIGIN="http://localhost:5173"

# 速率限制
RATE_LIMIT_WINDOW_MS=60000     # 1分钟
RATE_LIMIT_MAX_REQUESTS=100
```
