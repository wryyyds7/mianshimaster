import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { requestIdMiddleware } from './middleware/requestId';
import { logger } from './utils/logger';
import routes from './routes';

export function createApp(): express.Application {
  const app = express();

  // 请求ID (必须在最前面)
  app.use(requestIdMiddleware);

  // 安全中间件
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // CORS
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }));

  // 请求解析
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // 请求日志
  app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.path}`, { requestId: req.requestId });
    next();
  });

  // 速率限制
  app.use('/api', rateLimiter);

  // 路由
  app.use('/api', routes);

  // 健康检查
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 就绪检查
  app.get('/ready', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  // 全局错误处理
  app.use(errorHandler);

  return app;
}
