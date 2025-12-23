import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { gabinetyService } from './gabinety.service';
import { authenticate, authorize } from '../auth/auth.middleware';
import {
  createGabinetSchema,
  updateGabinetSchema,
  CreateGabinetRequest,
  UpdateGabinetRequest,
} from './gabinety.schemas';
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

export async function gabinetyRoutes(fastify: FastifyInstance) {
  /**
   * GET /gabinety
   * List all active rooms
   */
  fastify.get('/', { onRequest: [authenticate] }, async (_request: FastifyRequest, reply: FastifyReply) => {
    const gabinety = await gabinetyService.findAll();

    return reply.code(200).send({
      success: true,
      data: gabinety,
    });
  });

  /**
   * GET /gabinety/:id
   * Get single room
   */
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const gabinet = await gabinetyService.findById(request.params.id);

      return reply.code(200).send({
        success: true,
        data: gabinet,
      });
    }
  );

  /**
   * POST /gabinety
   * Create new room (MANAGER+)
   */
  fastify.post<{ Body: CreateGabinetRequest }>(
    '/',
    { onRequest: [authorize('MANAGER', 'WLASCICIEL')] },
    async (request: FastifyRequest<{ Body: CreateGabinetRequest }>, reply: FastifyReply) => {
      try {
        const data = validateSchema<CreateGabinetRequest>(createGabinetSchema, request.body);
        const gabinet = await gabinetyService.create(data);

        return reply.code(201).send({
          success: true,
          data: gabinet,
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
   * PUT /gabinety/:id
   * Update room (MANAGER+)
   */
  fastify.put<{ Params: { id: string }; Body: UpdateGabinetRequest }>(
    '/:id',
    { onRequest: [authorize('MANAGER', 'WLASCICIEL')] },
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateGabinetRequest }>, reply: FastifyReply) => {
      try {
        const data = validateSchema<UpdateGabinetRequest>(updateGabinetSchema, request.body);
        const gabinet = await gabinetyService.update(request.params.id, data);

        return reply.code(200).send({
          success: true,
          data: gabinet,
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
   * GET /gabinety/:id/dostepnosc
   * Get room availability for a given date
   */
  fastify.get<{ Params: { id: string }; Querystring: { data: string; startHour?: string; endHour?: string } }>(
    '/:id/dostepnosc',
    { onRequest: [authenticate] },
    async (
      request: FastifyRequest<{ Params: { id: string }; Querystring: { data: string; startHour?: string; endHour?: string } }>,
      reply: FastifyReply
    ) => {
      const startHour = request.query.startHour ? parseInt(request.query.startHour) : 6;
      const endHour = request.query.endHour ? parseInt(request.query.endHour) : 22;

      const availability = await gabinetyService.getAvailabilityForDate(
        request.params.id,
        request.query.data,
        startHour,
        endHour
      );

      return reply.code(200).send({
        success: true,
        data: availability,
      });
    }
  );

  /**
   * GET /gabinety/:id/sprawdz-dostepnosc
   * Check if room is available for a specific time slot
   */
  fastify.get<{
    Params: { id: string };
    Querystring: { data: string; godzinaOd: string; godzinaDo: string };
  }>(
    '/:id/sprawdz-dostepnosc',
    { onRequest: [authenticate] },
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Querystring: { data: string; godzinaOd: string; godzinaDo: string };
      }>,
      reply: FastifyReply
    ) => {
      const isAvailable = await gabinetyService.sprawdzCzyWolny(
        request.params.id,
        request.query.data,
        new Date(request.query.godzinaOd),
        new Date(request.query.godzinaDo)
      );

      return reply.code(200).send({
        success: true,
        data: {
          available: isAvailable,
        },
      });
    }
  );
}
