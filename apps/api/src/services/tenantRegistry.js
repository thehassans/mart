import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { BUSINESS_TYPE_CAPABILITIES, BUSINESS_TYPES, TENANT_SUBSCRIPTION_PLANS, USER_ROLES } from '@vitalblaze/shared';
import { Tenant } from '../models/Tenant.js';

const demoTenants = new Map();

function normalizeCredential(value) {
  return String(value || '').trim().toLowerCase();
}

function addMonths(date, months) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate;
}

function resolveSubscriptionWindow(subscriptionPlan, referenceDate = new Date()) {
  const startsAt = new Date(referenceDate);
  let endsAt = new Date(referenceDate);

  switch (subscriptionPlan) {
    case TENANT_SUBSCRIPTION_PLANS.TRIAL_7_DAYS:
      endsAt.setDate(endsAt.getDate() + 7);
      break;
    case TENANT_SUBSCRIPTION_PLANS.MONTHS_3:
      endsAt = addMonths(referenceDate, 3);
      break;
    case TENANT_SUBSCRIPTION_PLANS.MONTHS_6:
      endsAt = addMonths(referenceDate, 6);
      break;
    case TENANT_SUBSCRIPTION_PLANS.YEAR_1:
      endsAt = addMonths(referenceDate, 12);
      break;
    default:
      endsAt.setDate(endsAt.getDate() + 7);
      break;
  }

  return {
    subscriptionStartsAt: startsAt.toISOString(),
    subscriptionEndsAt: endsAt.toISOString(),
    isTrial: subscriptionPlan === TENANT_SUBSCRIPTION_PLANS.TRIAL_7_DAYS,
  };
}

function serializeTenantRecord(record) {
  const capabilityProfile = BUSINESS_TYPE_CAPABILITIES[record.businessType] || BUSINESS_TYPE_CAPABILITIES[BUSINESS_TYPES.BAKALA];
  const { adminPasswordHash, ...safeRecord } = record;

  return {
    ...safeRecord,
    capabilityProfile,
    enabledModules: capabilityProfile.enabled,
    hiddenModules: capabilityProfile.limited,
  };
}

function mapTenantDocument(tenantDocument) {
  const tenant = tenantDocument.toJSON();
  return serializeTenantRecord({
    ...tenant,
    id: tenant.id || tenant._id?.toString(),
  });
}

function buildDemoTenantRecord(payload, adminPasswordHash, subscriptionWindow) {
  const timestamp = new Date().toISOString();
  const id = new mongoose.Types.ObjectId().toString();

  return {
    id,
    storeName: payload.storeName,
    logoUrl: payload.logoUrl,
    crNumber: payload.crNumber,
    vatNumber: payload.vatNumber,
    nationalAddress: {
      ...payload.nationalAddress,
      countryCode: payload.nationalAddress.countryCode || 'SA',
    },
    businessType: payload.businessType,
    adminEmail: payload.adminEmail,
    adminPasswordHash,
    subscriptionPlan: payload.subscriptionPlan,
    subscriptionStartsAt: subscriptionWindow.subscriptionStartsAt,
    subscriptionEndsAt: subscriptionWindow.subscriptionEndsAt,
    isTrial: subscriptionWindow.isTrial,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function assertDemoTenantUniqueness(payload) {
  for (const tenant of demoTenants.values()) {
    if (tenant.crNumber === payload.crNumber) {
      throw new Error('A tenant with this CR number already exists.');
    }

    if (tenant.vatNumber === payload.vatNumber) {
      throw new Error('A tenant with this VAT number already exists.');
    }

    if (normalizeCredential(tenant.adminEmail) === normalizeCredential(payload.adminEmail)) {
      throw new Error('A tenant with this admin email already exists.');
    }
  }
}

export async function createTenantRecord(payload, { databaseReady }) {
  const supportedBusinessType = Object.values(BUSINESS_TYPES).includes(payload.businessType) ? payload.businessType : BUSINESS_TYPES.BAKALA;
  const supportedSubscriptionPlan = Object.values(TENANT_SUBSCRIPTION_PLANS).includes(payload.subscriptionPlan)
    ? payload.subscriptionPlan
    : TENANT_SUBSCRIPTION_PLANS.TRIAL_7_DAYS;
  const sanitizedPayload = {
    ...payload,
    storeName: String(payload.storeName || '').trim(),
    logoUrl: String(payload.logoUrl || '').trim(),
    crNumber: String(payload.crNumber || '').trim(),
    vatNumber: String(payload.vatNumber || '').trim(),
    businessType: supportedBusinessType,
    adminEmail: normalizeCredential(payload.adminEmail),
    subscriptionPlan: supportedSubscriptionPlan,
    nationalAddress: {
      buildingNumber: String(payload.nationalAddress?.buildingNumber || '').trim(),
      street: String(payload.nationalAddress?.street || '').trim(),
      district: String(payload.nationalAddress?.district || '').trim(),
      city: String(payload.nationalAddress?.city || '').trim(),
      postalCode: String(payload.nationalAddress?.postalCode || '').trim(),
      additionalNumber: String(payload.nationalAddress?.additionalNumber || '').trim(),
      countryCode: String(payload.nationalAddress?.countryCode || 'SA').trim() || 'SA',
    },
  };
  const adminPasswordHash = await Tenant.hashAdminPassword(payload.adminPassword);
  const subscriptionWindow = resolveSubscriptionWindow(sanitizedPayload.subscriptionPlan);

  if (!databaseReady) {
    assertDemoTenantUniqueness(sanitizedPayload);
    const demoTenant = buildDemoTenantRecord(sanitizedPayload, adminPasswordHash, subscriptionWindow);
    demoTenants.set(demoTenant.id, demoTenant);
    return serializeTenantRecord(demoTenant);
  }

  const tenant = await Tenant.create({
    storeName: sanitizedPayload.storeName,
    logoUrl: sanitizedPayload.logoUrl,
    crNumber: sanitizedPayload.crNumber,
    vatNumber: sanitizedPayload.vatNumber,
    nationalAddress: sanitizedPayload.nationalAddress,
    businessType: sanitizedPayload.businessType,
    adminEmail: sanitizedPayload.adminEmail,
    adminPasswordHash,
    subscriptionPlan: sanitizedPayload.subscriptionPlan,
    subscriptionStartsAt: subscriptionWindow.subscriptionStartsAt,
    subscriptionEndsAt: subscriptionWindow.subscriptionEndsAt,
    isTrial: subscriptionWindow.isTrial,
  });

  return mapTenantDocument(tenant);
}

export async function findTenantByAdminCredentials(username, password, { databaseReady }) {
  const normalizedUsername = normalizeCredential(username);
  const normalizedPassword = String(password || '');

  if (!normalizedUsername || !normalizedPassword) {
    return null;
  }

  if (!databaseReady) {
    for (const tenant of demoTenants.values()) {
      if (normalizeCredential(tenant.adminEmail) !== normalizedUsername) {
        continue;
      }

      const isPasswordMatch = await bcrypt.compare(normalizedPassword, tenant.adminPasswordHash);
      if (!isPasswordMatch) {
        return null;
      }

      return serializeTenantRecord(tenant);
    }

    return null;
  }

  const tenant = await Tenant.findOne({ adminEmail: normalizedUsername });
  if (!tenant) {
    return null;
  }

  const isPasswordMatch = await tenant.compareAdminPassword(normalizedPassword);
  if (!isPasswordMatch) {
    return null;
  }

  return mapTenantDocument(tenant);
}

export async function getTenantById(tenantId, { databaseReady }) {
  if (!tenantId) {
    return null;
  }

  if (!databaseReady) {
    return demoTenants.has(String(tenantId)) ? serializeTenantRecord(demoTenants.get(String(tenantId))) : null;
  }

  const tenant = await Tenant.findById(tenantId);
  return tenant ? mapTenantDocument(tenant) : null;
}

export function buildTenantSessionUser(tenant) {
  return {
    email: tenant.adminEmail,
    name: tenant.storeName,
    storeName: tenant.storeName,
    logoUrl: tenant.logoUrl,
    role: USER_ROLES.STORE_ADMIN,
    tenantId: tenant.id || tenant._id,
    businessType: tenant.businessType,
    subscriptionPlan: tenant.subscriptionPlan,
    subscriptionEndsAt: tenant.subscriptionEndsAt,
  };
}
