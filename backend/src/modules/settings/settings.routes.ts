import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { settingsService } from './settings.service';
import { authenticate } from '../auth/auth.middleware';
import { z } from 'zod';

const setOpeningHoursSchema = z.object({
  godzinaOtwarcia: z.number().min(0).max(23),
  godzinaZamkniecia: z.number().min(0).max(23),
});

export async function settingsRoutes(fastify: FastifyInstance) {
  /**
   * GET /settings/opening-hours
   * Get salon opening hours
   */
  fastify.get(
    '/opening-hours',
    { onRequest: [authenticate] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const hours = await settingsService.getOpeningHours();

      return reply.code(200).send({
        success: true,
        data: hours,
      });
    }
  );

  /**
   * PUT /settings/opening-hours
   * Set salon opening hours
   */
  fastify.put(
    '/opening-hours',
    { onRequest: [authenticate] },
    async (
      request: FastifyRequest<{
        Body: { godzinaOtwarcia: number; godzinaZamkniecia: number };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const data = setOpeningHoursSchema.parse(request.body);
        const hours = await settingsService.setOpeningHours(
          data.godzinaOtwarcia,
          data.godzinaZamkniecia
        );

        return reply.code(200).send({
          success: true,
          data: hours,
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          message: error.message || 'Błąd walidacji danych',
        });
      }
    }
  );
}
