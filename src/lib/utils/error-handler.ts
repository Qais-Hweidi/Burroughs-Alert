/**
 * Error Handling Utilities
 * Centralized error handling and API error responses
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { DatabaseError } from '../types/database.types';
import { ApiResponse, ApiError, ApiErrorCode } from '../types/api.types';
import { ERROR_CODES, HTTP_STATUS } from './constants';
import { logger } from './logger';

// ================================
// Error Classes
// ================================

export class ApplicationError extends Error {
  public readonly code: ApiErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(
    message: string,
    code: ApiErrorCode,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    details?: any
  ) {
    super(message);
    this.name = 'ApplicationError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApplicationError);
    }
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(message, ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier 
      ? `${resource} with ID ${identifier} not found`
      : `${resource} not found`;
    super(message, getNotFoundErrorCode(resource), HTTP_STATUS.NOT_FOUND);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(message, ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.CONFLICT, details);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends ApplicationError {
  constructor(message: string = 'Too many requests') {
    super(message, ERROR_CODES.RATE_LIMIT_EXCEEDED, HTTP_STATUS.TOO_MANY_REQUESTS);
    this.name = 'RateLimitError';
  }
}

// ================================
// Error Helper Functions
// ================================

function getNotFoundErrorCode(resource: string): ApiErrorCode {
  switch (resource.toLowerCase()) {
    case 'user':
      return ERROR_CODES.USER_NOT_FOUND;
    case 'alert':
      return ERROR_CODES.ALERT_NOT_FOUND;
    case 'listing':
      return ERROR_CODES.LISTING_NOT_FOUND;
    default:
      return ERROR_CODES.INTERNAL_ERROR;
  }
}

// ================================
// Error Processing Functions
// ================================

/**
 * Process and categorize different types of errors
 */
export function processError(error: unknown): ApplicationError {
  // Handle known application errors
  if (error instanceof ApplicationError) {
    return error;
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }));
    
    return new ValidationError(
      'Input validation failed',
      details
    );
  }

  // Handle database errors
  if (isDatabaseError(error)) {
    return new ApplicationError(
      'Database operation failed',
      ERROR_CODES.DATABASE_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      { 
        constraint: error.constraint,
        table: error.table
      }
    );
  }

  // Handle standard Node.js errors
  if (error instanceof Error) {
    // Network/timeout errors
    if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      return new ApplicationError(
        'Service temporarily unavailable',
        ERROR_CODES.INTERNAL_ERROR,
        HTTP_STATUS.SERVICE_UNAVAILABLE
      );
    }

    // File system errors
    if (error.message.includes('ENOENT') || error.message.includes('EACCES')) {
      return new ApplicationError(
        'File system error',
        ERROR_CODES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }

    // Generic error
    return new ApplicationError(
      error.message || 'An unexpected error occurred',
      ERROR_CODES.INTERNAL_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }

  // Handle unknown errors
  return new ApplicationError(
    'An unexpected error occurred',
    ERROR_CODES.INTERNAL_ERROR,
    HTTP_STATUS.INTERNAL_SERVER_ERROR
  );
}

/**
 * Check if error is a database error
 */
function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof Error && 
         'code' in error && 
         typeof (error as any).code === 'string';
}

// ================================
// API Response Functions
// ================================

/**
 * Create error API response
 */
export function createErrorResponse(
  error: ApplicationError,
  requestId?: string
): NextResponse<ApiResponse> {
  const apiError: ApiError = {
    code: error.code,
    message: error.message,
    details: error.details,
    timestamp: new Date().toISOString()
  };

  const response: ApiResponse = {
    success: false,
    error: apiError,
    timestamp: new Date().toISOString()
  };

  // Log error for monitoring
  logger.error(`API Error: ${error.message}`, error, {
    requestId,
    code: error.code,
    statusCode: error.statusCode,
    details: error.details
  });

  return NextResponse.json(response, { 
    status: error.statusCode,
    headers: requestId ? { 'X-Request-ID': requestId } : undefined
  });
}

/**
 * Create success API response
 */
export function createSuccessResponse<T>(
  data: T,
  statusCode: number = HTTP_STATUS.OK,
  requestId?: string
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };

  return NextResponse.json(response, { 
    status: statusCode,
    headers: requestId ? { 'X-Request-ID': requestId } : undefined
  });
}

/**
 * Handle API errors with proper logging and response
 */
export function handleApiError(
  error: unknown,
  requestId?: string
): NextResponse<ApiResponse> {
  const processedError = processError(error);
  return createErrorResponse(processedError, requestId);
}

// ================================
// Validation Helper Functions
// ================================

/**
 * Validate email format
 */
export function validateEmailFormat(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
}

/**
 * Validate required fields
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missingFields = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || 
           (typeof value === 'string' && value.trim() === '');
  });

  if (missingFields.length > 0) {
    throw new ValidationError(
      'Required fields are missing',
      { missingFields }
    );
  }
}

/**
 * Validate numeric range
 */
export function validateNumericRange(
  value: number,
  min: number,
  max: number,
  fieldName: string
): void {
  if (value < min || value > max) {
    throw new ValidationError(
      `${fieldName} must be between ${min} and ${max}`,
      { value, min, max, field: fieldName }
    );
  }
}

/**
 * Validate array length
 */
export function validateArrayLength(
  array: any[],
  minLength: number,
  maxLength: number,
  fieldName: string
): void {
  if (array.length < minLength || array.length > maxLength) {
    throw new ValidationError(
      `${fieldName} must contain between ${minLength} and ${maxLength} items`,
      { length: array.length, minLength, maxLength, field: fieldName }
    );
  }
}

// ================================
// Database Error Helpers
// ================================

/**
 * Handle SQLite constraint errors
 */
export function handleDatabaseConstraintError(error: any): ApplicationError {
  if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return new ConflictError(
      'Resource already exists',
      { constraint: error.constraint }
    );
  }

  if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return new ValidationError(
      'Invalid reference to related resource',
      { constraint: error.constraint }
    );
  }

  return new ApplicationError(
    'Database constraint violation',
    ERROR_CODES.DATABASE_ERROR,
    HTTP_STATUS.BAD_REQUEST,
    { constraint: error.constraint }
  );
}

// ================================
// Async Error Wrapper
// ================================

/**
 * Wrap async functions to catch and handle errors
 */
export function asyncErrorHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw processError(error);
    }
  };
}

// ================================
// Error Reporting
// ================================

/**
 * Report critical errors to monitoring service
 */
export function reportCriticalError(
  error: ApplicationError,
  context?: Record<string, any>
): void {
  // In production, this would integrate with error reporting services
  // like Sentry, Bugsnag, or custom monitoring solutions
  logger.fatal('Critical error reported', error, context);
  
  // TODO: Implement external error reporting
  // - Send to error tracking service
  // - Alert development team
  // - Update system health metrics
}

// ================================
// Error Recovery
// ================================

/**
 * Attempt to recover from transient errors
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  backoffMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on validation or client errors
      if (error instanceof ValidationError || 
          error instanceof NotFoundError ||
          (error instanceof ApplicationError && error.statusCode < 500)) {
        throw error;
      }
      
      if (attempt === maxAttempts) {
        break;
      }
      
      // Exponential backoff
      const delay = backoffMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      logger.warn(`Retrying operation (attempt ${attempt + 1}/${maxAttempts})`, {
        attempt,
        maxAttempts,
        delay,
        error: lastError.message
      });
    }
  }
  
  throw lastError;
}