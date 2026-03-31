import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import InventoryDataTable from '../components/inventory/InventoryDataTable.jsx';
import BarcodePrinterModal from '../components/inventory/BarcodePrinterModal.jsx';
import BusinessTypeSelector from '../components/ui/BusinessTypeSelector.jsx';
import WorkspaceHero from '../components/ui/WorkspaceHero.jsx';
import { demoProducts } from '../data/demo.js';

export default function AdminInventoryPage() {
  const { t } = useTranslation();
  const { businessType, setBusinessType } = useOutletContext();
  const [selectedProduct, setSelectedProduct] = useState(null);

  const products = useMemo(
    () => demoProducts.filter((product) => product.businessTypes.includes(businessType)),
    [businessType]
  );

  return (
    <div className="space-y-8">
      <WorkspaceHero eyebrow={t('inventory.eyebrow')} subtitle={t('inventory.subtitle')} title={t('workspaceNav.inventory')} />
      <BusinessTypeSelector businessType={businessType} onChange={setBusinessType} />
      <InventoryDataTable businessType={businessType} onPrintLabel={setSelectedProduct} products={products} />
      <BarcodePrinterModal isOpen={Boolean(selectedProduct)} onClose={() => setSelectedProduct(null)} product={selectedProduct} />
    </div>
  );
}
