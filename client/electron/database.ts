import Database from 'better-sqlite3';
import { app, ipcMain } from 'electron';
import { join } from 'path';
import crypto from 'crypto';

const DB_PATH = join(app.getPath('userData'), 'mianshimaster.db');

let db: Database.Database;

export function setupDatabase(): void {
  db = new Database(DB_PATH);

  // 启用WAL模式提高性能
  db.pragma('journal_mode = WAL');

  // 初始化表结构
  db.exec(`
    -- 本地会话表（本地API模式使用）
    CREATE TABLE IF NOT EXISTS local_sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      started_at TEXT NOT NULL,
      ended_at TEXT,
      background_context TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 本地问题表
    CREATE TABLE IF NOT EXISTS local_questions (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      asker_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      priority INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      answered_at TEXT,
      FOREIGN KEY (session_id) REFERENCES local_sessions(id) ON DELETE CASCADE
    );

    -- 本地回答表
    CREATE TABLE IF NOT EXISTS local_answers (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL,
      content TEXT NOT NULL,
      model TEXT,
      tokens_used INTEGER,
      duration INTEGER,
      is_streamed INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (question_id) REFERENCES local_questions(id) ON DELETE CASCADE
    );

    -- 本地知识库表
    CREATE TABLE IF NOT EXISTS local_knowledge (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT DEFAULT '未分类',
      tags TEXT DEFAULT '[]',
      source_file TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 本地配置表（加密存储）
    CREATE TABLE IF NOT EXISTS local_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- 索引
    CREATE INDEX IF NOT EXISTS idx_local_questions_session
      ON local_questions(session_id, priority, created_at);
    CREATE INDEX IF NOT EXISTS idx_local_knowledge_category
      ON local_knowledge(category);
  `);

  // IPC: 数据库查询
  ipcMain.handle('db:query', (_event, sql: string, params?: unknown[]) => {
    try {
      const stmt = db.prepare(sql);
      return params ? stmt.all(...params) : stmt.all();
    } catch (error) {
      console.error('DB Query Error:', error);
      throw error;
    }
  });

  ipcMain.handle('db:execute', (_event, sql: string, params?: unknown[]) => {
    try {
      const stmt = db.prepare(sql);
      return params ? stmt.run(...params) : stmt.run();
    } catch (error) {
      console.error('DB Execute Error:', error);
      throw error;
    }
  });

  ipcMain.handle('db:run', (_event, sql: string, params?: unknown[]) => {
    try {
      return db.transaction(() => {
        const stmt = db.prepare(sql);
        return params ? stmt.run(...params) : stmt.run();
      })();
    } catch (error) {
      console.error('DB Transaction Error:', error);
      throw error;
    }
  });
}

// 加密工具
export function encryptValue(value: string, key: string): string {
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    crypto.scryptSync(key, 'salt', 32),
    crypto.randomBytes(16)
  );
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([authTag, encrypted]).toString('base64');
}

export function getDB(): Database.Database {
  return db;
}
