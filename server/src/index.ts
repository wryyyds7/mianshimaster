import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { createApp } from './app';
import { setupSocket } from './socket';

const PORT = process.env.PORT || 3001;

async function bootstrap() {
  const app = createApp();
  const server = createServer(app);

  // 初始化WebSocket
  setupSocket(server);

  server.listen(PORT, () => {
    console.log(`🚀 面试大师服务端已启动: http://localhost:${PORT}`);
    console.log(`📡 环境: ${process.env.NODE_ENV || 'development'}`);
  });
}

bootstrap().catch((error) => {
  console.error('服务启动失败:', error);
  process.exit(1);
});
