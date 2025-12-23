import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { raportyService } from './raporty.service';
import { authenticate, authorize } from '../auth/auth.middleware';
import {
  utargDziennyQuerySchema,
  utargMiesiecznyQuerySchema,
  utargRocznyQuerySchema,
  rozliczenieQuerySchema,
  statystykiPeriodSchema,
  oblozenieQuerySchema,
  zamknienciaQuerySchema,
  podsumowanieDniaSchema,
  zamknijDzienSchema,
  UtargDziennyQuery,
  UtargMiesiecznyQuery,
  UtargRocznyQuery,
  RozliczenieQuery,
  StatystykiPeriod,
  OblozenieQuery,
  ZamknienciaQuery,
  PodsumowanieDniaQuery,
  ZamknijDzienRequest,
} from './raporty.schemas';
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

export async function raportyRoutes(fastify: FastifyInstance) {
  /**
   * REVENUE REPORTS
   */

  /**
   * GET /raporty/utarg/dzienny?data=X
   * Get daily revenue
   */
  fastify.get<{ Querystring: { data?: string } }>(
    '/utarg/dzienny',
    { onRequest: [authenticate, authorize('MANAGER', 'WLASCICIEL')] },
    async (request: FastifyRequest<{ Querystring: { data?: string } }>, reply: FastifyReply) => {
      try {
        if (!request.query.data) {
          return reply.code(400).send({
            success: false,
            message: 'data parameter is required',
          });
        }

        const params = validateSchema<UtargDziennyQuery>(utargDziennyQuerySchema, {
          data: request.query.data,
        });

        const utarg = await raportyService.getUtargDzienny(new Date(params.data));

        return reply.code(200).send({
          success: true,
          data: utarg,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * GET /raporty/utarg/miesieczy?rok=X&miesiac=Y
   * Get monthly revenue by day
   */
  fastify.get<{ Querystring: { rok?: string; miesiac?: string } }>(
    '/utarg/miesieczy',
    { onRequest: [authenticate, authorize('MANAGER', 'WLASCICIEL')] },
    async (request: FastifyRequest<{ Querystring: { rok?: string; miesiac?: string } }>, reply: FastifyReply) => {
      try {
        const params = validateSchema<UtargMiesiecznyQuery>(utargMiesiecznyQuerySchema, {
          rok: request.query.rok || new Date().getFullYear(),
          miesiac: request.query.miesiac || new Date().getMonth() + 1,
        });

        const utarg = await raportyService.getUtargMiesieczy(params.rok, params.miesiac);

        return reply.code(200).send({
          success: true,
          data: utarg,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * GET /raporty/utarg/roczny?rok=X
   * Get yearly revenue by month
   */
  fastify.get<{ Querystring: { rok?: string } }>(
    '/utarg/roczny',
    { onRequest: [authenticate, authorize('MANAGER', 'WLASCICIEL')] },
    async (request: FastifyRequest<{ Querystring: { rok?: string } }>, reply: FastifyReply) => {
      try {
        const params = validateSchema<UtargRocznyQuery>(utargRocznyQuerySchema, {
          rok: request.query.rok || new Date().getFullYear(),
        });

        const utarg = await raportyService.getUtargRoczny(params.rok);

        return reply.code(200).send({
          success: true,
          data: utarg,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * THERAPIST SETTLEMENT
   */

  /**
   * GET /raporty/masazystki?odDaty=X&doDaty=Y
   * Get therapist settlement
   */
  fastify.get<{ Querystring: { odDaty?: string; doDaty?: string } }>(
    '/masazystki',
    { onRequest: [authenticate, authorize('MANAGER', 'WLASCICIEL')] },
    async (request: FastifyRequest<{ Querystring: { odDaty?: string; doDaty?: string } }>, reply: FastifyReply) => {
      try {
        if (!request.query.odDaty || !request.query.doDaty) {
          return reply.code(400).send({
            success: false,
            message: 'odDaty and doDaty parameters are required',
          });
        }

        const params = validateSchema<RozliczenieQuery>(rozliczenieQuerySchema, {
          odDaty: request.query.odDaty,
          doDaty: request.query.doDaty,
        });

        const rozliczenie = await raportyService.getRozliczenie(new Date(params.odDaty), new Date(params.doDaty));

        return reply.code(200).send({
          success: true,
          data: rozliczenie,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * GET /raporty/masazystki/:id?odDaty=X&doDaty=Y
   * Get single therapist settlement details
   */
  fastify.get<{ Params: { id: string }; Querystring: { odDaty?: string; doDaty?: string } }>(
    '/masazystki/:id',
    { onRequest: [authenticate, authorize('MANAGER', 'WLASCICIEL')] },
    async (request: FastifyRequest<{ Params: { id: string }; Querystring: { odDaty?: string; doDaty?: string } }>, reply: FastifyReply) => {
      try {
        if (!request.query.odDaty || !request.query.doDaty) {
          return reply.code(400).send({
            success: false,
            message: 'odDaty and doDaty parameters are required',
          });
        }

        const params = validateSchema<RozliczenieQuery>(rozliczenieQuerySchema, {
          odDaty: request.query.odDaty,
          doDaty: request.query.doDaty,
        });

        const szczegoly = await raportyService.getRozliczenieSzczegoly(
          request.params.id,
          new Date(params.odDaty),
          new Date(params.doDaty)
        );

        return reply.code(200).send({
          success: true,
          data: szczegoly,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * STATISTICS
   */

  /**
   * GET /raporty/statystyki/popularne-uslugi?okres=X
   * Get top 10 popular services
   */
  fastify.get<{ Querystring: { okres?: string } }>(
    '/statystyki/popularne-uslugi',
    { onRequest: [authenticate, authorize('MANAGER', 'WLASCICIEL')] },
    async (request: FastifyRequest<{ Querystring: { okres?: string } }>, reply: FastifyReply) => {
      try {
        const params = validateSchema<StatystykiPeriod>(statystykiPeriodSchema, {
          okres: request.query.okres || 'miesiac',
        });

        const uslugi = await raportyService.getPopularneUslugi(params.okres);

        return reply.code(200).send({
          success: true,
          data: uslugi,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * GET /raporty/statystyki/godziny-szczytu?okres=X
   * Get peak hours heatmap
   */
  fastify.get<{ Querystring: { okres?: string } }>(
    '/statystyki/godziny-szczytu',
    { onRequest: [authenticate, authorize('MANAGER', 'WLASCICIEL')] },
    async (request: FastifyRequest<{ Querystring: { okres?: string } }>, reply: FastifyReply) => {
      try {
        const params = validateSchema<StatystykiPeriod>(statystykiPeriodSchema, {
          okres: request.query.okres || 'miesiac',
        });

        const heatmap = await raportyService.getGodzinySzczytu(params.okres);

        return reply.code(200).send({
          success: true,
          data: heatmap,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * GET /raporty/statystyki/oblozenije?odDaty=X&doDaty=Y
   * Get room occupancy
   */
  fastify.get<{ Querystring: { odDaty?: string; doDaty?: string } }>(
    '/statystyki/oblozenije',
    { onRequest: [authenticate, authorize('MANAGER', 'WLASCICIEL')] },
    async (request: FastifyRequest<{ Querystring: { odDaty?: string; doDaty?: string } }>, reply: FastifyReply) => {
      try {
        if (!request.query.odDaty || !request.query.doDaty) {
          return reply.code(400).send({
            success: false,
            message: 'odDaty and doDaty parameters are required',
          });
        }

        const params = validateSchema<OblozenieQuery>(oblozenieQuerySchema, {
          odDaty: request.query.odDaty,
          doDaty: request.query.doDaty,
        });

        const oblozenije = await raportyService.getOblozeniePercent(new Date(params.odDaty), new Date(params.doDaty));

        return reply.code(200).send({
          success: true,
          data: oblozenije,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * CLOSURES
   */

  /**
   * GET /raporty/zamkniecia?odDaty=X&doDaty=Y
   * Get day closures
   */
  fastify.get<{ Querystring: { odDaty?: string; doDaty?: string } }>(
    '/zamkniecia',
    { onRequest: [authenticate, authorize('MANAGER', 'WLASCICIEL')] },
    async (request: FastifyRequest<{ Querystring: { odDaty?: string; doDaty?: string } }>, reply: FastifyReply) => {
      try {
        if (!request.query.odDaty || !request.query.doDaty) {
          return reply.code(400).send({
            success: false,
            message: 'odDaty and doDaty parameters are required',
          });
        }

        const params = validateSchema<ZamknienciaQuery>(zamknienciaQuerySchema, {
          odDaty: request.query.odDaty,
          doDaty: request.query.doDaty,
        });

        const zamkniecia = await raportyService.getZamkniecia(new Date(params.odDaty), new Date(params.doDaty));

        return reply.code(200).send({
          success: true,
          data: zamkniecia,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * GET /raporty/zamkniecia/:data
   * Get single day closure details
   */
  fastify.get<{ Params: { data: string } }>(
    '/zamkniecia/:data',
    { onRequest: [authenticate, authorize('MANAGER', 'WLASCICIEL')] },
    async (request: FastifyRequest<{ Params: { data: string } }>, reply: FastifyReply) => {
      const zamkniecie = await raportyService.getZamkniecieDnia(new Date(request.params.data));

      return reply.code(200).send({
        success: true,
        data: zamkniecie,
      });
    }
  );

  /**
   * GET /raporty/zamkniecia/podsumowanie?data=X
   * Get day summary for closure form
   */
  fastify.get<{ Querystring: { data?: string } }>(
    '/zamkniecia-podsumowanie',
    { onRequest: [authenticate, authorize('MANAGER', 'WLASCICIEL')] },
    async (request: FastifyRequest<{ Querystring: { data?: string } }>, reply: FastifyReply) => {
      try {
        if (!request.query.data) {
          return reply.code(400).send({
            success: false,
            message: 'data parameter is required',
          });
        }

        const params = validateSchema<PodsumowanieDniaQuery>(podsumowanieDniaSchema, {
          data: request.query.data,
        });

        const podsumowanie = await raportyService.getPodsumowanieDnia(new Date(params.data));

        return reply.code(200).send({
          success: true,
          data: podsumowanie,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * POST /raporty/zamkniecia
   * Close the day
   */
  fastify.post<{ Body: ZamknijDzienRequest }>(
    '/zamkniecia',
    { onRequest: [authenticate, authorize('MANAGER', 'WLASCICIEL')] },
    async (request: FastifyRequest<{ Body: ZamknijDzienRequest }>, reply: FastifyReply) => {
      try {
        const data = validateSchema<ZamknijDzienRequest>(zamknijDzienSchema, request.body);
        const authenticatedUser = (request as any).authenticatedUser;

        const zamkniecie = await raportyService.zamknijDzien(
          new Date(data.data),
          data.gotowkaRzeczywista,
          data.kartaRzeczywista,
          data.uwagi,
          authenticatedUser.userId
        );

        return reply.code(201).send({
          success: true,
          data: zamkniecie,
        });
      } catch (error) {
        throw error;
      }
    }
  );
}
