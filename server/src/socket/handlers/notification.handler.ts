import { Server, Socket } from 'socket.io';
import { logger } from '../../utils/logger';

/**
 * 通知推送处理器
 * 用于向特定用户或所有在线用户推送通知
 */
export function setupNotificationHandler(io: Server): void {
  const namespace = io.of('/notifications');

  // userId -> socket 映射
  const userSockets = new Map<string, Set<string>>();

  namespace.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    logger.info('通知客户端连接', { socketId: socket.id, userId });

    // 注册用户连接
    if (userId) {
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId)!.add(socket.id);
    }

    // 加入用户专属房间
    if (userId) {
      socket.join(`user:${userId}`);
    }

    socket.on('disconnect', () => {
      if (userId) {
        const sockets = userSockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            userSockets.delete(userId);
          }
        }
      }
      logger.info('通知客户端断开', { socketId: socket.id });
    });
  });
}

/**
 * 向指定用户推送通知
 */
export function sendNotificationToUser(
  io: Server,
  userId: string,
  notification: {
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
  },
): void {
  io.of('/notifications').to(`user:${userId}`).emit('notification', notification);
}

/**
 * 向所有在线用户广播通知
 */
export function broadcastNotification(
  io: Server,
  notification: {
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
  },
): void {
  io.of('/notifications').emit('notification', notification);
}
