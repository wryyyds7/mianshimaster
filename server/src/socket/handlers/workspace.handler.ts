import { Server, Socket } from 'socket.io';
import { logger } from '../../utils/logger';

export interface ActiveSession {
  sessionId: string;
  /** 连接到此会话的所有 socket ID */
  clients: Set<string>;
}

/**
 * 工作台 WebSocket 处理器
 * 管理多人协作面试工作台的实时通信
 */
export function setupWorkspaceHandler(io: Server): void {
  const namespace = io.of('/workspace');

  // 内存中的活跃会话映射（sessionId -> 活跃数据）
  const activeSessions = new Map<string, ActiveSession>();

  namespace.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId || 'anonymous';
    logger.info('工作台客户端连接', {
      socketId: socket.id,
      userId,
    });

    // ===== 加入工作台房间 =====
    socket.on('workspace:join', (payload: { sessionId: string }) => {
      const { sessionId } = payload;
      socket.join(`session:${sessionId}`);

      if (!activeSessions.has(sessionId)) {
        activeSessions.set(sessionId, {
          sessionId,
          clients: new Set(),
        });
      }
      activeSessions.get(sessionId)!.clients.add(socket.id);

      logger.info('用户加入工作台', {
        socketId: socket.id,
        sessionId,
        totalClients: activeSessions.get(sessionId)!.clients.size,
      });

      // 通知房间内其他成员
      socket.to(`session:${sessionId}`).emit('workspace:user-joined', {
        userId,
        sessionId,
      });
    });

    // ===== 离开工作台房间 =====
    socket.on('workspace:leave', (payload: { sessionId: string }) => {
      const { sessionId } = payload;
      socket.leave(`session:${sessionId}`);

      const session = activeSessions.get(sessionId);
      if (session) {
        session.clients.delete(socket.id);
        if (session.clients.size === 0) {
          activeSessions.delete(sessionId);
        }
      }

      socket.to(`session:${sessionId}`).emit('workspace:user-left', {
        userId,
        sessionId,
      });
    });

    // ===== 新问题通知 =====
    socket.on(
      'workspace:new-question',
      (payload: {
        sessionId: string;
        questionId: string;
        title: string;
        content: string;
      }) => {
        const { sessionId } = payload;

        // 广播给房间内的其他客户端
        socket.to(`session:${sessionId}`).emit('workspace:question-added', {
          question: {
            id: payload.questionId,
            title: payload.title,
            content: payload.content,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
          },
        });

        logger.info('新问题已推送到工作台', {
          sessionId,
          questionId: payload.questionId,
        });
      },
    );

    // ===== 断开连接 =====
    socket.on('disconnect', () => {
      // 清理所有活跃会话
      activeSessions.forEach((session, sessionId) => {
        if (session.clients.has(socket.id)) {
          session.clients.delete(socket.id);
          if (session.clients.size === 0) {
            activeSessions.delete(sessionId);
          }
        }
      });
      logger.info('工作台客户端断开', { socketId: socket.id });
    });
  });
}

/**
 * 向指定会话的房间广播消息的工具函数
 */
export function broadcastToSession(
  io: Server,
  sessionId: string,
  event: string,
  data: unknown,
): void {
  io.of('/workspace').to(`session:${sessionId}`).emit(event, data);
}
