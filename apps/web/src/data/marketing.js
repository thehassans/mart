import {
  Barcode,
  Building2,
  Cloud,
  PackageSearch,
  ReceiptText,
  Scale,
  ShieldCheck,
  Store,
} from 'lucide-react';

export const featureCards = [
  {
    key: 'zatca',
    icon: ShieldCheck,
    titleKey: 'features.cards.zatca.title',
    descriptionKey: 'features.cards.zatca.description',
  },
  {
    key: 'tenant',
    icon: Cloud,
    titleKey: 'features.cards.tenant.title',
    descriptionKey: 'features.cards.tenant.description',
  },
  {
    key: 'offline-pos',
    icon: Store,
    titleKey: 'features.cards.offlinePos.title',
    descriptionKey: 'features.cards.offlinePos.description',
  },
  {
    key: 'inventory',
    icon: PackageSearch,
    titleKey: 'features.cards.inventory.title',
    descriptionKey: 'features.cards.inventory.description',
  },
];

export const marketingHighlights = [
  {
    icon: ReceiptText,
    labelKey: 'hero.highlights.receiptLabel',
    valueKey: 'hero.highlights.receiptValue',
  },
  {
    icon: Scale,
    labelKey: 'hero.highlights.weightedLabel',
    valueKey: 'hero.highlights.weightedValue',
  },
  {
    icon: Barcode,
    labelKey: 'hero.highlights.labelsLabel',
    valueKey: 'hero.highlights.labelsValue',
  },
  {
    icon: Building2,
    labelKey: 'hero.highlights.tenantLabel',
    valueKey: 'hero.highlights.tenantValue',
  },
];

export const pricingPlans = {
  monthly: [
    {
      key: 'bakala',
      nameKey: 'pricing.bakala',
      price: '199',
      descriptionKey: 'pricing.plans.bakalaDescription',
      highlighted: false,
      featureKeys: [
        'pricing.features.fastPos',
        'pricing.features.zatcaReceipts',
        'pricing.features.coreInventory',
        'pricing.features.offlineQueue',
      ],
    },
    {
      key: 'superstore',
      nameKey: 'pricing.superstore',
      price: '699',
      descriptionKey: 'pricing.plans.superstoreDescription',
      highlighted: true,
      featureKeys: [
        'pricing.features.everythingInBakala',
        'pricing.features.scaleIntegration',
        'pricing.features.labelPrinting',
        'pricing.features.advancedProcurement',
      ],
    },
  ],
  yearly: [
    {
      key: 'bakala',
      nameKey: 'pricing.bakala',
      price: '1910',
      descriptionKey: 'pricing.plans.bakalaDescription',
      highlighted: false,
      featureKeys: [
        'pricing.features.fastPos',
        'pricing.features.zatcaReceipts',
        'pricing.features.coreInventory',
        'pricing.features.offlineQueue',
      ],
    },
    {
      key: 'superstore',
      nameKey: 'pricing.superstore',
      price: '6710',
      descriptionKey: 'pricing.plans.superstoreDescription',
      highlighted: true,
      featureKeys: [
        'pricing.features.everythingInBakala',
        'pricing.features.scaleIntegration',
        'pricing.features.labelPrinting',
        'pricing.features.advancedProcurement',
      ],
    },
  ],
};
