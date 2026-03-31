import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { BUSINESS_TYPE_CAPABILITIES, BUSINESS_TYPES, TENANT_SUBSCRIPTION_PLANS } from '@vitalblaze/shared';

const nationalAddressSchema = new mongoose.Schema(
  {
    buildingNumber: {
      type: String,
      trim: true,
      required: true,
    },
    street: {
      type: String,
      trim: true,
      required: true,
    },
    district: {
      type: String,
      trim: true,
      required: true,
    },
    city: {
      type: String,
      trim: true,
      required: true,
    },
    postalCode: {
      type: String,
      trim: true,
      required: true,
    },
    additionalNumber: {
      type: String,
      trim: true,
    },
    countryCode: {
      type: String,
      trim: true,
      default: 'SA',
    },
  },
  {
    _id: false,
  }
);

const tenantSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      trim: true,
      required: true,
    },
    logoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    crNumber: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      index: true,
    },
    vatNumber: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      index: true,
      validate: {
        validator: (value) => /^\d{15}$/.test(value),
        message: 'VAT number must be exactly 15 digits.',
      },
    },
    nationalAddress: {
      type: nationalAddressSchema,
      required: true,
    },
    businessType: {
      type: String,
      enum: Object.values(BUSINESS_TYPES),
      required: true,
      index: true,
    },
    adminEmail: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
      unique: true,
      index: true,
    },
    adminPasswordHash: {
      type: String,
      required: true,
      minlength: 60,
    },
    subscriptionPlan: {
      type: String,
      enum: Object.values(TENANT_SUBSCRIPTION_PLANS),
      default: TENANT_SUBSCRIPTION_PLANS.TRIAL_7_DAYS,
    },
    subscriptionStartsAt: {
      type: Date,
      default: Date.now,
    },
    subscriptionEndsAt: {
      type: Date,
      default: Date.now,
    },
    isTrial: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.adminPasswordHash;
        return ret;
      },
    },
  }
);

tenantSchema.virtual('capabilityProfile').get(function capabilityProfile() {
  return BUSINESS_TYPE_CAPABILITIES[this.businessType];
});

tenantSchema.statics.hashAdminPassword = async function hashAdminPassword(plainTextPassword) {
  if (!plainTextPassword || plainTextPassword.length < 8) {
    throw new Error('Admin password must be at least 8 characters long.');
  }

  return bcrypt.hash(plainTextPassword, 12);
};

tenantSchema.methods.compareAdminPassword = function compareAdminPassword(plainTextPassword) {
  return bcrypt.compare(plainTextPassword, this.adminPasswordHash);
};

export const Tenant = mongoose.model('Tenant', tenantSchema);
