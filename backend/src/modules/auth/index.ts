/**
 * Auth Module - Exports all authentication-related classes and functions
 */

export { AuthService, authService, JWTPayload, UserResponse, LoginResponse } from './auth.service';
export { authRoutes } from './auth.routes';
export { authenticate, authorize, optionalAuth } from './auth.middleware';
export * from './auth.schemas';

// Re-export with register prefix for consistency
export { authRoutes as registerAuthRoutes } from './auth.routes';
