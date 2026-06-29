import bcryptjs from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

/**
 * 哈希密码
 */
export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, SALT_ROUNDS);
}

/**
 * 验证密码
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

/**
 * 生成匿名提问者ID（单向哈希，不可逆）
 */
export function generateAnonymizedId(identifier: string): string {
  return crypto
    .createHash('sha256')
    .update(identifier + crypto.randomBytes(8).toString('hex'))
    .digest('hex')
    .substring(0, 64);
}

/**
 * 对敏感数据进行 AES-256-GCM 加密
 */
export function encryptSensitive(text: string, secretKey: string): string {
  const key = crypto.scryptSync(secretKey, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

/**
 * 解密 AES-256-GCM 加密数据
 */
export function decryptSensitive(encryptedText: string, secretKey: string): string {
  const key = crypto.scryptSync(secretKey, 'salt', 32);
  const data = Buffer.from(encryptedText, 'base64');
  const iv = data.subarray(0, 16);
  const authTag = data.subarray(16, 32);
  const encrypted = data.subarray(32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}
