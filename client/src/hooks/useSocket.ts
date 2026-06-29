import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  namespace?: string;
  auth?: { token?: string };
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

/**
 * WebSocket 连接管理 Hook
 */
export function useSocket(options: UseSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const { namespace = '/workspace', auth } = options;

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const socket = io(`${baseUrl}${namespace}`, {
      auth: auth || {},
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`[Socket] 已连接: ${namespace}`);
      options.onConnect?.();
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] 已断开: ${namespace}`);
      options.onDisconnect?.();
    });

    socket.on('connect_error', (err) => {
      console.error(`[Socket] 连接错误: ${namespace}`, err.message);
      options.onError?.(err);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [namespace]);

  const emit = useCallback(
    (event: string, data?: unknown) => {
      socketRef.current?.emit(event, data);
    },
    [],
  );

  const on = useCallback(
    (event: string, handler: (...args: any[]) => void) => {
      socketRef.current?.on(event, handler);
      return () => {
        socketRef.current?.off(event, handler);
      };
    },
    [],
  );

  return {
    socket: socketRef.current,
    emit,
    on,
    isConnected: socketRef.current?.connected ?? false,
  };
}
