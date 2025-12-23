import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { kategorieService } from './kategorie.service';
import { authenticate, authorize } from '../auth/auth.middleware';
import {
  createKategoriaSchema,
  updateKategoriaSchema,
  CreateKategoriaRequest,
  UpdateKategoriaRequest,
} from './kategorie.schemas';
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

export async function kategorieRoutes(fastify: FastifyInstance) {
  /**
   * GET /kategorie
   * List all categories
   */
  fastify.get('/', { onRequest: [authenticate] }, async (_request: FastifyRequest, reply: FastifyReply) => {
    const kategorie = await kategorieService.findAll();

    return reply.code(200).send({
      success: true,
      data: kategorie,
    });
  });

  /**
   * GET /kategorie/:id
   * Get single category with services
   */
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const kategoria = await kategorieService.findById(request.params.id);

      return reply.code(200).send({
        success: true,
        data: kategoria,
      });
    }
  );

  /**
   * POST /kategorie
   * Create new category (MANAGER+)
   */
  fastify.post<{ Body: CreateKategoriaRequest }>(
    '/',
    { onRequest: [authorize('MANAGER', 'WLASCICIEL')] },
    async (request: FastifyRequest<{ Body: CreateKategoriaRequest }>, reply: FastifyReply) => {
      const data = validateSchema<CreateKategoriaRequest>(createKategoriaSchema, request.body);
      const kategoria = await kategorieService.create(data);

      return reply.code(201).send({
        success: true,
        data: kategoria,
      });
    }
  );

  /**
   * PUT /kategorie/:id
   * Update category (MANAGER+)
   */
  fastify.put<{ Params: { id: string }; Body: UpdateKategoriaRequest }>(
    '/:id',
    { onRequest: [authorize('MANAGER', 'WLASCICIEL')] },
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateKategoriaRequest }>, reply: FastifyReply) => {
      const data = validateSchema<UpdateKategoriaRequest>(updateKategoriaSchema, request.body);
      const kategoria = await kategorieService.update(request.params.id, data);

      return reply.code(200).send({
        success: true,
        data: kategoria,
      });
    }
  );

  /**
   * DELETE /kategorie/:id
   * Delete category (soft delete) (MANAGER+)
   */
  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [authorize('MANAGER', 'WLASCICIEL')] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      await kategorieService.delete(request.params.id);

      return reply.code(200).send({
        success: true,
        message: 'Category deleted successfully',
      });
    }
  );
}
