import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export function setupSocket(server: HttpServer): Server {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // 工作台命名空间
  const workspaceIO = io.of('/workspace');

  // 认证中间件
  workspaceIO.use((socket, next) => {
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

  workspaceIO.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    console.log(`[WebSocket] 用户连接: ${userId}`);

    // 加入工作台房间
    socket.on('workspace:join', (data: { sessionId: string }) => {
      socket.join(`session:${data.sessionId}`);
      console.log(`[WebSocket] 用户 ${userId} 加入会话 ${data.sessionId}`);
    });

    // 离开工作台
    socket.on('workspace:leave', (data: { sessionId: string }) => {
      socket.leave(`session:${data.sessionId}`);
    });

    // 新问题通知（模拟提问者提交后广播给回答者）
    socket.on('workspace:new-question', (data: {
      sessionId: string;
      questionId: string;
      title: string;
      content: string;
    }) => {
      // 广播给会话房间内的回答者
      socket.to(`session:${data.sessionId}`).emit('workspace:question-added', {
        question: {
          id: data.questionId,
          sessionId: data.sessionId,
          title: data.title,
          content: data.content,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        },
      });
    });

    // 断线处理
    socket.on('disconnect', () => {
      console.log(`[WebSocket] 用户断开: ${userId}`);
    });
  });

  return io;
}
