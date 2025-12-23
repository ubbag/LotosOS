import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { publicService } from './public.service';
import { createRezerwacjaOnlineSchema, createVoucherOnlineSchema, CreateRezerwacjaOnlineRequest, CreateVoucherOnlineRequest, PaymentWebhookRequest } from './public.schemas';
import { ValidationError } from '../../shared/errors';

const validateSchema = <T>(schema: any, data: any): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any;
      const errors: Record<string, string[]> = {};
      const issues = zodError.issues || zodError.errors || [];
      issues.forEach((err: any) => {
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

export async function publicRoutes(fastify: FastifyInstance) {
  /**
   * SERVICES
   */

  /**
   * GET /public/uslugi
   * Get all active services with variants
   */
  fastify.get(
    '/uslugi',
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const uslugi = await publicService.getUslugi();

      return reply.code(200).send({
        success: true,
        data: uslugi,
      });
    }
  );

  /**
   * GET /public/masazysci
   * Get all active therapists
   */
  fastify.get(
    '/masazysci',
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const masazysci = await publicService.getMasazysci();

      return reply.code(200).send({
        success: true,
        data: masazysci,
      });
    }
  );

  /**
   * AVAILABILITY
   */

  /**
   * GET /public/dostepnosc?data=X&wariantId=Y&masazystaId=Z
   * Get available time slots
   */
  fastify.get<{ Querystring: { data?: string; wariantId?: string; masazystaId?: string } }>(
    '/dostepnosc',
    async (request: FastifyRequest<{ Querystring: { data?: string; wariantId?: string; masazystaId?: string } }>, reply: FastifyReply) => {
      try {
        if (!request.query.data || !request.query.wariantId) {
          return reply.code(400).send({
            success: false,
            message: 'data and wariantId parameters are required',
          });
        }

        const sloty = await publicService.getDostepneGodziny(
          new Date(request.query.data),
          request.query.wariantId,
          request.query.masazystaId
        );

        return reply.code(200).send({
          success: true,
          data: sloty,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * ONLINE RESERVATIONS
   */

  /**
   * POST /public/rezerwacje
   * Create online reservation
   */
  fastify.post<{ Body: CreateRezerwacjaOnlineRequest }>(
    '/rezerwacje',
    async (request: FastifyRequest<{ Body: CreateRezerwacjaOnlineRequest }>, reply: FastifyReply) => {
      try {
        const data = validateSchema<CreateRezerwacjaOnlineRequest>(createRezerwacjaOnlineSchema, request.body);

        const result = await publicService.createRezerwacjaOnline(data);

        const statusCode = 'requiresPayment' in result && result.requiresPayment ? 202 : 201;
        return reply.code(statusCode).send(result);
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * ONLINE VOUCHERS
   */

  /**
   * POST /public/vouchery
   * Create online voucher
   */
  fastify.post<{ Body: CreateVoucherOnlineRequest }>(
    '/vouchery',
    async (request: FastifyRequest<{ Body: CreateVoucherOnlineRequest }>, reply: FastifyReply) => {
      try {
        const data = validateSchema<CreateVoucherOnlineRequest>(createVoucherOnlineSchema, request.body);

        const result = await publicService.createVoucherOnline(data);

        const statusCode = 'requiresPayment' in result && result.requiresPayment ? 202 : 201;
        return reply.code(statusCode).send(result);
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * PAYMENT WEBHOOK
   */

  /**
   * POST /public/platnosci/webhook
   * Payment gateway callback
   */
  fastify.post<{ Body: PaymentWebhookRequest }>(
    '/platnosci/webhook',
    async (request: FastifyRequest<{ Body: PaymentWebhookRequest }>, reply: FastifyReply) => {
      try {
        // Validate required fields
        if (!request.body.sessionId || typeof request.body.sessionId !== 'string') {
          return reply.code(400).send({
            success: false,
            message: 'Invalid sessionId',
          });
        }

        if (!request.body.payload || typeof request.body.payload !== 'string') {
          return reply.code(400).send({
            success: false,
            message: 'Invalid payload',
          });
        }

        const webhookData = {
          sessionId: request.body.sessionId,
          status: request.body.status,
          type: request.body.sessionId.startsWith('rez_') ? 'rezerwacja' : 'voucher',
          data: JSON.parse(request.body.payload),
        };

        const result = await publicService.handlePlatnoscWebhook(webhookData, request.body.signature);

        if (result) {
          return reply.code(200).send({
            success: result.success,
            message: result.message,
          });
        }

        return reply.code(200).send({
          success: false,
          message: 'Webhook processed',
        });
      } catch (error) {
        // Log webhook error but return 200 to prevent retries
        console.error('[Webhook] Error processing payment:', error);
        return reply.code(200).send({
          success: false,
          message: 'Webhook processed',
        });
      }
    }
  );
}
