import { Router } from 'express';
import mongoose from 'mongoose';
import { BUSINESS_TYPES, USER_ROLES } from '@vitalblaze/shared';
import { issueAccessToken } from '../middleware/auth.js';
import { buildTenantSessionUser, findTenantByAdminCredentials } from '../services/tenantRegistry.js';

function buildDefaultTenantId() {
  return new mongoose.Types.ObjectId().toString();
}

function resolveSupportedBusinessType(value) {
  return Object.values(BUSINESS_TYPES).includes(value) ? value : BUSINESS_TYPES.BAKALA;
}

function normalizeCredential(value) {
  return String(value || '').trim().toLowerCase();
}

export function createAuthRouter({ jwtSecret }) {
  const router = Router();

  router.get('/roles', (_req, res) => {
    res.json({ roles: Object.values(USER_ROLES) });
  });

  router.post('/demo-login', (req, res) => {
    const defaultTenantId = process.env.SUPER_ADMIN_TENANT_ID || buildDefaultTenantId();
    const requestBody = req.body || {};
    const username = normalizeCredential(requestBody.username);
    const password = String(requestBody.password || '');

    const credentialProfiles = [
      {
        username: normalizeCredential(process.env.SUPER_ADMIN_USERNAME || 'superadmin'),
        email: process.env.SUPER_ADMIN_EMAIL || 'admin@buysialerp.sa',
        password: process.env.SUPER_ADMIN_PASSWORD || 'superadmin123',
        role: USER_ROLES.SUPER_ADMIN,
        tenantId: process.env.SUPER_ADMIN_TENANT_ID || defaultTenantId,
        businessType: resolveSupportedBusinessType(process.env.SUPER_ADMIN_BUSINESS_TYPE),
        name: process.env.SUPER_ADMIN_NAME || 'Buysial ERP Admin',
      },
      {
        username: normalizeCredential(process.env.ADMIN_USERNAME || 'admin'),
        email: process.env.ADMIN_EMAIL || 'branch@buysialerp.sa',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        role: USER_ROLES.STORE_ADMIN,
        tenantId: process.env.ADMIN_TENANT_ID || defaultTenantId,
        businessType: resolveSupportedBusinessType(process.env.ADMIN_BUSINESS_TYPE || BUSINESS_TYPES.GROCERY_STORE),
        name: process.env.ADMIN_NAME || 'Branch Admin',
      },
    ];

    const matchedProfile = credentialProfiles.find(
      (profile) =>
        password &&
        password === profile.password &&
        username &&
        (username === profile.username || username === normalizeCredential(profile.email))
    );

    if (username || password) {
      const handleCredentialLogin = async () => {
        if (matchedProfile) {
          const token = issueAccessToken(
            {
              sub: matchedProfile.email,
              email: matchedProfile.email,
              name: matchedProfile.name,
              role: matchedProfile.role,
              tenantId: matchedProfile.tenantId,
              businessType: matchedProfile.businessType,
            },
            jwtSecret
          );

          return res.json({
            token,
            user: {
              email: matchedProfile.email,
              name: matchedProfile.name,
              role: matchedProfile.role,
              tenantId: matchedProfile.tenantId,
              businessType: matchedProfile.businessType,
            },
          });
        }

        const tenant = await findTenantByAdminCredentials(username, password, { databaseReady: req.app.locals.databaseReady });

        if (!tenant) {
          return res.status(401).json({ message: 'Invalid username or password.' });
        }

        const tenantUser = buildTenantSessionUser(tenant);
        const token = issueAccessToken(
          {
            sub: tenantUser.email,
            email: tenantUser.email,
            name: tenantUser.name,
            role: tenantUser.role,
            tenantId: tenantUser.tenantId,
            businessType: tenantUser.businessType,
          },
          jwtSecret
        );

        return res.json({
          token,
          user: tenantUser,
        });
      };

      return handleCredentialLogin().catch((error) => {
        return res.status(500).json({ message: error.message || 'Unable to login right now.' });
      });
    }

    const {
      email = process.env.SUPER_ADMIN_EMAIL || 'admin@buysialerp.sa',
      role = USER_ROLES.SUPER_ADMIN,
      tenantId = defaultTenantId,
      businessType = resolveSupportedBusinessType(process.env.SUPER_ADMIN_BUSINESS_TYPE),
      name = process.env.SUPER_ADMIN_NAME || 'Buysial ERP Admin',
    } = requestBody;

    if (!Object.values(USER_ROLES).includes(role)) {
      return res.status(400).json({ message: 'Unsupported role supplied for demo login.' });
    }

    if (!Object.values(BUSINESS_TYPES).includes(businessType)) {
      return res.status(400).json({ message: 'Unsupported business type supplied for demo login.' });
    }

    const token = issueAccessToken(
      {
        sub: email,
        email,
        name,
        role,
        tenantId,
        businessType,
      },
      jwtSecret
    );

    return res.json({
      token,
      user: {
        email,
        name,
        role,
        tenantId,
        businessType,
      },
    });
  });

  return router;
}
