import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { voucheryService } from './vouchery.service';
import { authenticate, authorize } from '../auth/auth.middleware';
import {
  createVoucherSchema,
  realizujSchema,
  przedluzSchema,
  voucherFiltersSchema,
  CreateVoucherRequest,
  RealizujRequest,
  PrzedluzRequest,
  VoucherFiltersRequest,
} from './vouchery.schemas';
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

export async function voucheryRoutes(fastify: FastifyInstance) {
  /**
   * GET /vouchery
   * Get all vouchers with filters and pagination
   */
  fastify.get<{ Querystring: { status?: string; typ?: string; zrodlo?: string; page?: string; limit?: string } }>(
    '/',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Querystring: { status?: string; typ?: string; zrodlo?: string; page?: string; limit?: string } }>, reply: FastifyReply) => {
      try {
        const filters = validateSchema<VoucherFiltersRequest>(voucherFiltersSchema, {
          status: request.query.status,
          typ: request.query.typ,
          zrodlo: request.query.zrodlo,
          page: request.query.page || '1',
          limit: request.query.limit || '10',
        });

        const result = await voucheryService.findAll(filters);

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

  /**
   * GET /vouchery/:id
   * Get voucher details with realization history
   */
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const voucher = await voucheryService.findById(request.params.id);

      return reply.code(200).send({
        success: true,
        data: voucher,
      });
    }
  );

  /**
   * GET /vouchery/kod/:kod
   * Check voucher by code (public endpoint for form)
   */
  fastify.get<{ Params: { kod: string } }>(
    '/kod/:kod',
    async (request: FastifyRequest<{ Params: { kod: string } }>, reply: FastifyReply) => {
      try {
        const voucher = await voucheryService.findByKod(request.params.kod);

        return reply.code(200).send({
          success: true,
          data: voucher,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * POST /vouchery
   * Create and sell voucher (RECEPCJA+)
   */
  fastify.post<{ Body: CreateVoucherRequest }>(
    '/',
    { onRequest: [authenticate, authorize('RECEPCJA', 'MANAGER', 'WLASCICIEL')] },
    async (request: FastifyRequest<{ Body: CreateVoucherRequest }>, reply: FastifyReply) => {
      try {
        const data = validateSchema<CreateVoucherRequest>(createVoucherSchema, request.body);
        const authenticatedUser = (request as any).authenticatedUser;

        const voucher = await voucheryService.create(data, authenticatedUser.userId);

        return reply.code(201).send({
          success: true,
          data: voucher,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * POST /vouchery/:id/realizuj
   * Realize voucher (use for reservation)
   */
  fastify.post<{ Params: { id: string }; Body: RealizujRequest }>(
    '/:id/realizuj',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Params: { id: string }; Body: RealizujRequest }>, reply: FastifyReply) => {
      try {
        const data = validateSchema<RealizujRequest>(realizujSchema, request.body);
        const realizacja = await voucheryService.realizuj(request.params.id, data);

        return reply.code(200).send({
          success: true,
          data: realizacja,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * PUT /vouchery/:id/przedluz
   * Extend voucher validity (WLASCICIEL)
   */
  fastify.put<{ Params: { id: string }; Body: PrzedluzRequest }>(
    '/:id/przedluz',
    { onRequest: [authenticate, authorize('WLASCICIEL')] },
    async (request: FastifyRequest<{ Params: { id: string }; Body: PrzedluzRequest }>, reply: FastifyReply) => {
      try {
        const data = validateSchema<PrzedluzRequest>(przedluzSchema, request.body);
        const voucher = await voucheryService.przedluz(request.params.id, new Date(data.nowaDataWaznosci));

        return reply.code(200).send({
          success: true,
          data: voucher,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * DELETE /vouchery/:id
   * Cancel voucher (WLASCICIEL)
   */
  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [authenticate, authorize('WLASCICIEL')] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const voucher = await voucheryService.anuluj(request.params.id);

      return reply.code(200).send({
        success: true,
        data: voucher,
      });
    }
  );

  /**
   * GET /vouchery/wygasajace
   * Get vouchers expiring within 30 days
   */
  fastify.get<{ Querystring: { dni?: string } }>(
    '/wygasajace',
    { onRequest: [authenticate] },
    async (request: FastifyRequest<{ Querystring: { dni?: string } }>, reply: FastifyReply) => {
      const dni = request.query.dni ? parseInt(request.query.dni) : 30;
      const vouchery = await voucheryService.findWygasajace(dni);

      return reply.code(200).send({
        success: true,
        data: vouchery,
        count: vouchery.length,
      });
    }
  );
}
