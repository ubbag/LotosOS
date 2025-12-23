import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { dashboardService } from './dashboard.service';
import { authenticate } from '../auth/auth.middleware';

export async function dashboardRoutes(fastify: FastifyInstance) {
  /**
   * GET /dashboard/stats
   * Get dashboard statistics
   */
  fastify.get(
    '/stats',
    { onRequest: [authenticate] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const stats = await dashboardService.getStats();

      return reply.code(200).send({
        success: true,
        data: stats,
      });
    }
  );

  /**
   * GET /dashboard/hourly-stats
   * Get hourly visit statistics for today
   */
  fastify.get(
    '/hourly-stats',
    { onRequest: [authenticate] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const stats = await dashboardService.getHourlyStats();

      return reply.code(200).send({
        success: true,
        data: stats,
      });
    }
  );

  /**
   * GET /dashboard/monthly-stats
   * Get monthly visit statistics
   */
  fastify.get(
    '/monthly-stats',
    { onRequest: [authenticate] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const stats = await dashboardService.getMonthlyStats();

      return reply.code(200).send({
        success: true,
        data: stats,
      });
    }
  );
}
