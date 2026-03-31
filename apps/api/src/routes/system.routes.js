import { Router } from 'express';
import { BUSINESS_TYPE_CAPABILITIES, BUSINESS_TYPES, SCALE_BARCODE_PREFIXES, USER_ROLES } from '@vitalblaze/shared';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'buysial-erp-api',
    databaseReady: _req.app.locals.databaseReady,
    timestamp: new Date().toISOString(),
  });
});

router.get('/domain/bootstrap', (_req, res) => {
  res.json({
    businessTypes: Object.values(BUSINESS_TYPES),
    capabilityMap: BUSINESS_TYPE_CAPABILITIES,
    roles: Object.values(USER_ROLES),
    scaleBarcodePrefixes: SCALE_BARCODE_PREFIXES,
  });
});

export { router as systemRouter };
