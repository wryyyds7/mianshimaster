import { v4 as uuidv4 } from 'uuid';
import { customAlphabet } from 'nanoid';

/**
 * 生成标准 UUID v4
 */
export function generateUUID(): string {
  return uuidv4();
}

/**
 * 生成短ID（适合会话码、短链接等场景）
 * 默认12位字母数字
 */
const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  12,
);

export function generateShortId(length = 12): string {
  if (length !== 12) {
    return customAlphabet(
      '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
      length,
    )();
  }
  return nanoid();
}

/**
 * 生成会话邀请码（6位纯数字）
 */
const sessionCodeGen = customAlphabet('0123456789', 6);
export function generateSessionCode(): string {
  return sessionCodeGen();
}

/**
 * 生成带时间戳的唯一ID
 * 格式: yyyymmddhhmmss-随机6位
 */
export function generateTimestampId(): string {
  const now = new Date();
  const timestamp =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0');
  return `${timestamp}-${sessionCodeGen()}`;
}
