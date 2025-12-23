import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { pakietyService } from './pakiety.service';
import { authenticate, authorize } from '../auth/auth.middleware';
import {
  createDefinicjaSchema,
  updateDefinicjaSchema,
  sprzedajPakietSchema,
  findByKlientQuerySchema,
  historyQuerySchema,
  CreateDefinicjaRequest,
  UpdateDefinicjaRequest,
  SprzedajPakietRequest,
  FindByKlientQueryRequest,
  HistoryQueryRequest,
} from './pakiety.schemas';
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

export async function pakietyRoutes(fastify: FastifyInstance) {
  /**
   * PACKAGE DEFINITIONS (MANAGER+)
   */

  /**
   * GET /pakiety/definicje
   * Get all package definitions
   */
  fastify.get('/definicje', { onRequest: [authenticate] }, async (_request: FastifyRequest, reply: FastifyReply) => {
    const definicje = await pakietyService.findAllDefinicje();

    return reply.code(200).send({
      success: true,
      data: definicje,
    });
  });

  /**
   * POST /pakiety/definicje
   * Create new package definition (MANAGER+)
   */
  fastify.post<{ Body: CreateDefinicjaRequest }>(
    '/definicje',
    { onRequest: [authenticate, authorize('MANAGER', 'WLASCICIEL')] },
    async (request: FastifyRequest<{ Body: CreateDefinicjaRequest }>, reply: FastifyReply) => {
      try {
        const data = validateSchema<CreateDefinicjaRequest>(createDefinicjaSchema, request.body);
        const definicja = await pakietyService.createDefinicja(data);

        return reply.code(201).send({
          success: true,
          data: definicja,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * PUT /pakiety/definicje/:id
   * Update package definition (MANAGER+)
   */
  fastify.put<{ Params: { id: string }; Body: UpdateDefinicjaRequest }>(
    '/definicje/:id',
    { onRequest: [authenticate, authorize('MANAGER', 'WLASCICIEL')] },
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateDefinicjaRequest }>, reply: FastifyReply) => {
      try {
        const data = validateSchema<UpdateDefinicjaRequest>(updateDefinicjaSchema, request.body);
        const definicja = await pakietyService.updateDefinicja(request.params.id, data);

        return reply.code(200).send({
          success: true,
          data: definicja,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * CLIENT PACKAGES
   */

  /**
   * GET /pakiety/wszystkie
   * Get all client packages (without filtering by client)
   */
  fastify.get(
    '/wszystkie',
    { onRequest: [authenticate] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const pakiety = await pakietyService.findAll();

        return reply.code(200).send({
          success: true,
          data: pakiety,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * GET /pakiety?klientId=X&tylkoAktywne=true
   * Get packages for a client
   */
  fastify.get<{ Querystring: { klientId?: string; tylkoAktywne?: string } }>(
    '/',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Querystring: { klientId?: string; tylkoAktywne?: string } }>, reply: FastifyReply) => {
      try {
        if (!request.query.klientId) {
          return reply.code(400).send({
            success: false,
            message: 'klientId parameter is required',
          });
        }

        const params = validateSchema<FindByKlientQueryRequest>(findByKlientQuerySchema, {
          klientId: request.query.klientId,
          tylkoAktywne: request.query.tylkoAktywne || 'false',
        });

        const pakiety = await pakietyService.findByKlient(params.klientId, params.tylkoAktywne);

        return reply.code(200).send({
          success: true,
          data: pakiety,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * GET /pakiety/:id
   * Get package details with usage history
   */
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const pakiet = await pakietyService.findById(request.params.id);

      return reply.code(200).send({
        success: true,
        data: pakiet,
      });
    }
  );

  /**
   * POST /pakiety
   * Sell package to client
   */
  fastify.post<{ Body: SprzedajPakietRequest }>(
    '/',
    { onRequest: [authenticate, authorize('RECEPCJA', 'MANAGER', 'WLASCICIEL')] },
    async (request: FastifyRequest<{ Body: SprzedajPakietRequest }>, reply: FastifyReply) => {
      try {
        const data = validateSchema<SprzedajPakietRequest>(sprzedajPakietSchema, request.body);
        const authenticatedUser = (request as any).authenticatedUser;

        const pakiet = await pakietyService.sprzedajPakiet(data, authenticatedUser.userId);

        return reply.code(201).send({
          success: true,
          data: pakiet,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * GET /pakiety/:id/historia
   * Get package usage history (paginated)
   */
  fastify.get<{ Params: { id: string }; Querystring: { page?: string; limit?: string } }>(
    '/:id/historia',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Params: { id: string }; Querystring: { page?: string; limit?: string } }>, reply: FastifyReply) => {
      try {
        const params = validateSchema<HistoryQueryRequest>(historyQuerySchema, {
          page: request.query.page || '1',
          limit: request.query.limit || '10',
        });

        const pakiet = await pakietyService.findById(request.params.id);

        const total = pakiet.wykorzystania.length;
        const start = (params.page - 1) * params.limit;
        const historia = pakiet.wykorzystania.slice(start, start + params.limit);

        return reply.code(200).send({
          success: true,
          data: historia,
          pagination: {
            page: params.page,
            limit: params.limit,
            total,
            totalPages: Math.ceil(total / params.limit),
          },
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * ALERTS
   */

  /**
   * GET /pakiety/konczace-sie
   * Get packages ending soon (remaining < 2 hours)
   */
  fastify.get(
    '/konczace-sie',
    { onRequest: [authenticate] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const pakiety = await pakietyService.findKonczaceSie();

      return reply.code(200).send({
        success: true,
        data: pakiety,
        count: pakiety.length,
      });
    }
  );

  /**
   * GET /pakiety/wygasajace
   * Get packages expiring within 30 days
   */
  fastify.get<{ Querystring: { dni?: string } }>(
    '/wygasajace',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Querystring: { dni?: string } }>, reply: FastifyReply) => {
      const dni = request.query.dni ? parseInt(request.query.dni) : 30;
      const pakiety = await pakietyService.findWygasajace(dni);

      return reply.code(200).send({
        success: true,
        data: pakiety,
        count: pakiety.length,
      });
    }
  );
}
