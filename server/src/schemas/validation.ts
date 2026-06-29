import { z } from 'zod';

// ========== 认证相关 ==========

export const registerSchema = z.object({
  username: z
    .string()
    .min(2, '用户名至少2个字符')
    .max(50, '用户名最多50个字符')
    .regex(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, '用户名只能包含中英文、数字和下划线'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z
    .string()
    .min(6, '密码长度不能少于6位')
    .max(100, '密码长度不能超过100位'),
});

export const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, '刷新令牌不能为空'),
});

// ========== 会话相关 ==========

export const createSessionSchema = z.object({
  title: z
    .string()
    .min(1, '请输入会话标题')
    .max(255, '标题最多255个字符'),
});

export const sessionIdParam = z.object({
  id: z.string().uuid('无效的会话ID'),
});

// ========== 问题相关 ==========

export const createQuestionSchema = z.object({
  title: z
    .string()
    .min(1, '请输入问题标题')
    .max(255, '标题最多255个字符'),
  content: z
    .string()
    .min(1, '请输入问题内容')
    .max(10000, '问题内容最多10000个字符'),
});

// ========== AI对话相关 ==========

export const aiChatSchema = z.object({
  sessionId: z.string().uuid('无效的会话ID').optional(),
  questionId: z.string().uuid('无效的问题ID').optional(),
  model: z.string().max(100).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(32768).optional(),
  baseUrl: z.string().url().optional(),
  knowledgeIds: z.array(z.string().uuid()).max(20).optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(['system', 'user', 'assistant']),
        content: z.string().min(1),
      }),
    )
    .min(1, '消息列表不能为空')
    .max(100, '消息数量超过限制'),
});

// ========== 知识库相关 ==========

export const createKnowledgeSchema = z.object({
  title: z.string().min(1, '请输入标题').max(255),
  content: z.string().min(1, '请输入内容').max(100000),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  isPublic: z.boolean().optional(),
});

export const updateKnowledgeSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).max(100000).optional(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  isPublic: z.boolean().optional(),
});

export const knowledgeSearchSchema = z.object({
  keyword: z.string().min(1, '请输入搜索关键词').max(200),
  category: z.string().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional().default(0),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const knowledgeIdParam = z.object({
  id: z.string().uuid('无效的知识库条目ID'),
});

// ========== 反馈/联系我们 ==========

export const feedbackSchema = z.object({
  type: z.enum(['BUG', 'FEATURE', 'QUESTION', 'OTHER'], {
    errorMap: () => ({ message: '请选择反馈类型' }),
  }),
  title: z.string().min(1, '请输入标题').max(255),
  content: z.string().min(1, '请输入内容').max(5000),
  contact: z.string().max(255).optional(),
});

// ========== 分页参数 ==========

export const paginationSchema = z.object({
  offset: z.coerce.number().int().min(0).optional().default(0),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});
