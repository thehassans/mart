import mongoose from 'mongoose';
import { SHIFT_STATUSES } from '@vitalblaze/shared';

const shiftSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    registerId: {
      type: String,
      trim: true,
      required: true,
    },
    openedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(SHIFT_STATUSES),
      default: SHIFT_STATUSES.OPEN,
      index: true,
    },
    openingFloat: {
      type: Number,
      required: true,
      min: 0,
    },
    expectedClosingCash: {
      type: Number,
      default: 0,
      min: 0,
    },
    actualClosingCash: {
      type: Number,
      default: 0,
      min: 0,
    },
    cashVariance: {
      type: Number,
      default: 0,
    },
    openedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

shiftSchema.pre('save', function computeCashVariance(next) {
  this.cashVariance = Number(this.actualClosingCash || 0) - Number(this.expectedClosingCash || 0);
  next();
});

shiftSchema.index({ tenantId: 1, registerId: 1, status: 1 });

export const Shift = mongoose.model('Shift', shiftSchema);
