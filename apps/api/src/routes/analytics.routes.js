import { Router } from 'express';
import { USER_ROLES } from '@vitalblaze/shared';
import { authenticateJwt, authorizeRoles, enforceTenantScope } from '../middleware/auth.js';
import { buildVatReturnUnionPipeline, calculateVatReturn } from '../services/analytics.js';

export function createAnalyticsRouter({ jwtSecret }) {
  const router = Router();

  router.get(
    '/vat-return',
    authenticateJwt({ secret: jwtSecret }),
    authorizeRoles(USER_ROLES.SUPER_ADMIN, USER_ROLES.STORE_ADMIN, USER_ROLES.MANAGER),
    enforceTenantScope({ source: 'query', key: 'tenantId' }),
    async (req, res, next) => {
      try {
        if (!req.app.locals.databaseReady) {
          return res.status(503).json({ message: 'Database is unavailable in demo mode.' });
        }

        const { tenantId, from, to } = req.query;
        const vatReturn = await calculateVatReturn({ tenantId, from, to });

        return res.json({
          filters: { tenantId, from, to },
          summary: vatReturn,
          pipeline: buildVatReturnUnionPipeline({ tenantId, from, to }),
        });
      } catch (error) {
        return next(error);
      }
    }
  );

  return router;
}
