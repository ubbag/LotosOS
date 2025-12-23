import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { rezerwacjeService } from './rezerwacje.service';
import { authenticate } from '../auth/auth.middleware';
import {
  createRezerwacjaSchema,
  updateRezerwacjaSchema,
  updateStatusRezerwacjiSchema,
  updatePlatnoscSchema,
  listRezerwacjiQuerySchema,
  checkAvailabilitySchema,
  CreateRezerwacjaRequest,
  UpdateRezerwacjaRequest,
  UpdateStatusRezerwacjiRequest,
  UpdatePlatnoscRequest,
  ListRezerwacjiQuery,
  CheckAvailabilityRequest,
} from './rezerwacje.schemas';
import { ValidationError } from '../../shared/errors';

/**
 * Validate with Zod schema and throw ValidationError if invalid
 */
const validateSchema = <T>(schema: any, data: any): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any;
      const errors: Record<string, string[]> = {};

      if (zodError.errors && Array.isArray(zodError.errors) && zodError.errors.length > 0) {
        zodError.errors.forEach((err: any) => {
          const path = err.path.join('.') || 'general';
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
        });
      } else {
        // Fallback if errors array is empty or undefined
        errors.general = [zodError.message || 'Validation failed'];
      }

      throw new ValidationError(errors, 'Validation failed');
    }
    throw error;
  }
};

export async function rezerwacjeRoutes(fastify: FastifyInstance) {
  /**
   * POST /rezerwacje
   * Create new reservation
   */
  fastify.post<{ Body: CreateRezerwacjaRequest }>(
    '/',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Body: CreateRezerwacjaRequest }>, reply: FastifyReply) => {
      const data = validateSchema<CreateRezerwacjaRequest>(createRezerwacjaSchema, request.body);
      const authenticatedUser = (request as any).authenticatedUser;

      const rezerwacja = await rezerwacjeService.createRezerwacja(data, authenticatedUser.userId);

      return reply.code(201).send({
        success: true,
        data: rezerwacja,
      });
    }
  );

  /**
   * GET /rezerwacje
   * List reservations with filters
   */
  fastify.get<{ Querystring: Partial<ListRezerwacjiQuery> }>(
    '/',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Querystring: Partial<ListRezerwacjiQuery> }>, reply: FastifyReply) => {
      const query = validateSchema<ListRezerwacjiQuery>(listRezerwacjiQuerySchema, request.query);
      const result = await rezerwacjeService.listRezerwacje(query);

      return reply.code(200).send({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    }
  );

  /**
   * GET /rezerwacje/:id
   * Get single reservation with full details
   */
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const rezerwacja = await rezerwacjeService.getRezerwacjaById(request.params.id);

      return reply.code(200).send({
        success: true,
        data: rezerwacja,
      });
    }
  );

  /**
   * PUT /rezerwacje/:id
   * Update reservation
   */
  fastify.put<{ Params: { id: string }; Body: UpdateRezerwacjaRequest }>(
    '/:id',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateRezerwacjaRequest }>, reply: FastifyReply) => {
      const data = validateSchema<UpdateRezerwacjaRequest>(updateRezerwacjaSchema, request.body);
      const rezerwacja = await rezerwacjeService.updateRezerwacja(request.params.id, data);

      return reply.code(200).send({
        success: true,
        data: rezerwacja,
      });
    }
  );

  /**
   * PATCH /rezerwacje/:id/status
   * Update reservation status
   */
  fastify.patch<{ Params: { id: string }; Body: UpdateStatusRezerwacjiRequest }>(
    '/:id/status',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateStatusRezerwacjiRequest }>, reply: FastifyReply) => {
      const data = validateSchema<UpdateStatusRezerwacjiRequest>(updateStatusRezerwacjiSchema, request.body);
      const rezerwacja = await rezerwacjeService.updateStatusRezerwacji(request.params.id, data);

      return reply.code(200).send({
        success: true,
        data: rezerwacja,
      });
    }
  );

  /**
   * PATCH /rezerwacje/:id/platnosc
   * Update payment status
   */
  fastify.patch<{ Params: { id: string }; Body: UpdatePlatnoscRequest }>(
    '/:id/platnosc',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdatePlatnoscRequest }>, reply: FastifyReply) => {
      const data = validateSchema<UpdatePlatnoscRequest>(updatePlatnoscSchema, request.body);
      const rezerwacja = await rezerwacjeService.updatePlatnoscStatus(request.params.id, data);

      return reply.code(200).send({
        success: true,
        data: rezerwacja,
      });
    }
  );

  /**
   * DELETE /rezerwacje/:id
   * Cancel reservation
   */
  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const rezerwacja = await rezerwacjeService.cancelRezerwacja(request.params.id);

      return reply.code(200).send({
        success: true,
        message: 'Reservation cancelled successfully',
        data: rezerwacja,
      });
    }
  );

  /**
   * DELETE /rezerwacje/:id/usun
   * Permanently delete reservation from database
   */
  fastify.delete<{ Params: { id: string } }>(
    '/:id/usun',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      await rezerwacjeService.deleteRezerwacja(request.params.id);

      return reply.code(200).send({
        success: true,
        message: 'Reservation permanently deleted',
      });
    }
  );

  /**
   * GET /rezerwacje/dostepnosc/check
   * Check availability for therapist and cabinet at specific time
   */
  fastify.get<{ Querystring: CheckAvailabilityRequest }>(
    '/dostepnosc/check',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Querystring: CheckAvailabilityRequest }>, reply: FastifyReply) => {
      const data = validateSchema<CheckAvailabilityRequest>(checkAvailabilitySchema, request.query);

      const isAvailable = await rezerwacjeService.checkAvailability(
        data.masazystaId,
        data.gabinetId,
        new Date(data.godzinaOd),
        new Date(data.godzinaDo),
        data.excludeRezerwacjaId
      );

      return reply.code(200).send({
        success: true,
        data: {
          available: isAvailable,
        },
      });
    }
  );

  /**
   * GET /rezerwacje/klient/:klientId
   * Get client reservations
   */
  fastify.get<{ Params: { klientId: string }; Querystring: { page?: string; limit?: string } }>(
    '/klient/:klientId',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Params: { klientId: string }; Querystring: { page?: string; limit?: string } }>, reply: FastifyReply) => {
      const page = parseInt(request.query.page as string) || 1;
      const limit = parseInt(request.query.limit as string) || 10;

      const result = await rezerwacjeService.getRezerwacjeByKlient(request.params.klientId, page, limit);

      return reply.code(200).send({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    }
  );
}
