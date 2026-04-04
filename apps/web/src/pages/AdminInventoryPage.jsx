import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdminTheme } from '../utils/adminTheme.js';
import { apiRequest } from '../utils/api.js';
import InventoryCatalogImportPanel from '../components/inventory/InventoryCatalogImportPanel.jsx';
import InventoryDataTable from '../components/inventory/InventoryDataTable.jsx';
import BarcodePrinterModal from '../components/inventory/BarcodePrinterModal.jsx';
import BusinessTypeSelector from '../components/ui/BusinessTypeSelector.jsx';
import Button from '../components/ui/Button.jsx';
import WorkspaceHero from '../components/ui/WorkspaceHero.jsx';

export default function AdminInventoryPage() {
  const { t } = useTranslation();
  const { isDark } = useAdminTheme();
  const { businessType, setBusinessType, session } = useOutletContext();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadProducts = useCallback(async () => {
    if (!session?.token || !session?.user?.tenantId) {
      setProducts([]);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const payload = await apiRequest('/api/products', {
        token: session.token,
        query: {
          tenantId: session.user.tenantId,
          limit: 200,
        },
      });

      setProducts(payload.products || []);
    } catch (error) {
      setProducts([]);
      setErrorMessage(error.message || t('inventory.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [session?.token, session?.user?.tenantId, t]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return (
    <div className="space-y-8">
      <WorkspaceHero
        action={
          <Button disabled={isLoading} onClick={loadProducts} variant="secondary">
            <RefreshCw className={`me-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`.trim()} />
            {t('inventory.refresh')}
          </Button>
        }
        eyebrow={t('inventory.eyebrow')}
        subtitle={t('inventory.subtitle')}
        title={t('workspaceNav.inventory')}
      />
      <BusinessTypeSelector businessType={businessType} onChange={setBusinessType} />
      {errorMessage ? <div className={isDark ? 'rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200' : 'rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'}>{errorMessage}</div> : null}
      <InventoryCatalogImportPanel onProductCreated={loadProducts} session={session} />
      <InventoryDataTable businessType={businessType} isLoading={isLoading} onPrintLabel={setSelectedProduct} products={products} />
      <BarcodePrinterModal isOpen={Boolean(selectedProduct)} onClose={() => setSelectedProduct(null)} product={selectedProduct} />
    </div>
  );
}
