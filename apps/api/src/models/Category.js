import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
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
    slug: {
      type: String,
      trim: true,
      required: true,
    },
    parentCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    sortOrder: {
      type: Number,
      default: 0,
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

categorySchema.index({ tenantId: 1, slug: 1 }, { unique: true });

export const Category = mongoose.model('Category', categorySchema);
