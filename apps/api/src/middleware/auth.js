import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { USER_ROLES } from '@vitalblaze/shared';

function extractBearerToken(authorizationHeader) {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return null;
  }

  return authorizationHeader.slice('Bearer '.length).trim();
}

export function issueAccessToken(payload, secret, expiresIn = '8h') {
  if (!secret) {
    throw new Error('JWT secret is required to issue access tokens.');
  }

  return jwt.sign(payload, secret, { expiresIn });
}

export function authenticateJwt({ secret }) {
  return (req, res, next) => {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      return res.status(401).json({ message: 'Missing Bearer token.' });
    }

    try {
      req.auth = jwt.verify(token, secret);
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }
  };
}

export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.auth?.role) {
      return res.status(401).json({ message: 'Authentication context is missing.' });
    }

    if (!allowedRoles.includes(req.auth.role)) {
      return res.status(403).json({ message: 'You do not have permission to access this resource.' });
    }

    return next();
  };
}

export function enforceTenantScope({ source = 'params', key = 'tenantId' } = {}) {
  return (req, res, next) => {
    const tenantId = req[source]?.[key];

    if (!tenantId) {
      return res.status(400).json({ message: `Missing ${key} for tenant scope enforcement.` });
    }

    if (!mongoose.isValidObjectId(tenantId)) {
      return res.status(400).json({ message: `${key} must be a valid MongoDB ObjectId.` });
    }

    if (req.auth?.role === USER_ROLES.SUPER_ADMIN) {
      return next();
    }

    if (String(req.auth?.tenantId || '') !== String(tenantId)) {
      return res.status(403).json({ message: 'Tenant scope violation detected.' });
    }

    return next();
  };
}
