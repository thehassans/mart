import mongoose from 'mongoose';
import { PAYMENT_METHODS, SALE_STATUSES } from '@vitalblaze/shared';

const saleLineSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    nameSnapshot: {
      en: {
        type: String,
        trim: true,
        required: true,
      },
      ar: {
        type: String,
        trim: true,
        required: true,
      },
    },
    sku: {
      type: String,
      trim: true,
      required: true,
    },
    barcode: {
      type: String,
      trim: true,
      default: '',
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.001,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    lineSubtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    vatRate: {
      type: Number,
      required: true,
      min: 0,
    },
    vatAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    isWeighedItem: {
      type: Boolean,
      default: false,
    },
    scalePayload: {
      rawBarcode: {
        type: String,
        trim: true,
        default: '',
      },
      embeddedValue: {
        type: Number,
        default: null,
      },
      quantityMode: {
        type: String,
        trim: true,
        default: '',
      },
    },
  },
  {
    _id: false,
  }
);

const paymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    reference: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    _id: false,
  }
);

const saleSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift',
      default: null,
      index: true,
    },
    cashierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    receiptNumber: {
      type: String,
      trim: true,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(SALE_STATUSES),
      default: SALE_STATUSES.COMPLETED,
      index: true,
    },
    items: {
      type: [saleLineSchema],
      default: [],
      validate: {
        validator: (items) => items.length > 0,
        message: 'A sale must contain at least one item.',
      },
    },
    payments: {
      type: [paymentSchema],
      default: [],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discountTotal: {
      type: Number,
      default: 0,
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
    amountTendered: {
      type: Number,
      default: 0,
      min: 0,
    },
    changeDue: {
      type: Number,
      default: 0,
      min: 0,
    },
    isOfflineQueued: {
      type: Boolean,
      default: false,
      index: true,
    },
    zatcaQRCodeData: {
      type: String,
      trim: true,
      default: '',
    },
    soldAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

saleSchema.index({ tenantId: 1, receiptNumber: 1 }, { unique: true });
saleSchema.index({ tenantId: 1, soldAt: 1, status: 1 });

export const Sale = mongoose.model('Sale', saleSchema);
