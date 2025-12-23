import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { uslugiService } from './uslugi.service';
import { authenticate, authorize } from '../auth/auth.middleware';
import {
  createUslugaSchema,
  updateUslugaSchema,
  createWariantSchema,
  updateWariantSchema,
  createDoplataSchema,
  updateDoplataSchema,
  CreateUslugaRequest,
  UpdateUslugaRequest,
  CreateWariantRequest,
  UpdateWariantRequest,
  CreateDoplataRequest,
  UpdateDoplataRequest,
} from './uslugi.schemas';
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

export async function uslugiRoutes(fastify: FastifyInstance) {
  /**
   * GET /uslugi
   * List all services grouped by category with variants
   */
  fastify.get('/', { onRequest: [authenticate] }, async (_request: FastifyRequest, reply: FastifyReply) => {
    const uslugi = await uslugiService.findAll();

    return reply.code(200).send({
      success: true,
      data: uslugi,
    });
  });

  /**
   * GET /uslugi/:id
   * Get single service with variants
   */
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const usluga = await uslugiService.findById(request.params.id);

      return reply.code(200).send({
        success: true,
        data: usluga,
      });
    }
  );

  /**
   * POST /uslugi
   * Create new service with variants (MANAGER+)
   */
  fastify.post<{ Body: CreateUslugaRequest }>(
    '/',
    { onRequest: [authorize('MANAGER', 'WLASCICIEL')] },
    async (request: FastifyRequest<{ Body: CreateUslugaRequest }>, reply: FastifyReply) => {
      try {
        const data = validateSchema<CreateUslugaRequest>(createUslugaSchema, request.body);
        const usluga = await uslugiService.create(data);

        return reply.code(201).send({
          success: true,
          data: usluga,
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
   * PUT /uslugi/:id
   * Update service (MANAGER+)
   */
  fastify.put<{ Params: { id: string }; Body: UpdateUslugaRequest }>(
    '/:id',
    { onRequest: [authorize('MANAGER', 'WLASCICIEL')] },
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateUslugaRequest }>, reply: FastifyReply) => {
      try {
        const data = validateSchema<UpdateUslugaRequest>(updateUslugaSchema, request.body);
        const usluga = await uslugiService.update(request.params.id, data);

        return reply.code(200).send({
          success: true,
          data: usluga,
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
   * DELETE /uslugi/:id
   * Delete service (MANAGER+)
   */
  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [authorize('MANAGER', 'WLASCICIEL')] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      await uslugiService.delete(request.params.id);

      return reply.code(200).send({
        success: true,
        message: 'Usługa została usunięta',
      });
    }
  );

  /**
   * POST /uslugi/:id/warianty
   * Add variant to service (MANAGER+)
   */
  fastify.post<{ Params: { id: string }; Body: CreateWariantRequest }>(
    '/:id/warianty',
    { onRequest: [authorize('MANAGER', 'WLASCICIEL')] },
    async (request: FastifyRequest<{ Params: { id: string }; Body: CreateWariantRequest }>, reply: FastifyReply) => {
      try {
        const data = validateSchema<CreateWariantRequest>(createWariantSchema, request.body);
        const wariant = await uslugiService.addWariant(request.params.id, data);

        return reply.code(201).send({
          success: true,
          data: wariant,
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
   * PUT /uslugi/:id/warianty/:wariantId
   * Update variant (MANAGER+)
   */
  fastify.put<{ Params: { id: string; wariantId: string }; Body: UpdateWariantRequest }>(
    '/:id/warianty/:wariantId',
    { onRequest: [authorize('MANAGER', 'WLASCICIEL')] },
    async (request: FastifyRequest<{ Params: { id: string; wariantId: string }; Body: UpdateWariantRequest }>, reply: FastifyReply) => {
      try {
        const data = validateSchema<UpdateWariantRequest>(updateWariantSchema, request.body);
        const wariant = await uslugiService.updateWariant(request.params.wariantId, data);

        return reply.code(200).send({
          success: true,
          data: wariant,
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
   * DELETE /uslugi/:id/warianty/:wariantId
   * Delete variant (MANAGER+)
   */
  fastify.delete<{ Params: { id: string; wariantId: string } }>(
    '/:id/warianty/:wariantId',
    { onRequest: [authorize('MANAGER', 'WLASCICIEL')] },
    async (request: FastifyRequest<{ Params: { id: string; wariantId: string } }>, reply: FastifyReply) => {
      await uslugiService.deleteWariant(request.params.wariantId);

      return reply.code(200).send({
        success: true,
        message: 'Variant deleted successfully',
      });
    }
  );

  /**
   * GET /doplaty
   * List all add-ons
   */
  fastify.get('/doplaty', { onRequest: [authenticate] }, async (_request: FastifyRequest, reply: FastifyReply) => {
    const doplaty = await uslugiService.findAllDoplaty();

    return reply.code(200).send({
      success: true,
      data: doplaty,
    });
  });

  /**
   * POST /doplaty
   * Create new add-on (MANAGER+)
   */
  fastify.post<{ Body: CreateDoplataRequest }>(
    '/doplaty',
    { onRequest: [authorize('MANAGER', 'WLASCICIEL')] },
    async (request: FastifyRequest<{ Body: CreateDoplataRequest }>, reply: FastifyReply) => {
      try {
        const data = validateSchema<CreateDoplataRequest>(createDoplataSchema, request.body);
        const doplata = await uslugiService.createDoplata(data);

        return reply.code(201).send({
          success: true,
          data: doplata,
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
   * PUT /doplaty/:id
   * Update add-on (MANAGER+)
   */
  fastify.put<{ Params: { id: string }; Body: UpdateDoplataRequest }>(
    '/doplaty/:id',
    { onRequest: [authorize('MANAGER', 'WLASCICIEL')] },
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateDoplataRequest }>, reply: FastifyReply) => {
      try {
        const data = validateSchema<UpdateDoplataRequest>(updateDoplataSchema, request.body);
        const doplata = await uslugiService.updateDoplata(request.params.id, data);

        return reply.code(200).send({
          success: true,
          data: doplata,
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
}
