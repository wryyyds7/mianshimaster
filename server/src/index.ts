import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { createApp } from './app';
import { setupSocket } from './socket';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3001;

// 环境变量校验
function validateEnv(): void {
  const requiredInProd = ['JWT_SECRET'];
  if (process.env.NODE_ENV === 'production') {
    for (const key of requiredInProd) {
      if (!process.env[key]) {
        throw new Error(`缺少必需的环境变量: ${key}`);
      }
    }
  }
  logger.info('环境变量校验通过');
}

async function bootstrap() {
  validateEnv();

  const app = createApp();
  const server = createServer(app);

  // 初始化WebSocket
  setupSocket(server);

  // 优雅关闭
  const shutdown = (signal: string) => {
    logger.info(`收到 ${signal} 信号，开始优雅关闭...`);
    server.close(() => {
      logger.info('HTTP 服务已关闭');
      process.exit(0);
    });
    // 强制退出超时
    setTimeout(() => {
      logger.error('强制退出（超时）');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  server.listen(PORT, () => {
    logger.info('面试大师服务端已启动', {
      port: PORT,
      env: process.env.NODE_ENV || 'development',
    });
  });
}

bootstrap().catch((error) => {
  logger.error('服务启动失败', { error: (error as Error).message });
  process.exit(1);
});
