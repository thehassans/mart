import { useMemo, useState } from 'react';
import { BUSINESS_TYPES } from '@vitalblaze/shared';
import { useTranslation } from 'react-i18next';
import InventoryDataTable from '../components/inventory/InventoryDataTable.jsx';
import BarcodePrinterModal from '../components/inventory/BarcodePrinterModal.jsx';
import SiteHeader from '../components/layout/SiteHeader.jsx';
import MarketingFooter from '../components/marketing/MarketingFooter.jsx';
import BusinessTypeSelector from '../components/ui/BusinessTypeSelector.jsx';
import WorkspaceHero from '../components/ui/WorkspaceHero.jsx';
import { demoProducts } from '../data/demo.js';

export default function InventoryPage() {
  const { t } = useTranslation();
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES.GROCERY_STORE);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const products = useMemo(
    () => demoProducts.filter((product) => product.businessTypes.includes(businessType)),
    [businessType]
  );

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-7xl space-y-8 px-6 py-16 lg:px-8 lg:py-20">
        <WorkspaceHero eyebrow={t('inventory.eyebrow')} subtitle={t('inventory.subtitle')} title={t('inventory.title')} />
        <BusinessTypeSelector businessType={businessType} onChange={setBusinessType} />
        <InventoryDataTable businessType={businessType} onPrintLabel={setSelectedProduct} products={products} />
      </main>
      <MarketingFooter />
      <BarcodePrinterModal isOpen={Boolean(selectedProduct)} onClose={() => setSelectedProduct(null)} product={selectedProduct} />
    </div>
  );
}
