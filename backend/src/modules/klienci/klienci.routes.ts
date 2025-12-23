import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { klienciService } from './klienci.service';
import { authenticate } from '../auth/auth.middleware';
import {
  createKlientSchema,
  updateKlientSchema,
  createNotatkaSchema,
  searchQuerySchema,
  listQuerySchema,
  CreateKlientRequest,
  UpdateKlientRequest,
  CreateNotatkaRequest,
  SearchQueryRequest,
  ListQueryRequest,
} from './klienci.schemas';
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

export async function klienciRoutes(fastify: FastifyInstance) {
  /**
   * GET /klienci
   * List all clients with pagination and filtering
   */
  fastify.get<{ Querystring: Partial<ListQueryRequest> }>(
    '/',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Querystring: Partial<ListQueryRequest> }>, reply: FastifyReply) => {
      const filters = validateSchema<ListQueryRequest>(listQuerySchema, request.query);
      const result = await klienciService.findAll(filters);

      return reply.code(200).send({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    }
  );

  /**
   * GET /klienci/szukaj
   * Quick search for autocomplete (max 10 results)
   */
  fastify.get<{ Querystring: { q: string } }>(
    '/szukaj',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Querystring: { q: string } }>, reply: FastifyReply) => {
      const { q } = validateSchema<SearchQueryRequest>(searchQuerySchema, { q: request.query.q });
      const results = await klienciService.search(q, 10);

      return reply.code(200).send({
        success: true,
        data: results,
      });
    }
  );

  /**
   * GET /klienci/:id
   * Get single client profile with notes and history
   */
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const klient = await klienciService.findById(request.params.id);

      return reply.code(200).send({
        success: true,
        data: klient,
      });
    }
  );

  /**
   * POST /klienci
   * Create new client
   */
  fastify.post<{ Body: CreateKlientRequest }>(
    '/',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Body: CreateKlientRequest }>, reply: FastifyReply) => {
      const data = validateSchema<CreateKlientRequest>(createKlientSchema, request.body);
      const klient = await klienciService.create(data);

      return reply.code(201).send({
        success: true,
        data: klient,
      });
    }
  );

  /**
   * PUT /klienci/:id
   * Update client
   */
  fastify.put<{ Params: { id: string }; Body: UpdateKlientRequest }>(
    '/:id',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateKlientRequest }>, reply: FastifyReply) => {
      const data = validateSchema<UpdateKlientRequest>(updateKlientSchema, request.body);
      const klient = await klienciService.update(request.params.id, data);

      return reply.code(200).send({
        success: true,
        data: klient,
      });
    }
  );

  /**
   * DELETE /klienci/:id
   * Soft delete client
   */
  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      await klienciService.delete(request.params.id);

      return reply.code(200).send({
        success: true,
        message: 'Client deleted successfully',
      });
    }
  );

  /**
   * GET /klienci/:id/notatki
   * Get client notes
   */
  fastify.get<{ Params: { id: string } }>(
    '/:id/notatki',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const notatki = await klienciService.getNotatki(request.params.id);

      return reply.code(200).send({
        success: true,
        data: notatki,
      });
    }
  );

  /**
   * POST /klienci/:id/notatki
   * Add note to client
   */
  fastify.post<{ Params: { id: string }; Body: CreateNotatkaRequest }>(
    '/:id/notatki',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Params: { id: string }; Body: CreateNotatkaRequest }>, reply: FastifyReply) => {
      const data = validateSchema<CreateNotatkaRequest>(createNotatkaSchema, request.body);
      const authenticatedUser = (request as any).authenticatedUser;
      const notatka = await klienciService.addNotatka(
        request.params.id,
        data,
        authenticatedUser.userId
      );

      return reply.code(201).send({
        success: true,
        data: notatka,
      });
    }
  );

  /**
   * DELETE /klienci/:id/notatki/:notatkaId
   * Delete client note
   */
  fastify.delete<{ Params: { id: string; notatkaId: string } }>(
    '/:id/notatki/:notatkaId',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Params: { id: string; notatkaId: string } }>, reply: FastifyReply) => {
      await klienciService.deleteNotatka(request.params.id, request.params.notatkaId);

      return reply.code(200).send({
        success: true,
        message: 'Note deleted successfully',
      });
    }
  );

  /**
   * GET /klienci/:id/historia
   * Get client visit history
   */
  fastify.get<{ Params: { id: string }; Querystring: { page?: string; limit?: string } }>(
    '/:id/historia',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Params: { id: string }; Querystring: { page?: string; limit?: string } }>, reply: FastifyReply) => {
      const page = parseInt(request.query.page as string) || 1;
      const limit = parseInt(request.query.limit as string) || 10;

      const result = await klienciService.getHistoriaWizyt(request.params.id, page, limit);

      return reply.code(200).send({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    }
  );
}
