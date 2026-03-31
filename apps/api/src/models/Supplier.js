import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    supplierName: {
      type: String,
      trim: true,
      required: true,
    },
    supplierCode: {
      type: String,
      trim: true,
      required: true,
    },
    contactPerson: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    vatNumber: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: (value) => !value || /^\d{15}$/.test(value),
        message: 'Supplier VAT number must be exactly 15 digits.',
      },
    },
    address: {
      type: String,
      trim: true,
      default: '',
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

supplierSchema.index({ tenantId: 1, supplierCode: 1 }, { unique: true });
supplierSchema.index({ tenantId: 1, supplierName: 1 });

export const Supplier = mongoose.model('Supplier', supplierSchema);
