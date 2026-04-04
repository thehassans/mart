import { useMemo, useState } from 'react';
import { PRODUCT_UNITS } from '@vitalblaze/shared';
import { ExternalLink, RefreshCw, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAdminTheme } from '../../utils/adminTheme.js';
import { apiRequest } from '../../utils/api.js';
import Button from '../ui/Button.jsx';
import Field from '../ui/Field.jsx';
import GlassPanel from '../ui/GlassPanel.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';

const UNIT_OPTIONS = Object.values(PRODUCT_UNITS);

function trimString(value) {
  return String(value || '').trim();
}

function toInputDate(value) {
  const normalized = trimString(value);
  return normalized ? normalized.slice(0, 10) : '';
}

function buildInitialFormState() {
  return {
    barcode: '',
    nameEn: '',
    nameAr: '',
    brandEn: '',
    brandAr: '',
    categoryEn: '',
    categoryAr: '',
    imageUrl: '',
    costPrice: '',
    sellingPrice: '',
    vatRate: '15',
    exciseTaxRate: '0',
    taxCategory: 'STANDARD',
    unit: PRODUCT_UNITS.EACH,
    stockQuantity: '0',
    reorderLevel: '0',
    packedDate: '',
    expiryDate: '',
    requiresExpiryTracking: false,
    countryOfOrigin: '',
    storageTemperature: '',
  };
}

function buildFormStateFromLookup(lookupResult) {
  const draft = lookupResult?.lookup?.draft;
  const existingProduct = lookupResult?.existingProduct;
  const sourceProduct = existingProduct || draft;

  return {
    barcode: trimString(sourceProduct?.barcode),
    nameEn: trimString(sourceProduct?.name?.en),
    nameAr: trimString(sourceProduct?.name?.ar),
    brandEn: trimString(sourceProduct?.brand?.en),
    brandAr: trimString(sourceProduct?.brand?.ar),
    categoryEn: trimString(sourceProduct?.category?.en),
    categoryAr: trimString(sourceProduct?.category?.ar),
    imageUrl: trimString(sourceProduct?.imageUrl),
    costPrice: existingProduct ? String(existingProduct.costPrice ?? '') : '',
    sellingPrice: String(sourceProduct?.sellingPrice ?? draft?.referencePrice ?? ''),
    vatRate: String(sourceProduct?.vatRate ?? 15),
    exciseTaxRate: String(sourceProduct?.exciseTaxRate ?? 0),
    taxCategory: trimString(sourceProduct?.taxCategory || 'STANDARD') || 'STANDARD',
    unit: sourceProduct?.unit || PRODUCT_UNITS.EACH,
    stockQuantity: String(existingProduct?.stockQuantity ?? 0),
    reorderLevel: String(sourceProduct?.reorderLevel ?? 0),
    packedDate: toInputDate(sourceProduct?.packedDate),
    expiryDate: toInputDate(sourceProduct?.expiryDate),
    requiresExpiryTracking: Boolean(sourceProduct?.requiresExpiryTracking),
    countryOfOrigin: trimString(sourceProduct?.countryOfOrigin),
    storageTemperature: trimString(sourceProduct?.storageTemperature),
  };
}

export default function InventoryCatalogImportPanel({ session, onProductCreated }) {
  const { t } = useTranslation();
  const { isDark } = useAdminTheme();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [formState, setFormState] = useState(() => buildInitialFormState());
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const lookup = lookupResult?.lookup || null;
  const existingProduct = lookupResult?.existingProduct || null;
  const hasCatalogMatch = Boolean(lookup?.found);
  const canSave = Boolean(trimString(formState.nameEn) && trimString(formState.nameAr) && trimString(formState.costPrice) && trimString(formState.sellingPrice) && trimString(formState.categoryEn) && trimString(formState.categoryAr) && trimString(formState.barcode) && !existingProduct);
  const sourceBadges = useMemo(() => lookup?.availableSources || [], [lookup]);

  function updateField(key, value) {
    setFormState((currentState) => ({
      ...currentState,
      [key]: value,
    }));
  }

  async function handleLookup(event) {
    event.preventDefault();
    const normalizedBarcode = trimString(barcodeInput);

    if (!normalizedBarcode) {
      setErrorMessage(t('inventory.lookupFirst'));
      return;
    }

    if (!session?.token || !session?.user?.tenantId) {
      setErrorMessage(t('inventory.loadFailed'));
      return;
    }

    setIsLookingUp(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload = await apiRequest(`/api/products/catalog/lookup/${encodeURIComponent(normalizedBarcode)}`, {
        token: session.token,
        query: {
          tenantId: session.user.tenantId,
        },
      });

      setLookupResult(payload);
      setFormState(buildFormStateFromLookup(payload));
    } catch (error) {
      setLookupResult(null);
      setFormState((currentState) => ({
        ...buildInitialFormState(),
        barcode: normalizedBarcode,
      }));
      setErrorMessage(error.message || t('inventory.loadFailed'));
    } finally {
      setIsLookingUp(false);
    }
  }

  async function handleSave(event) {
    event.preventDefault();

    if (!session?.token || !session?.user?.tenantId) {
      setErrorMessage(t('inventory.createFailed'));
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload = await apiRequest('/api/products', {
        method: 'POST',
        token: session.token,
        body: {
          tenantId: session.user.tenantId,
          barcode: trimString(formState.barcode),
          enrichFromCatalog: true,
          name: {
            en: trimString(formState.nameEn),
            ar: trimString(formState.nameAr),
          },
          brand: trimString(formState.brandEn) || trimString(formState.brandAr)
            ? {
                en: trimString(formState.brandEn),
                ar: trimString(formState.brandAr),
              }
            : null,
          category: {
            en: trimString(formState.categoryEn),
            ar: trimString(formState.categoryAr),
          },
          imageUrl: trimString(formState.imageUrl),
          costPrice: Number(formState.costPrice),
          sellingPrice: Number(formState.sellingPrice),
          vatRate: Number(formState.vatRate || 15),
          exciseTaxRate: Number(formState.exciseTaxRate || 0),
          taxCategory: trimString(formState.taxCategory) || 'STANDARD',
          unit: formState.unit,
          stockQuantity: Number(formState.stockQuantity || 0),
          reorderLevel: Number(formState.reorderLevel || 0),
          packedDate: formState.packedDate || null,
          expiryDate: formState.expiryDate || null,
          requiresExpiryTracking: Boolean(formState.requiresExpiryTracking),
          countryOfOrigin: trimString(formState.countryOfOrigin),
          storageTemperature: trimString(formState.storageTemperature),
        },
      });

      setLookupResult((currentState) => ({
        ...(currentState || {}),
        existingProduct: payload.product,
        lookup: currentState?.lookup || null,
      }));
      setFormState(buildFormStateFromLookup({
        lookup: lookupResult?.lookup || null,
        existingProduct: payload.product,
      }));
      setSuccessMessage(payload.message || t('inventory.createSuccess'));
      onProductCreated?.(payload.product);
    } catch (error) {
      setErrorMessage(error.message || t('inventory.createFailed'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <GlassPanel className="p-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className={isDark ? 'text-2xl font-semibold text-white' : 'text-2xl font-semibold text-slate-900'}>{t('inventory.liveCatalogTitle')}</h3>
            <p className={isDark ? 'mt-2 text-sm text-slate-300' : 'mt-2 text-sm text-slate-600'}>{t('inventory.liveCatalogSubtitle')}</p>
          </div>
          {lookup ? (
            <div className="flex flex-wrap gap-2">
              {sourceBadges.map((source) => (
                <StatusBadge key={source} tone="neutral">{source}</StatusBadge>
              ))}
              <StatusBadge tone={hasCatalogMatch ? 'success' : 'warning'}>{hasCatalogMatch ? t('inventory.productFound') : t('inventory.productNotFound')}</StatusBadge>
            </div>
          ) : null}
        </div>

        <form className="grid gap-4 lg:grid-cols-[1fr_auto]" onSubmit={handleLookup}>
          <Field
            label={t('inventory.barcodeLookupLabel')}
            name="barcodeLookup"
            onChange={(event) => setBarcodeInput(event.target.value)}
            placeholder={t('inventory.barcodeLookupPlaceholder')}
            value={barcodeInput}
          />
          <div className="flex items-end gap-3">
            <Button className="w-full lg:w-auto" disabled={isLookingUp} type="submit">
              {isLookingUp ? <RefreshCw className="me-2 h-4 w-4 animate-spin" /> : <Search className="me-2 h-4 w-4" />}
              {isLookingUp ? t('inventory.lookingUp') : t('inventory.lookupAction')}
            </Button>
          </div>
        </form>

        {errorMessage ? <div className={isDark ? 'rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200' : 'rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'}>{errorMessage}</div> : null}
        {successMessage ? <div className={isDark ? 'rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200' : 'rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700'}>{successMessage}</div> : null}
        {existingProduct ? <div className={isDark ? 'rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200' : 'rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700'}>{t('inventory.existingProduct')}</div> : null}

        <form className="grid gap-6" onSubmit={handleSave}>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t('inventory.nameEnglish')} name="nameEn" onChange={(event) => updateField('nameEn', event.target.value)} value={formState.nameEn} />
              <Field label={t('inventory.nameArabic')} name="nameAr" onChange={(event) => updateField('nameAr', event.target.value)} value={formState.nameAr} />
              <Field label={t('inventory.brandEnglish')} name="brandEn" onChange={(event) => updateField('brandEn', event.target.value)} value={formState.brandEn} />
              <Field label={t('inventory.brandArabic')} name="brandAr" onChange={(event) => updateField('brandAr', event.target.value)} value={formState.brandAr} />
              <Field label={t('inventory.categoryEnglish')} name="categoryEn" onChange={(event) => updateField('categoryEn', event.target.value)} value={formState.categoryEn} />
              <Field label={t('inventory.categoryArabic')} name="categoryAr" onChange={(event) => updateField('categoryAr', event.target.value)} value={formState.categoryAr} />
              <Field label={t('inventory.barcode')} name="barcode" onChange={(event) => updateField('barcode', event.target.value)} value={formState.barcode} />
              <Field label={t('inventory.price')} min="0" name="sellingPrice" onChange={(event) => updateField('sellingPrice', event.target.value)} step="0.01" type="number" value={formState.sellingPrice} />
              <Field label={t('inventory.costPrice')} min="0" name="costPrice" onChange={(event) => updateField('costPrice', event.target.value)} step="0.01" type="number" value={formState.costPrice} />
              <Field label={t('inventory.stock')} min="0" name="stockQuantity" onChange={(event) => updateField('stockQuantity', event.target.value)} step="0.001" type="number" value={formState.stockQuantity} />
              <Field label={t('inventory.reorderLevel')} min="0" name="reorderLevel" onChange={(event) => updateField('reorderLevel', event.target.value)} step="0.001" type="number" value={formState.reorderLevel} />
              <Field label={t('inventory.sourceLabel')} name="taxCategory" onChange={(event) => updateField('taxCategory', event.target.value)} value={lookup?.draft?.catalogSource || 'manual'} disabled />
              <Field label={t('inventory.vatRateLabel')} min="0" name="vatRate" onChange={(event) => updateField('vatRate', event.target.value)} step="0.01" type="number" value={formState.vatRate} />
              <Field label={t('inventory.exciseTaxRateLabel')} min="0" name="exciseTaxRate" onChange={(event) => updateField('exciseTaxRate', event.target.value)} step="0.01" type="number" value={formState.exciseTaxRate} />
              <Field as="select" label={t('inventory.unitLabel')} name="unit" onChange={(event) => updateField('unit', event.target.value)} value={formState.unit}>
                {UNIT_OPTIONS.map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </Field>
              <Field label={t('inventory.originLabel')} name="countryOfOrigin" onChange={(event) => updateField('countryOfOrigin', event.target.value)} value={formState.countryOfOrigin} />
              <Field label={t('inventory.storageLabel')} name="storageTemperature" onChange={(event) => updateField('storageTemperature', event.target.value)} value={formState.storageTemperature} />
              <Field label={t('inventory.packedDateLabel')} name="packedDate" onChange={(event) => updateField('packedDate', event.target.value)} type="date" value={formState.packedDate} />
              <Field label={t('inventory.expiryDate')} name="expiryDate" onChange={(event) => updateField('expiryDate', event.target.value)} type="date" value={formState.expiryDate} />
              <Field className="md:col-span-2" label={t('inventory.imageUrlLabel')} name="imageUrl" onChange={(event) => updateField('imageUrl', event.target.value)} value={formState.imageUrl} />
            </div>

            <div className="space-y-4">
              <GlassPanel className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className={isDark ? 'text-sm font-semibold text-white' : 'text-sm font-semibold text-slate-900'}>{t('inventory.inventoryMethod')}</p>
                  <StatusBadge tone={formState.requiresExpiryTracking ? 'warning' : 'neutral'}>{lookup?.draft?.inventoryMethod || (formState.requiresExpiryTracking ? 'FEFO' : 'FIFO')}</StatusBadge>
                </div>
                <label className="mt-4 flex items-center gap-3 text-sm">
                  <input checked={formState.requiresExpiryTracking} onChange={(event) => updateField('requiresExpiryTracking', event.target.checked)} type="checkbox" />
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{t('inventory.expiryTrackingEnabled')}</span>
                </label>
                {lookup?.draft?.referencePrice ? (
                  <p className={isDark ? 'mt-4 text-sm text-slate-300' : 'mt-4 text-sm text-slate-600'}>{t('inventory.referencePrice')}: SAR {Number(lookup.draft.referencePrice).toFixed(2)}</p>
                ) : null}
                {lookup?.draft?.requiresTaxReview ? <p className={isDark ? 'mt-3 text-sm text-amber-200' : 'mt-3 text-sm text-amber-700'}>{t('inventory.requiresTaxReview')}</p> : null}
              </GlassPanel>

              {formState.imageUrl ? (
                <img alt={formState.nameEn || formState.barcode} className="h-56 w-full rounded-[1.5rem] object-cover" src={formState.imageUrl} />
              ) : (
                <div className={isDark ? 'flex h-56 items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 bg-slate-900/70 text-sm text-slate-400' : 'flex h-56 items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500'}>
                  {t('inventory.lookupFirst')}
                </div>
              )}

              {lookup?.notes?.length ? (
                <GlassPanel className="p-4">
                  <p className={isDark ? 'text-sm font-semibold text-white' : 'text-sm font-semibold text-slate-900'}>{t('inventory.lookupNotes')}</p>
                  <ul className={isDark ? 'mt-3 space-y-2 text-sm text-slate-300' : 'mt-3 space-y-2 text-sm text-slate-600'}>
                    {lookup.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </GlassPanel>
              ) : null}

              {lookup?.searchUrls ? (
                <GlassPanel className="p-4">
                  <div className="space-y-3">
                    {Object.entries(lookup.searchUrls).map(([source, url]) => (
                      <a className={isDark ? 'flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10' : 'flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50'} href={url} key={source} rel="noreferrer" target="_blank">
                        <span>{source}</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ))}
                  </div>
                </GlassPanel>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <Button disabled={!canSave || isSaving} type="submit">
              {isSaving ? t('inventory.creatingProduct') : t('inventory.importProduct')}
            </Button>
          </div>
        </form>
      </div>
    </GlassPanel>
  );
}
