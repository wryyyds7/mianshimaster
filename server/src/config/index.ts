import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/mianshimaster',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  ai: {
    provider: process.env.AI_PROVIDER || 'openai',
    defaultModel: process.env.AI_MODEL || 'gpt-4o',
    baseUrl: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4096', 10),
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10), // 50MB
    uploadDir: process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads'),
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
} as const;

export type AppConfig = typeof config;
