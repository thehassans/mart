import Barcode from 'react-barcode';
import { useTranslation } from 'react-i18next';
import { useAdminTheme } from '../../utils/adminTheme.js';
import Button from '../ui/Button.jsx';
import GlassPanel from '../ui/GlassPanel.jsx';

export default function BarcodePrinterModal({ isOpen, onClose, product }) {
  const { i18n, t } = useTranslation();
  const { isDark } = useAdminTheme();
  const language = i18n.resolvedLanguage === 'ar' ? 'ar' : 'en';

  if (!isOpen || !product) {
    return null;
  }

  const productName = product.name[language] || product.name.en;
  const labelType = product.isWeighedItem ? t('printer.weightedSticker') : t('printer.shelfLabel');
  const categoryName = product.category?.[language] || product.category?.en || '-';
  const packedDate = product.packedDate ? String(product.packedDate).slice(0, 10) : '-';
  const expiryDate = product.expiryDate ? String(product.expiryDate).slice(0, 10) : '-';

  return (
    <div className={isDark ? 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-6 backdrop-blur-xl' : 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-xl'}>
      <GlassPanel className="w-full max-w-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className={isDark ? 'text-xs uppercase tracking-[0.24em] text-indigo-200' : 'text-xs uppercase tracking-[0.24em] text-indigo-600'}>{labelType}</p>
            <h3 className={isDark ? 'mt-2 text-2xl font-semibold text-white' : 'mt-2 text-2xl font-semibold text-slate-900'}>{t('printer.title')}</h3>
          </div>
          <div className="flex gap-3">
            <Button onClick={onClose} variant="ghost">{t('printer.close')}</Button>
            <Button onClick={() => window.print()}>{t('printer.print')}</Button>
          </div>
        </div>

        <div className="mt-6 rounded-[1.75rem] border border-dashed border-white/15 bg-white p-8 text-slate-950">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">BUYSIAL ERP</p>
              <h4 className="mt-3 text-2xl font-semibold text-slate-950">{productName}</h4>
              <p className="mt-2 text-sm text-slate-500">{product.sku}</p>
            </div>
            <div className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
              SAR {product.sellingPrice.toFixed(2)}
            </div>
          </div>

          {product.imageUrl ? <img alt={productName} className="mt-6 h-40 w-full rounded-[1.5rem] object-cover" src={product.imageUrl} /> : null}

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('inventory.category')}</p>
              <p className="mt-2 text-sm font-medium text-slate-900">{categoryName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{product.isWeighedItem ? t('printer.pricePerKg') : t('inventory.price')}</p>
              <p className="mt-2 text-sm font-medium text-slate-900">SAR {product.sellingPrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('printer.packedDate')}</p>
              <p className="mt-2 text-sm font-medium text-slate-900">{packedDate}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('inventory.expiryDate')}</p>
              <p className="mt-2 text-sm font-medium text-slate-900">{expiryDate}</p>
            </div>
          </div>

          <div className="mt-8 flex justify-center rounded-[1.5rem] border border-slate-200 p-6">
            <Barcode background="#ffffff" displayValue fontSize={14} value={product.barcode} width={1.6} />
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
