/**
 * Simple, structured logging utility.
 * Focuses on clarity, debuggability, and tracing method flow.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  context: string;
  message: string;
  data?: any;
  timestamp: string;
}

const COLORS = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
  reset: '\x1b[0m'
};

class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private log(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      level,
      context: this.context,
      message,
      data,
      timestamp: new Date().toISOString()
    };

    const dataStr = data ? ` | Data: ${JSON.stringify(data)}` : '';
    console[level](`[${entry.timestamp}] [${level.toUpperCase()}] [${this.context}] ${message}${dataStr}`);
  }

  debug(message: string, data?: any) { this.log('debug', message, data); }
  info(message: string, data?: any) { this.log('info', message, data); }
  warn(message: string, data?: any) { this.log('warn', message, data); }
  error(message: string, data?: any) { this.log('error', message, data); }
}

export const createLogger = (context: string) => new Logger(context);
