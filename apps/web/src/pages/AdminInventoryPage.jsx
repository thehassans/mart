import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import InventoryDataTable from '../components/inventory/InventoryDataTable.jsx';
import BarcodePrinterModal from '../components/inventory/BarcodePrinterModal.jsx';
import Button from '../components/ui/Button.jsx';
import BusinessTypeSelector from '../components/ui/BusinessTypeSelector.jsx';
import Field from '../components/ui/Field.jsx';
import GlassPanel from '../components/ui/GlassPanel.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import WorkspaceHero from '../components/ui/WorkspaceHero.jsx';
import { resolveApiBaseUrl } from '../utils/api.js';
import { useCatalogProducts } from '../utils/catalog.js';

export default function AdminInventoryPage() {
  const { t } = useTranslation();
  const { businessType, setBusinessType, session } = useOutletContext();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [sources, setSources] = useState([]);
  const [sourceKey, setSourceKey] = useState('tamimi');
  const [maxProducts, setMaxProducts] = useState('250');
  const [detailEnrichmentLimit, setDetailEnrichmentLimit] = useState('60');
  const [categoryUrls, setCategoryUrls] = useState('');
  const [discoveredCategoryCount, setDiscoveredCategoryCount] = useState(0);
  const [previewItems, setPreviewItems] = useState([]);
  const [previewMeta, setPreviewMeta] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isDiscoveringCategories, setIsDiscoveringCategories] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { products, source } = useCatalogProducts({ businessType, session, reloadKey });
  const token = String(session?.token || '').trim();
  const tenantId = String(session?.user?.tenantId || '').trim();

  useEffect(() => {
    let isCancelled = false;

    async function loadSources() {
      if (!token) {
        return;
      }

      try {
        const response = await fetch(`${resolveApiBaseUrl()}/api/products/import-sources`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.message || 'Unable to load market import sources.');
        }

        if (isCancelled) {
          return;
        }

        setSources(Array.isArray(payload.sources) ? payload.sources : []);
      } catch (error) {
        if (!isCancelled) {
          setStatusMessage(error.message || 'Unable to load market import sources.');
        }
      }
    }

    loadSources();

    return () => {
      isCancelled = true;
    };
  }, [token]);

  async function handlePreviewImport() {
    if (!token) {
      return;
    }

    setIsPreviewing(true);
    setStatusMessage('');

    try {
      const response = await fetch(`${resolveApiBaseUrl()}/api/products/import/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sourceKey,
          maxProducts: Number(maxProducts || 0),
          detailEnrichmentLimit: Number(detailEnrichmentLimit || 0),
          categoryUrls: categoryUrls
            .split(/\r?\n/)
            .map((value) => value.trim())
            .filter(Boolean),
          enrichProducts: true,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to preview market import.');
      }

      setPreviewMeta(payload.preview || null);
      setPreviewItems(Array.isArray(payload.preview?.items) ? payload.preview.items : []);
      setStatusMessage(`Preview loaded: ${payload.preview?.totalDiscovered || 0} products from ${payload.preview?.sourceLabel || sourceKey}. Categories scanned: ${payload.preview?.categoriesScanned || 0}. Failed categories: ${payload.preview?.failedCategoryCount || 0}.`);
    } catch (error) {
      setStatusMessage(error.message || 'Unable to preview market import.');
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleDiscoverCategories() {
    if (!token) {
      return;
    }

    setIsDiscoveringCategories(true);
    setStatusMessage('');

    try {
      const params = new URLSearchParams({ sourceKey });
      const response = await fetch(`${resolveApiBaseUrl()}/api/products/import-categories?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to discover market categories.');
      }

      const resolvedUrls = Array.isArray(payload.categoryUrls) ? payload.categoryUrls : [];
      setDiscoveredCategoryCount(resolvedUrls.length);
      setCategoryUrls(resolvedUrls.join('\n'));
      setStatusMessage(`Loaded ${resolvedUrls.length} category URLs for ${payload.sourceKey}.`);
    } catch (error) {
      setStatusMessage(error.message || 'Unable to discover market categories.');
    } finally {
      setIsDiscoveringCategories(false);
    }
  }

  async function handleSyncImport() {
    if (!token || !tenantId) {
      return;
    }

    setIsSyncing(true);
    setStatusMessage('');

    try {
      const response = await fetch(`${resolveApiBaseUrl()}/api/products/import/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenantId,
          sourceKey,
          maxProducts: Number(maxProducts || 0),
          detailEnrichmentLimit: Number(detailEnrichmentLimit || 0),
          categoryUrls: categoryUrls
            .split(/\r?\n/)
            .map((value) => value.trim())
            .filter(Boolean),
          enrichProducts: true,
          allowUpdate: true,
          defaultVatRate: 15,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to sync imported products.');
      }

      setReloadKey((currentValue) => currentValue + 1);
      setStatusMessage(`Import complete: created ${payload.summary?.created || 0}, updated ${payload.summary?.updated || 0}, skipped ${payload.summary?.skipped || 0}. Categories scanned: ${payload.summary?.categoriesScanned || 0}. Failed categories: ${payload.summary?.failedCategoryCount || 0}.`);
    } catch (error) {
      setStatusMessage(error.message || 'Unable to sync imported products.');
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="space-y-8">
      <WorkspaceHero eyebrow={t('inventory.eyebrow')} subtitle={t('inventory.subtitle')} title={t('workspaceNav.inventory')} />
      <BusinessTypeSelector businessType={businessType} onChange={setBusinessType} />
      <GlassPanel className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-200">Saudi Market Import</p>
            <h3 className="mt-2 text-xl font-semibold">Bulk import retailer products into your inventory</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Preview accessible market catalog products first, then sync them into this tenant. Leaving category URLs empty now uses the wider source sitemap when supported.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={source === 'database' ? 'success' : 'warning'}>{source === 'database' ? 'Live DB Catalog' : 'Demo/API Fallback'}</StatusBadge>
            {previewMeta ? <StatusBadge tone="neutral">Preview: {previewMeta.totalDiscovered}</StatusBadge> : null}
            {previewMeta?.categoriesScanned ? <StatusBadge tone="neutral">Categories: {previewMeta.categoriesScanned}</StatusBadge> : null}
            {previewMeta?.enrichedCount ? <StatusBadge tone="neutral">Enriched: {previewMeta.enrichedCount}</StatusBadge> : null}
            {previewMeta?.failedCategoryCount ? <StatusBadge tone="warning">Failed Categories: {previewMeta.failedCategoryCount}</StatusBadge> : null}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          <Field as="select" label="Market source" name="sourceKey" onChange={(event) => setSourceKey(event.target.value)} value={sourceKey}>
            {(sources.length > 0 ? sources : [{ key: 'tamimi', label: 'Tamimi Markets' }]).map((marketSource) => (
              <option key={marketSource.key} value={marketSource.key}>
                {marketSource.label}
              </option>
            ))}
          </Field>
          <Field label="Max products" name="maxProducts" onChange={(event) => setMaxProducts(event.target.value)} type="number" value={maxProducts} />
          <Field label="Detail enrich limit" name="detailEnrichmentLimit" onChange={(event) => setDetailEnrichmentLimit(event.target.value)} type="number" value={detailEnrichmentLimit} />
          <Field label="Tenant scope" name="tenantScope" readOnly value={tenantId || 'No tenant'} />
        </div>

        <div className="mt-4">
          <Field as="textarea" className="min-h-32" label="Category URLs (optional, one per line)" name="categoryUrls" onChange={(event) => setCategoryUrls(event.target.value)} placeholder="Leave empty to use the source default category set." value={categoryUrls} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={handleDiscoverCategories} type="button" variant="ghost">
            {isDiscoveringCategories ? 'Loading Categories...' : 'Load Source Categories'}
          </Button>
          <Button onClick={handlePreviewImport} type="button" variant="secondary">
            {isPreviewing ? 'Loading Preview...' : 'Preview Import'}
          </Button>
          <Button onClick={handleSyncImport} type="button">
            {isSyncing ? 'Syncing Products...' : 'Sync To Inventory'}
          </Button>
        </div>

        {statusMessage ? <p className="mt-4 text-sm text-slate-500 dark:text-slate-300">{statusMessage}</p> : null}
        {discoveredCategoryCount > 0 ? <p className="mt-2 text-xs text-slate-400 dark:text-slate-400">Discovered category URLs loaded: {discoveredCategoryCount}</p> : null}

        {previewItems.length > 0 ? (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-white/10">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Product</th>
                  <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Brand</th>
                  <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Category</th>
                  <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {previewItems.slice(0, 12).map((item) => (
                  <tr key={item.slug}>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{item.name?.en}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{item.brand?.en || 'Market Source'}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{item.category?.en}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">SAR {Number(item.sellingPrice || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </GlassPanel>
      <InventoryDataTable businessType={businessType} onPrintLabel={setSelectedProduct} products={products} />
      <BarcodePrinterModal isOpen={Boolean(selectedProduct)} onClose={() => setSelectedProduct(null)} product={selectedProduct} />
    </div>
  );
}
