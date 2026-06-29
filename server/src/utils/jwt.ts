import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface JwtPayload {
  userId: string;
  username: string;
  role: string;
}

/**
 * 签发访问Token
 */
export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

/**
 * 签发刷新Token
 */
export function signRefreshToken(payload: { userId: string }): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
}

/**
 * 验证并解析Token
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
}

/**
 * 安全地验证Token，失败返回 null
 */
export function safeVerifyToken(token: string): JwtPayload | null {
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}
