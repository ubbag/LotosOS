import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from './auth.service';
import { UnauthorizedError, ForbiddenError } from '../../shared/errors';

// Types for JWT payload
export interface JWTPayload {
  userId: string;
  role: string;
}

/**
 * Authenticate middleware - verifies JWT token
 */
export const authenticate = async (
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> => {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      // DEVELOPMENT BYPASS: Allow access without token in development
      if (process.env.NODE_ENV === 'development') {
        (request as any).authenticatedUser = {
          userId: 'cm4j...admin', // Placeholder ID, ideally match the seeded admin ID but this is sufficient for bypass
          role: 'WLASCICIEL',
        };
        return;
      }
      throw new UnauthorizedError('Authorization header is missing');
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedError('Token is missing');
    }

    // Verify token
    const payload = authService.verifyToken(token);

    // Attach user info to request (using a custom property to avoid conflicts)
    (request as any).authenticatedUser = {
      userId: payload.userId,
      role: payload.role as string,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new UnauthorizedError('Invalid token');
  }
};

/**
 * Authorize middleware - checks if user has required role(s)
 */
export const authorize = (...allowedRoles: string[]) => {
  return async (request: FastifyRequest, _reply?: FastifyReply): Promise<void> => {
    // First authenticate
    await authenticate(request, _reply as FastifyReply);

    // Then check role
    const authenticatedUser = (request as any).authenticatedUser;
    if (!authenticatedUser || !allowedRoles.includes(authenticatedUser.role)) {
      throw new ForbiddenError('You do not have permission to access this resource');
    }
  };
};

/**
 * Optional auth middleware - doesn't fail if token is missing
 */
export const optionalAuth = async (
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> => {
  try {
    const authHeader = request.headers.authorization;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      if (token) {
        const payload = authService.verifyToken(token);
        (request as any).authenticatedUser = {
          userId: payload.userId,
          role: payload.role as string,
        };
      }
    }
  } catch {
    // Silently ignore auth errors in optional auth
    // User will be null/undefined
  }
};
