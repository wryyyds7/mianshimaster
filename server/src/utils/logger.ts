type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  level: LogLevel;
  msg: string;
  timestamp: string;
  requestId?: string;
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL as LogLevel] ?? LOG_LEVELS.info;

function log(level: LogLevel, msg: string, meta?: Record<string, unknown>): void {
  if (LOG_LEVELS[level] > CURRENT_LEVEL) return;

  const entry: LogEntry = {
    level,
    msg,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) => log('debug', msg, meta),
};
