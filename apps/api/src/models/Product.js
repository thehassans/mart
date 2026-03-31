import mongoose from 'mongoose';
import { PRODUCT_UNITS, SCALE_BARCODE_PREFIXES } from '@vitalblaze/shared';

const localizedNameSchema = new mongoose.Schema(
  {
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
  {
    _id: false,
  }
);

const productSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
    },
    name: {
      type: localizedNameSchema,
      required: true,
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
    costPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    vatRate: {
      type: Number,
      required: true,
      default: 15,
      min: 0,
      max: 100,
    },
    unit: {
      type: String,
      enum: Object.values(PRODUCT_UNITS),
      default: PRODUCT_UNITS.EACH,
    },
    isWeighedItem: {
      type: Boolean,
      default: false,
      index: true,
    },
    scaleBarcodePrefix: {
      type: String,
      trim: true,
      default: '20',
      validate: {
        validator: (value) => !value || SCALE_BARCODE_PREFIXES.includes(value),
        message: 'Scale barcode prefix must use a supported weighted-item prefix.',
      },
    },
    scaleItemCode: {
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
      index: true,
    },
    requiresExpiryTracking: {
      type: Boolean,
      default: true,
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    reorderLevel: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ tenantId: 1, sku: 1 }, { unique: true });
productSchema.index({ tenantId: 1, barcode: 1 }, { unique: true, sparse: true });
productSchema.index({ tenantId: 1, 'name.en': 1, 'name.ar': 1 });

productSchema.pre('validate', function validateWeighedItem(next) {
  if (this.isWeighedItem && !this.scaleItemCode) {
    return next(new Error('Weighted items must define a scaleItemCode for scale barcode parsing.'));
  }

  return next();
});

export const Product = mongoose.model('Product', productSchema);
