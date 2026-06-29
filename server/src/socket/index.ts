import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { setupWorkspaceHandler } from './handlers/workspace.handler';
import { setupNotificationHandler } from './handlers/notification.handler';
import { logger } from '../utils/logger';
import { config } from '../config';

const JWT_SECRET = config.jwt.secret;

export function setupSocket(server: HttpServer): Server {
  const io = new Server(server, {
    cors: {
      origin: config.cors.origin,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // 工作台命名空间 - 认证中间件
  io.of('/workspace').use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('未提供认证令牌'));
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      (socket as any).userId = decoded.userId;
      next();
    } catch {
      next(new Error('认证令牌无效'));
    }
  });

  // 通知命名空间 - 认证中间件
  io.of('/notifications').use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        (socket as any).userId = decoded.userId;
      } catch {
        // 通知是可选的，认证失败不阻止连接
      }
    }
    next();
  });

  // 注册各命名空间的事件处理器
  setupWorkspaceHandler(io);
  setupNotificationHandler(io);

  logger.info('Socket.IO 初始化完成 (workspace + notifications)');

  return io;
}
