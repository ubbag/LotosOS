import { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../../config/env';
import { AppError, ValidationError, NotFoundError, ConflictError, UnauthorizedError } from '../errors';

/**
 * Standard error response format
 */
export interface ErrorResponse {
  success: false;
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  path?: string;
  method?: string;
}

/**
 * Global error handler for Fastify
 * Maps errors to appropriate HTTP status codes and formats
 */
export async function globalErrorHandler(error: Error, request: FastifyRequest, reply: FastifyReply) {
  const timestamp = new Date().toISOString();
  const path = request.url;
  const method = request.method;

  // Log error
  if (error instanceof AppError || error instanceof ValidationError) {
    request.log.warn({
      code: error.code,
      message: error.message,
      path,
      method,
    });
  } else {
    request.log.error({
      error: error.message,
      stack: error.stack,
      path,
      method,
    });
  }

  // Handle validation errors
  if (error instanceof ValidationError) {
    return reply.code(error.statusCode).send({
      success: false,
      code: error.code,
      message: error.message,
      details: error.errors,
      timestamp,
      path,
      method,
    } as ErrorResponse);
  }

  // Handle not found errors
  if (error instanceof NotFoundError) {
    return reply.code(404).send({
      success: false,
      code: 'NOT_FOUND',
      message: error.message,
      timestamp,
      path,
      method,
    } as ErrorResponse);
  }

  // Handle conflict errors
  if (error instanceof ConflictError) {
    return reply.code(409).send({
      success: false,
      code: 'CONFLICT',
      message: error.message,
      timestamp,
      path,
      method,
    } as ErrorResponse);
  }

  // Handle unauthorized errors
  if (error instanceof UnauthorizedError) {
    return reply.code(401).send({
      success: false,
      code: 'UNAUTHORIZED',
      message: error.message,
      timestamp,
      path,
      method,
    } as ErrorResponse);
  }

  // Handle app errors
  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({
      success: false,
      code: error.code,
      message: error.message,
      timestamp,
      path,
      method,
    } as ErrorResponse);
  }

  // Handle Zod validation errors (if not caught earlier)
  if (error.name === 'ZodError') {
    const zodError = error as any;
    const details: Record<string, string[]> = {};
    zodError.errors?.forEach((err: any) => {
      const path = err.path.join('.');
      if (!details[path]) {
        details[path] = [];
      }
      details[path].push(err.message);
    });

    return reply.code(400).send({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details,
      timestamp,
      path,
      method,
    } as ErrorResponse);
  }

  // Handle JWT errors
  if (error.name === 'UnauthorizedError' || error.name === 'JsonWebTokenError') {
    return reply.code(401).send({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Invalid or missing authentication token',
      timestamp,
      path,
      method,
    } as ErrorResponse);
  }

  // Handle syntax errors (invalid JSON)
  if (error instanceof SyntaxError && 'body' in error) {
    return reply.code(400).send({
      success: false,
      code: 'INVALID_JSON',
      message: 'Request body contains invalid JSON',
      timestamp,
      path,
      method,
    } as ErrorResponse);
  }

  // Default error response
  const statusCode = 500;
  const response: ErrorResponse = {
    success: false,
    code: 'INTERNAL_SERVER_ERROR',
    message: env.isDevelopment ? error.message : 'An error occurred',
    timestamp,
    path,
    method,
  };

  if (env.isDevelopment) {
    response.details = {
      stack: error.stack?.split('\n').slice(0, 5),
    };
  }

  return reply.code(statusCode).send(response);
}

/**
 * Not found handler for undefined routes
 */
export async function notFoundHandler(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(404).send({
    success: false,
    code: 'ROUTE_NOT_FOUND',
    message: `Route ${request.method} ${request.url} not found`,
    timestamp: new Date().toISOString(),
    path: request.url,
    method: request.method,
  } as ErrorResponse);
}

/**
 * Request logging hook factory
 * Add this to fastify instance:
 * fastify.addHook('onResponse', requestLogger);
 */
export async function requestLogger(request: FastifyRequest, reply: FastifyReply) {
  request.log.info({
    method: request.method,
    path: request.url,
    statusCode: reply.statusCode,
  });
}
