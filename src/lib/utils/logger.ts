/**
 * Structured Logging System
 * Centralized logging with different levels and contexts
 */

import { DatabaseError } from '../types/database.types';

// ================================
// Log Levels
// ================================

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

// ================================
// Log Context Types
// ================================

export interface LogContext {
  module?: string;
  function?: string;
  userId?: number;
  alertId?: number;
  listingId?: number;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  duration?: number;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error | DatabaseError;
  stack?: string;
}

// ================================
// Logger Configuration
// ================================

interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  filepath?: string;
  maxFileSize?: number;
  maxFiles?: number;
  enableTimestamp: boolean;
  enableColors: boolean;
}

const DEFAULT_CONFIG: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: true,
  enableFile: false,
  enableTimestamp: true,
  enableColors: process.env.NODE_ENV !== 'production'
};

// ================================
// Color Configuration
// ================================

const COLORS = {
  [LogLevel.DEBUG]: '\x1b[36m', // Cyan
  [LogLevel.INFO]: '\x1b[32m',  // Green
  [LogLevel.WARN]: '\x1b[33m',  // Yellow
  [LogLevel.ERROR]: '\x1b[31m', // Red
  [LogLevel.FATAL]: '\x1b[35m'  // Magenta
};

const RESET_COLOR = '\x1b[0m';

// ================================
// Logger Class
// ================================

export class Logger {
  private config: LoggerConfig;
  private context: LogContext;

  constructor(context: LogContext = {}, config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.context = context;
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    return new Logger(
      { ...this.context, ...additionalContext },
      this.config
    );
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | DatabaseError, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Log fatal error message
   */
  fatal(message: string, error?: Error | DatabaseError, context?: LogContext): void {
    this.log(LogLevel.FATAL, message, context, error);
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error | DatabaseError
  ): void {
    if (level < this.config.level) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context },
      error,
      stack: error?.stack
    };

    if (this.config.enableConsole) {
      this.logToConsole(logEntry);
    }

    if (this.config.enableFile) {
      this.logToFile(logEntry);
    }
  }

  /**
   * Log to console with formatting
   */
  private logToConsole(entry: LogEntry): void {
    const levelName = LogLevel[entry.level];
    const timestamp = this.config.enableTimestamp ? `[${entry.timestamp}] ` : '';
    const color = this.config.enableColors ? COLORS[entry.level] : '';
    const reset = this.config.enableColors ? RESET_COLOR : '';
    
    let logMessage = `${color}${timestamp}${levelName}${reset}: ${entry.message}`;
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      logMessage += ` ${JSON.stringify(entry.context)}`;
    }
    
    console.log(logMessage);
    
    if (entry.error && entry.level >= LogLevel.ERROR) {
      console.error(entry.error);
    }
  }

  /**
   * Log to file (placeholder implementation)
   */
  private logToFile(entry: LogEntry): void {
    // TODO: Implement file logging if needed
    // This would require fs operations and file rotation
  }
}

// ================================
// Global Logger Instance
// ================================

export const logger = new Logger({ module: 'global' });

// ================================
// Specialized Loggers
// ================================

export const dbLogger = logger.child({ module: 'database' });
export const apiLogger = logger.child({ module: 'api' });
export const scraperLogger = logger.child({ module: 'scraper' });
export const matcherLogger = logger.child({ module: 'matcher' });
export const notifierLogger = logger.child({ module: 'notifier' });
export const jobLogger = logger.child({ module: 'jobs' });

// ================================
// Helper Functions
// ================================

/**
 * Log database operation
 */
export function logDatabaseOperation(
  operation: string,
  table: string,
  success: boolean,
  duration?: number,
  error?: DatabaseError
): void {
  const context: LogContext = {
    operation,
    table,
    duration
  };

  if (success) {
    dbLogger.info(`Database ${operation} on ${table} completed`, context);
  } else {
    dbLogger.error(`Database ${operation} on ${table} failed`, error, context);
  }
}

/**
 * Log API request
 */
export function logApiRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  context?: LogContext
): void {
  const logContext: LogContext = {
    method,
    path,
    statusCode,
    duration,
    ...context
  };

  const message = `${method} ${path} ${statusCode} ${duration}ms`;

  if (statusCode >= 500) {
    apiLogger.error(message, undefined, logContext);
  } else if (statusCode >= 400) {
    apiLogger.warn(message, logContext);
  } else {
    apiLogger.info(message, logContext);
  }
}

/**
 * Log scraping operation
 */
export function logScrapingOperation(
  source: string,
  success: boolean,
  listingsFound: number,
  duration: number,
  error?: Error
): void {
  const context: LogContext = {
    source,
    listingsFound,
    duration
  };

  if (success) {
    scraperLogger.info(`Scraping ${source} completed: ${listingsFound} listings found`, context);
  } else {
    scraperLogger.error(`Scraping ${source} failed`, error, context);
  }
}

/**
 * Log matching operation
 */
export function logMatchingOperation(
  alertId: number,
  matchCount: number,
  duration: number
): void {
  const context: LogContext = {
    alertId,
    matchCount,
    duration
  };

  matcherLogger.info(`Alert ${alertId} matching completed: ${matchCount} matches found`, context);
}

/**
 * Log notification operation
 */
export function logNotificationOperation(
  userId: number,
  alertId: number,
  listingCount: number,
  success: boolean,
  error?: Error
): void {
  const context: LogContext = {
    userId,
    alertId,
    listingCount
  };

  if (success) {
    notifierLogger.info(`Notification sent to user ${userId}: ${listingCount} listings`, context);
  } else {
    notifierLogger.error(`Notification failed for user ${userId}`, error, context);
  }
}

/**
 * Log job execution
 */
export function logJobExecution(
  jobName: string,
  success: boolean,
  duration: number,
  context?: LogContext,
  error?: Error
): void {
  const logContext: LogContext = {
    job: jobName,
    duration,
    ...context
  };

  if (success) {
    jobLogger.info(`Job ${jobName} completed successfully`, logContext);
  } else {
    jobLogger.error(`Job ${jobName} failed`, error, logContext);
  }
}

/**
 * Performance timer helper
 */
export function createTimer(): () => number {
  const start = Date.now();
  return () => Date.now() - start;
}

/**
 * Format duration in a human-readable way
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else {
    return `${(ms / 60000).toFixed(2)}m`;
  }
}

// ================================
// Request ID Generation
// ================================

export function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// ================================
// Export default logger
// ================================

export default logger;