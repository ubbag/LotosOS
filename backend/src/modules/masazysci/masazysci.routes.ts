import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { masazysciService } from './masazysci.service';
import { authenticate } from '../auth/auth.middleware';
import {
  createMasazystaSchema,
  updateMasazystaSchema,
  listMasazysciQuerySchema,
  getScheduleQuerySchema,
  getReservationsQuerySchema,
  CreateMasazystaRequest,
  UpdateMasazystaRequest,
  ListMasazysciQueryRequest,
  GetScheduleQueryRequest,
  GetReservationsQueryRequest,
} from './masazysci.schemas';
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

export async function masazysciRoutes(fastify: FastifyInstance) {
  /**
   * GET /masazysci
   * List all therapists with pagination and filtering
   */
  fastify.get<{ Querystring: Partial<ListMasazysciQueryRequest> }>(
    '/',
    { onRequest: [authenticate] },
    async (
      request: FastifyRequest<{ Querystring: Partial<ListMasazysciQueryRequest> }>,
      reply: FastifyReply
    ) => {
      const filters = validateSchema<ListMasazysciQueryRequest>(
        listMasazysciQuerySchema,
        request.query
      );
      const result = await masazysciService.findAll(filters);

      return reply.code(200).send({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    }
  );

  /**
   * GET /masazysci/:id
   * Get single therapist with schedule and reservations
   */
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const masazysta = await masazysciService.findById(request.params.id);

      return reply.code(200).send({
        success: true,
        data: masazysta,
      });
    }
  );

  /**
   * POST /masazysci
   * Create new therapist
   */
  fastify.post<{ Body: CreateMasazystaRequest }>(
    '/',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Body: CreateMasazystaRequest }>, reply: FastifyReply) => {
      const data = validateSchema<CreateMasazystaRequest>(createMasazystaSchema, request.body);
      const masazysta = await masazysciService.create(data);

      return reply.code(201).send({
        success: true,
        data: masazysta,
      });
    }
  );

  /**
   * PUT /masazysci/:id
   * Update therapist
   */
  fastify.put<{ Params: { id: string }; Body: UpdateMasazystaRequest }>(
    '/:id',
    { onRequest: [authenticate] },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: UpdateMasazystaRequest }>,
      reply: FastifyReply
    ) => {
      const data = validateSchema<UpdateMasazystaRequest>(updateMasazystaSchema, request.body);
      const masazysta = await masazysciService.update(request.params.id, data);

      return reply.code(200).send({
        success: true,
        data: masazysta,
      });
    }
  );

  /**
   * DELETE /masazysci/:id
   * Soft delete therapist
   */
  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      await masazysciService.delete(request.params.id);

      return reply.code(200).send({
        success: true,
        message: 'Therapist deactivated successfully',
      });
    }
  );

  /**
   * GET /masazysci/:id/grafik
   * Get therapist schedule for a date range
   */
  fastify.get<{ Params: { id: string }; Querystring: GetScheduleQueryRequest }>(
    '/:id/grafik',
    { onRequest: [authenticate] },
    async (
      request: FastifyRequest<{ Params: { id: string }; Querystring: GetScheduleQueryRequest }>,
      reply: FastifyReply
    ) => {
      const query = validateSchema<GetScheduleQueryRequest>(
        getScheduleQuerySchema,
        request.query
      );
      const result = await masazysciService.getGrafik(request.params.id, query);

      return reply.code(200).send({
        success: true,
        data: result,
      });
    }
  );

  /**
   * GET /masazysci/:id/rezerwacje
   * Get therapist reservations with filters
   */
  fastify.get<{ Params: { id: string }; Querystring: Partial<GetReservationsQueryRequest> }>(
    '/:id/rezerwacje',
    { onRequest: [authenticate] },
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Querystring: Partial<GetReservationsQueryRequest>;
      }>,
      reply: FastifyReply
    ) => {
      const filters = validateSchema<GetReservationsQueryRequest>(
        getReservationsQuerySchema,
        request.query
      );
      const result = await masazysciService.getRezerwacje(request.params.id, filters);

      return reply.code(200).send({
        success: true,
        data: result.data,
        pagination: result.pagination,
        masazysta: result.masazysta,
      });
    }
  );
}
