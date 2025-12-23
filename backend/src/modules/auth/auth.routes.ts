import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authService } from './auth.service';
import { authenticate } from './auth.middleware';
import { loginSchema, changePasswordSchema } from './auth.schemas';
import { ValidationError } from '../../shared/errors';

export async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /auth/login
   * Login with email and password
   */
  fastify.post<{ Body: { email: string; password: string } }>(
    '/login',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { email, password } = loginSchema.parse(request.body);

        const result = await authService.login(email, password);

        return reply.code(200).send({
          success: true,
          data: result,
        });
      } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
          const zodError = error as any;
          const errors: Record<string, string[]> = {};
          zodError.errors.forEach((err: any) => {
            const path = err.path.join('.');
            if (!errors[path]) {
              errors[path] = [];
            }
            errors[path].push(err.message);
          });
          throw new ValidationError(errors, 'Validation failed');
        }
        throw error;
      }
    }
  );

  /**
   * GET /auth/me
   * Get current user info
   */
  fastify.get('/me', { onRequest: [authenticate] }, async (request: FastifyRequest) => {
    const authenticatedUser = (request as any).authenticatedUser;
    const user = await authService.getUserById(authenticatedUser.userId);

    return {
      success: true,
      data: user,
    };
  });

  /**
   * POST /auth/change-password
   * Change password
   */
  fastify.post<{ Body: { currentPassword: string; newPassword: string } }>(
    '/change-password',
    { onRequest: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { currentPassword, newPassword } = changePasswordSchema.parse(request.body);
        const authenticatedUser = (request as any).authenticatedUser;

        await authService.changePassword(authenticatedUser.userId, currentPassword, newPassword);

        return reply.code(200).send({
          success: true,
          message: 'Password changed successfully',
        });
      } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
          const zodError = error as any;
          const errors: Record<string, string[]> = {};
          zodError.errors.forEach((err: any) => {
            const path = err.path.join('.');
            if (!errors[path]) {
              errors[path] = [];
            }
            errors[path].push(err.message);
          });
          throw new ValidationError(errors, 'Validation failed');
        }
        throw error;
      }
    }
  );

  /**
   * POST /auth/logout
   * Logout (optional, for frontend to clear token)
   */
  fastify.post('/logout', { onRequest: [authenticate] }, async (_request: FastifyRequest) => {
    return {
      success: true,
      message: 'Logged out successfully',
    };
  });
}
