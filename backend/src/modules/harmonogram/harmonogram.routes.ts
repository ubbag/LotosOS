import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { harmonogramService } from './harmonogram.service';
import { authenticate } from '../auth/auth.middleware';
import {
  createGrafikSchema,
  updateGrafikSchema,
  listGrafikQuerySchema,
  bulkCreateGrafikSchema,
  getTherapistScheduleQuerySchema,
  CreateGrafikRequest,
  UpdateGrafikRequest,
  ListGrafikQuery,
  BulkCreateGrafikRequest,
  GetTherapistScheduleQuery,
} from './harmonogram.schemas';
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
        const path = err.path.join('.') || 'general';
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

export async function harmonogramRoutes(fastify: FastifyInstance) {
  /**
   * POST /harmonogram
   * Create single schedule entry
   */
  fastify.post<{ Body: CreateGrafikRequest }>(
    '/',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Body: CreateGrafikRequest }>, reply: FastifyReply) => {
      const data = validateSchema<CreateGrafikRequest>(createGrafikSchema, request.body);
      const authenticatedUser = (request as any).authenticatedUser;

      const grafik = await harmonogramService.createGrafik(data, authenticatedUser.userId);

      return reply.code(201).send({
        success: true,
        data: grafik,
      });
    }
  );

  /**
   * POST /harmonogram/bulk
   * Create multiple schedule entries
   */
  fastify.post<{ Body: BulkCreateGrafikRequest }>(
    '/bulk',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Body: BulkCreateGrafikRequest }>, reply: FastifyReply) => {
      const data = validateSchema<BulkCreateGrafikRequest>(bulkCreateGrafikSchema, request.body);
      const authenticatedUser = (request as any).authenticatedUser;

      const grafiki = await harmonogramService.bulkCreateGrafiki(data, authenticatedUser.userId);

      return reply.code(201).send({
        success: true,
        data: grafiki,
        message: `Successfully created ${grafiki.length} schedule(s)`,
      });
    }
  );

  /**
   * GET /harmonogram
   * List schedules with filters
   */
  fastify.get<{ Querystring: Partial<ListGrafikQuery> }>(
    '/',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Querystring: Partial<ListGrafikQuery> }>, reply: FastifyReply) => {
      const query = validateSchema<ListGrafikQuery>(listGrafikQuerySchema, request.query);
      const result = await harmonogramService.listGrafiki(query);

      return reply.code(200).send({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    }
  );

  /**
   * GET /harmonogram/:id
   * Get single schedule entry
   */
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const grafik = await harmonogramService.getGrafikById(request.params.id);

      return reply.code(200).send({
        success: true,
        data: grafik,
      });
    }
  );

  /**
   * GET /harmonogram/masazysta/:masazystaId
   * Get therapist schedule for date range
   */
  fastify.get<{ Params: { masazystaId: string }; Querystring: GetTherapistScheduleQuery }>(
    '/masazysta/:masazystaId',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Params: { masazystaId: string }; Querystring: GetTherapistScheduleQuery }>, reply: FastifyReply) => {
      const query = validateSchema<GetTherapistScheduleQuery>(getTherapistScheduleQuerySchema, request.query);

      const grafiki = await harmonogramService.getGrafikByTherapist(
        request.params.masazystaId,
        new Date(query.dataOd),
        new Date(query.dataDo)
      );

      return reply.code(200).send({
        success: true,
        data: grafiki,
      });
    }
  );

  /**
   * GET /harmonogram/masazysta/:masazystaId/dostepnosc
   * Get therapist availability for specific date
   */
  fastify.get<{ Params: { masazystaId: string }; Querystring: { data: string } }>(
    '/masazysta/:masazystaId/dostepnosc',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Params: { masazystaId: string }; Querystring: { data: string } }>, reply: FastifyReply) => {
      if (!request.query.data) {
        throw new ValidationError({ data: ['Date is required'] }, 'Validation failed');
      }

      const availability = await harmonogramService.getTherapistAvailability(
        request.params.masazystaId,
        new Date(request.query.data)
      );

      return reply.code(200).send({
        success: true,
        data: availability,
      });
    }
  );

  /**
   * PUT /harmonogram/:id
   * Update schedule entry
   */
  fastify.put<{ Params: { id: string }; Body: UpdateGrafikRequest }>(
    '/:id',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateGrafikRequest }>, reply: FastifyReply) => {
      const data = validateSchema<UpdateGrafikRequest>(updateGrafikSchema, request.body);
      const grafik = await harmonogramService.updateGrafik(request.params.id, data);

      return reply.code(200).send({
        success: true,
        data: grafik,
      });
    }
  );

  /**
   * DELETE /harmonogram/:id
   * Delete schedule entry
   */
  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      await harmonogramService.deleteGrafik(request.params.id);

      return reply.code(200).send({
        success: true,
        message: 'Schedule deleted successfully',
      });
    }
  );
}
