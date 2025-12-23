import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { smsService } from './sms.service';
import { authenticate, authorize } from '../auth/auth.middleware';
import { wyslijSMSSchema, smsLogiQuerySchema, WyslijSMSRequest, SmsLogiQuery } from './sms.schemas';
import { ValidationError } from '../../shared/errors';

const validateSchema = <T>(schema: any, data: any): T => {
  try {
    return schema.parse(data);
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
};

export async function smsRoutes(fastify: FastifyInstance) {
  /**
   * POST /sms/wyslij
   * Send SMS to client
   */
  fastify.post<{ Body: WyslijSMSRequest }>(
    '/wyslij',
    { onRequest: [authenticate, authorize('RECEPCJA', 'MANAGER', 'WLASCICIEL')] },
    async (request: FastifyRequest<{ Body: WyslijSMSRequest }>, reply: FastifyReply) => {
      try {
        const data = validateSchema<WyslijSMSRequest>(wyslijSMSSchema, request.body);

        // Determine if using direct phone or klientId
        const isDirectPhone = !!data.telefon;
        const identifier = data.telefon || data.klientId!;

        const smsLog = await smsService.wyslij(
          identifier,
          data.tresc,
          (data.typ as any) || 'CUSTOM',
          data.rezerwacjaId,
          isDirectPhone
        );

        return reply.code(201).send({
          success: true,
          data: smsLog,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * GET /sms/logi
   * Get SMS logs (by klientId or rezerwacjaId)
   */
  fastify.get<{ Querystring: { klientId?: string; rezerwacjaId?: string; typ?: string; page?: string; limit?: string } }>(
    '/logi',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Querystring: { klientId?: string; rezerwacjaId?: string; typ?: string; page?: string; limit?: string } }>, reply: FastifyReply) => {
      try {
        const filters = validateSchema<SmsLogiQuery>(smsLogiQuerySchema, {
          klientId: request.query.klientId,
          rezerwacjaId: request.query.rezerwacjaId,
          typ: request.query.typ,
          page: request.query.page || '1',
          limit: request.query.limit || '10',
        });

        const result = await smsService.getLogi({
          klientId: filters.klientId,
          rezerwacjaId: filters.rezerwacjaId,
          typ: (filters.typ as any) || undefined,
          page: filters.page,
          limit: filters.limit,
        });

        return reply.code(200).send({
          success: true,
          data: result.data,
          pagination: result.pagination,
        });
      } catch (error) {
        throw error;
      }
    }
  );
}
