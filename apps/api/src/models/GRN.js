import mongoose from 'mongoose';

const grnLineSchema = new mongoose.Schema(
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
    receivedQty: {
      type: Number,
      required: true,
      min: 0.001,
    },
    acceptedQty: {
      type: Number,
      required: true,
      min: 0,
    },
    rejectedQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },
    batchNumber: {
      type: String,
      trim: true,
      default: '',
    },
    packedDate: {
      type: Date,
      default: null,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const grnSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    purchaseOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      required: true,
      index: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
      index: true,
    },
    grnNumber: {
      type: String,
      trim: true,
      required: true,
    },
    supplierInvoiceNumber: {
      type: String,
      trim: true,
      default: '',
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    receivedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    items: {
      type: [grnLineSchema],
      default: [],
      validate: {
        validator: (items) => items.length > 0,
        message: 'Goods received notes must contain at least one line item.',
      },
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

grnSchema.index({ tenantId: 1, grnNumber: 1 }, { unique: true });

export const GRN = mongoose.model('GRN', grnSchema);
