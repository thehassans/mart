import { Router } from 'express';
import { BUSINESS_TYPES, TENANT_SUBSCRIPTION_PLANS, USER_ROLES } from '@vitalblaze/shared';
import { authenticateJwt, authorizeRoles, enforceTenantScope } from '../middleware/auth.js';
import { createTenantRecord, getTenantById } from '../services/tenantRegistry.js';

function assertTenantPayload(payload) {
  const requiredFields = [
    ['storeName', payload.storeName],
    ['crNumber', payload.crNumber],
    ['vatNumber', payload.vatNumber],
    ['adminEmail', payload.adminEmail],
    ['adminPassword', payload.adminPassword],
    ['nationalAddress.buildingNumber', payload.nationalAddress?.buildingNumber],
    ['nationalAddress.street', payload.nationalAddress?.street],
    ['nationalAddress.district', payload.nationalAddress?.district],
    ['nationalAddress.city', payload.nationalAddress?.city],
    ['nationalAddress.postalCode', payload.nationalAddress?.postalCode],
  ];

  const missingField = requiredFields.find(([, value]) => !String(value || '').trim());
  if (missingField) {
    throw new Error(`${missingField[0]} is required.`);
  }

  if (!Object.values(BUSINESS_TYPES).includes(payload.businessType)) {
    throw new Error('Unsupported business type supplied.');
  }

  if (!Object.values(TENANT_SUBSCRIPTION_PLANS).includes(payload.subscriptionPlan)) {
    throw new Error('Unsupported subscription plan supplied.');
  }

  if (!/^\d{15}$/.test(String(payload.vatNumber || '').trim())) {
    throw new Error('VAT number must be exactly 15 digits.');
  }
}

export function createTenantRouter({ jwtSecret }) {
  const router = Router();

  router.post(
    '/',
    authenticateJwt({ secret: jwtSecret }),
    authorizeRoles(USER_ROLES.SUPER_ADMIN),
    async (req, res, next) => {
      try {
        const payload = req.body || {};
        assertTenantPayload(payload);

        const tenant = await createTenantRecord(payload, { databaseReady: req.app.locals.databaseReady });

        return res.status(201).json({
          message: 'Tenant created successfully.',
          tenant,
        });
      } catch (error) {
        if (error.name === 'ValidationError' || error.code === 11000 || /required|exists|Unsupported|VAT number|password/i.test(error.message || '')) {
          return res.status(400).json({ message: error.message || 'Unable to create tenant.' });
        }

        return next(error);
      }
    }
  );

  router.get(
    '/:tenantId/secure-profile',
    authenticateJwt({ secret: jwtSecret }),
    authorizeRoles(USER_ROLES.SUPER_ADMIN, USER_ROLES.STORE_ADMIN, USER_ROLES.MANAGER, USER_ROLES.CASHIER),
    enforceTenantScope({ source: 'params', key: 'tenantId' }),
    async (req, res, next) => {
      try {
        const tenant = await getTenantById(req.params.tenantId, { databaseReady: req.app.locals.databaseReady });

        res.json({
          message: 'Tenant scope validated successfully.',
          tenantId: req.params.tenantId,
          auth: req.auth,
          tenant,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
