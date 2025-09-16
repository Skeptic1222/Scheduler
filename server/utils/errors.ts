import { Response } from 'express';

// Standard error response structure
export interface ErrorResponse {
  error: string;
  message?: string;
  code?: string;
  details?: any;
  timestamp: string;
  requestId?: string;
}

// Standard success response structure
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: string;
  requestId?: string;
}

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error codes for consistent error handling
export const ERROR_CODES = {
  // Authentication & Authorization
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELDS: 'MISSING_REQUIRED_FIELDS',
  
  // Resource Management
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  
  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',
  
  // FCFS Queue
  QUEUE_FULL: 'QUEUE_FULL',
  ALREADY_IN_QUEUE: 'ALREADY_IN_QUEUE',
  SHIFT_NOT_AVAILABLE: 'SHIFT_NOT_AVAILABLE',
  QUEUE_EXPIRED: 'QUEUE_EXPIRED',
  
  // Business Logic
  SHIFT_CONFLICT: 'SHIFT_CONFLICT',
  INSUFFICIENT_SKILLS: 'INSUFFICIENT_SKILLS',
  DEPARTMENT_MISMATCH: 'DEPARTMENT_MISMATCH',
  INVALID_TIME_RANGE: 'INVALID_TIME_RANGE',
  
  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  MAINTENANCE_MODE: 'MAINTENANCE_MODE',
} as const;

// Custom error class for application errors
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: string = ERROR_CODES.INTERNAL_ERROR,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Predefined error creators
export const createError = {
  // Authentication errors
  invalidToken: (message = 'Invalid or expired token') => 
    new AppError(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.INVALID_TOKEN),
  
  authRequired: (message = 'Authentication required') => 
    new AppError(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_REQUIRED),
  
  forbidden: (message = 'Insufficient permissions') => 
    new AppError(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.INSUFFICIENT_PERMISSIONS),
  
  // Validation errors
  validationError: (message = 'Invalid input data', details?: any) => 
    new AppError(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, details),
  
  invalidInput: (field: string, message?: string) => 
    new AppError(
      message || `Invalid value for field: ${field}`,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INVALID_INPUT,
      { field }
    ),
  
  // Resource errors
  notFound: (resource: string, id?: string) => 
    new AppError(
      `${resource} ${id ? `with id ${id}` : ''} not found`,
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.RESOURCE_NOT_FOUND,
      { resource, id }
    ),
  
  conflict: (message: string, details?: any) => 
    new AppError(message, HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_CONFLICT, details),
  
  // Rate limiting errors
  rateLimitExceeded: (message = 'Rate limit exceeded') => 
    new AppError(message, HTTP_STATUS.TOO_MANY_REQUESTS, ERROR_CODES.RATE_LIMIT_EXCEEDED),
  
  // Database errors
  databaseError: (message = 'Database operation failed', details?: any) => 
    new AppError(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.DATABASE_ERROR, details),
  
  // FCFS Queue errors
  queueFull: (message = 'Queue is at maximum capacity') => 
    new AppError(message, HTTP_STATUS.CONFLICT, ERROR_CODES.QUEUE_FULL),
  
  alreadyInQueue: (message = 'User is already in the queue for this shift') => 
    new AppError(message, HTTP_STATUS.CONFLICT, ERROR_CODES.ALREADY_IN_QUEUE),
  
  shiftNotAvailable: (message = 'Shift is no longer available') => 
    new AppError(message, HTTP_STATUS.CONFLICT, ERROR_CODES.SHIFT_NOT_AVAILABLE),
  
  // Business logic errors
  shiftConflict: (message = 'Shift conflicts with existing assignments') => 
    new AppError(message, HTTP_STATUS.CONFLICT, ERROR_CODES.SHIFT_CONFLICT),
  
  insufficientSkills: (message = 'User lacks required skills for this shift') => 
    new AppError(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.INSUFFICIENT_SKILLS),
};

// Response helpers
export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode: number = HTTP_STATUS.OK,
  requestId?: string
): void => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId,
  };
  
  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  error: string | AppError,
  statusCode?: number,
  details?: any,
  requestId?: string
): void => {
  let errorResponse: ErrorResponse;
  
  if (error instanceof AppError) {
    errorResponse = {
      error: error.message,
      code: error.code,
      details: error.details,
      timestamp: new Date().toISOString(),
      requestId,
    };
    res.status(error.statusCode).json(errorResponse);
  } else {
    errorResponse = {
      error: typeof error === 'string' ? error : 'Internal server error',
      code: ERROR_CODES.INTERNAL_ERROR,
      details,
      timestamp: new Date().toISOString(),
      requestId,
    };
    res.status(statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global error handler middleware
export const globalErrorHandler = (err: any, req: any, res: Response, next: any) => {
  // Log error for debugging
  console.error('[ERROR]', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    userId: req.user?.id,
  });
  
  // Handle known operational errors
  if (err instanceof AppError && err.isOperational) {
    return sendError(res, err, undefined, undefined, req.id);
  }
  
  // Handle validation errors from express-validator
  if (err.type === 'entity.parse.failed') {
    return sendError(
      res,
      createError.validationError('Invalid JSON in request body'),
      undefined,
      undefined,
      req.id
    );
  }
  
  // Handle database constraint errors
  if (err.code === '23505') { // PostgreSQL unique violation
    return sendError(
      res,
      createError.conflict('Resource already exists'),
      undefined,
      undefined,
      req.id
    );
  }
  
  if (err.code === '23503') { // PostgreSQL foreign key violation
    return sendError(
      res,
      createError.validationError('Referenced resource does not exist'),
      undefined,
      undefined,
      req.id
    );
  }
  
  // Handle rate limiting errors
  if (err.statusCode === 429) {
    return sendError(
      res,
      createError.rateLimitExceeded(),
      undefined,
      undefined,
      req.id
    );
  }
  
  // Default to internal server error
  sendError(
    res,
    'An unexpected error occurred',
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined,
    req.id
  );
};

// Request ID middleware for tracking
export const requestIdMiddleware = (req: any, res: any, next: any) => {
  req.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.set('X-Request-ID', req.id);
  next();
};