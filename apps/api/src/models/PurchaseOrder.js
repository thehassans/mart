import mongoose from 'mongoose';
import { PURCHASE_ORDER_STATUSES } from '@vitalblaze/shared';

const purchaseOrderLineSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    sku: {
      type: String,
      trim: true,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      required: true,
    },
    orderedQty: {
      type: Number,
      required: true,
      min: 0.001,
    },
    receivedQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },
    vatRate: {
      type: Number,
      default: 15,
      min: 0,
    },
    lineSubtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
      index: true,
    },
    poNumber: {
      type: String,
      trim: true,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PURCHASE_ORDER_STATUSES),
      default: PURCHASE_ORDER_STATUSES.DRAFT,
      index: true,
    },
    orderedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    expectedDeliveryDate: {
      type: Date,
      default: null,
    },
    items: {
      type: [purchaseOrderLineSchema],
      default: [],
      validate: {
        validator: (items) => items.length > 0,
        message: 'Purchase orders must contain at least one line item.',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    vatTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
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

purchaseOrderSchema.index({ tenantId: 1, poNumber: 1 }, { unique: true });

export const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);
