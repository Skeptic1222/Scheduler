import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  AppError, 
  createError, 
  sendSuccess, 
  sendError, 
  globalErrorHandler,
  HTTP_STATUS,
  ERROR_CODES 
} from '../utils/errors';

describe('Error Handling System', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    mockReq = {
      id: 'test-request-id',
      user: { id: 'test-user-id' },
      url: '/api/test',
      method: 'GET',
    };
    
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    
    mockNext = vi.fn();
    
    console.error = vi.fn(); // Mock console.error to prevent test output pollution
  });

  describe('AppError Class', () => {
    it('should create AppError with correct properties', () => {
      const error = new AppError(
        'Test error message',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
        { field: 'email' }
      );

      expect(error.message).toBe('Test error message');
      expect(error.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(error.details).toEqual({ field: 'email' });
      expect(error.isOperational).toBe(true);
    });

    it('should create AppError with default values', () => {
      const error = new AppError('Test error');

      expect(error.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(error.isOperational).toBe(true);
    });
  });

  describe('Error Creators', () => {
    it('should create invalid token error', () => {
      const error = createError.invalidToken();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(error.code).toBe(ERROR_CODES.INVALID_TOKEN);
      expect(error.message).toBe('Invalid or expired token');
    });

    it('should create validation error with details', () => {
      const details = [{ field: 'email', message: 'Invalid email' }];
      const error = createError.validationError('Validation failed', details);
      
      expect(error.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(error.details).toBe(details);
    });

    it('should create not found error', () => {
      const error = createError.notFound('User', '123');
      
      expect(error.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(error.code).toBe(ERROR_CODES.RESOURCE_NOT_FOUND);
      expect(error.message).toBe('User with id 123 not found');
      expect(error.details).toEqual({ resource: 'User', id: '123' });
    });

    it('should create forbidden error', () => {
      const error = createError.forbidden('Access denied');
      
      expect(error.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
      expect(error.code).toBe(ERROR_CODES.INSUFFICIENT_PERMISSIONS);
      expect(error.message).toBe('Access denied');
    });
  });

  describe('Response Helpers', () => {
    it('should send success response with correct format', () => {
      const data = { user: { id: '123', name: 'Test User' } };
      const requestId = 'test-request-id';
      
      sendSuccess(mockRes, data, HTTP_STATUS.CREATED, requestId);
      
      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data,
          timestamp: expect.any(String),
          requestId
        })
      );
    });

    it('should send error response for AppError', () => {
      const error = new AppError(
        'Test error',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
        { field: 'email' }
      );
      const requestId = 'test-request-id';
      
      sendError(mockRes, error, undefined, undefined, requestId);
      
      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Test error',
          code: ERROR_CODES.VALIDATION_ERROR,
          details: { field: 'email' },
          timestamp: expect.any(String),
          requestId
        })
      );
    });

    it('should send error response for string error', () => {
      const errorMessage = 'Something went wrong';
      const requestId = 'test-request-id';
      
      sendError(mockRes, errorMessage, HTTP_STATUS.BAD_REQUEST, undefined, requestId);
      
      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: errorMessage,
          code: ERROR_CODES.INTERNAL_ERROR,
          timestamp: expect.any(String),
          requestId
        })
      );
    });
  });

  describe('Global Error Handler', () => {
    it('should handle AppError correctly', () => {
      const error = new AppError(
        'Test error',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
      
      globalErrorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Test error',
          code: ERROR_CODES.VALIDATION_ERROR,
          timestamp: expect.any(String),
          requestId: 'test-request-id'
        })
      );
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle PostgreSQL unique constraint violation', () => {
      const error = { code: '23505', message: 'duplicate key value' };
      
      globalErrorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.CONFLICT);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Resource already exists',
          code: ERROR_CODES.RESOURCE_CONFLICT
        })
      );
    });

    it('should handle PostgreSQL foreign key violation', () => {
      const error = { code: '23503', message: 'foreign key constraint' };
      
      globalErrorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Referenced resource does not exist',
          code: ERROR_CODES.VALIDATION_ERROR
        })
      );
    });

    it('should handle rate limiting errors', () => {
      const error = { statusCode: 429, message: 'Too Many Requests' };
      
      globalErrorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.TOO_MANY_REQUESTS);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Rate limit exceeded',
          code: ERROR_CODES.RATE_LIMIT_EXCEEDED
        })
      );
    });

    it('should handle unknown errors with 500 status', () => {
      const error = new Error('Unknown error');
      
      globalErrorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'An unexpected error occurred',
          code: ERROR_CODES.INTERNAL_ERROR
        })
      );
    });

    it('should include stack trace in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Test error');
      globalErrorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            stack: expect.any(String)
          })
        })
      );
      
      process.env.NODE_ENV = originalEnv;
    });
  });
});