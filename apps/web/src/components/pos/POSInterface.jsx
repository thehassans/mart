import { useEffect, useMemo, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAdminTheme } from '../../utils/adminTheme.js';
import Button from '../ui/Button.jsx';
import Field from '../ui/Field.jsx';
import GlassPanel from '../ui/GlassPanel.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';
import { buildCartLine, calculateCartTotals, resolveScannedProduct } from '../../utils/pos.js';
import { getHeldCarts, getOfflineSales, queueOfflineSale, removeHeldCart, saveHeldCart } from '../../utils/indexedDb.js';

function NotificationBanner({ message }) {
  const { isDark } = useAdminTheme();

  if (!message) {
    return null;
  }

  return <div className={isDark ? 'rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-300' : 'rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700'}>{message}</div>;
}

export default function POSInterface({ businessType, products }) {
  const { i18n, t } = useTranslation();
  const { isDark } = useAdminTheme();
  const language = i18n.resolvedLanguage === 'ar' ? 'ar' : 'en';
  const [cartItems, setCartItems] = useState([]);
  const [scannerInput, setScannerInput] = useState('');
  const [cashAmount, setCashAmount] = useState('0');
  const [madaAmount, setMadaAmount] = useState('0');
  const [heldCarts, setHeldCarts] = useState([]);
  const [offlineSales, setOfflineSales] = useState([]);
  const [message, setMessage] = useState('');
  const [isOnline, setIsOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);

  const totals = useMemo(() => calculateCartTotals(cartItems), [cartItems]);

  useEffect(() => {
    async function loadStoredData() {
      setHeldCarts(await getHeldCarts());
      setOfflineSales(await getOfflineSales());
    }

    loadStoredData();
  }, []);

  useEffect(() => {
    function handleOnlineStatus() {
      setIsOnline(navigator.onLine);
    }

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  function showMessage(nextMessage) {
    setMessage(nextMessage);
    window.clearTimeout(showMessage.timer);
    showMessage.timer = window.setTimeout(() => setMessage(''), 2400);
  }

  function addResolvedProduct(resolution) {
    if (!resolution) {
      return;
    }

    setCartItems((currentItems) => {
      const shouldMerge = !resolution.scalePayload;
      const existingIndex = shouldMerge ? currentItems.findIndex((item) => item.productId === resolution.product.id) : -1;

      if (existingIndex >= 0) {
        return currentItems.map((item, index) =>
          index === existingIndex ? { ...item, quantity: Number((item.quantity + resolution.quantity).toFixed(3)) } : item
        );
      }

      return [...currentItems, buildCartLine(resolution.product, resolution.quantity, { unitPrice: resolution.unitPrice, scalePayload: resolution.scalePayload })];
    });
  }

  function handleScanSubmit(event) {
    event.preventDefault();
    const resolution = resolveScannedProduct(scannerInput, products);

    if (!resolution) {
      showMessage(t('pos.noMatchingProduct'));
      return;
    }

    addResolvedProduct(resolution);
    setScannerInput('');

    if (resolution.scalePayload) {
      showMessage(t('pos.weightedScanResolved'));
    }
  }

  async function handleHoldCart() {
    if (cartItems.length === 0) {
      return;
    }

    const heldCart = {
      id: crypto.randomUUID(),
      items: cartItems,
      createdAt: new Date().toISOString(),
      totals,
    };

    await saveHeldCart(heldCart);
    setHeldCarts(await getHeldCarts());
    setCartItems([]);
    showMessage(t('pos.heldSaved'));
  }

  async function handleResumeCart(id) {
    const selectedCart = heldCarts.find((cart) => cart.id === id);

    if (!selectedCart) {
      return;
    }

    setCartItems(selectedCart.items);
    await removeHeldCart(id);
    setHeldCarts(await getHeldCarts());
    showMessage(t('pos.cartRestored'));
  }

  async function finalizeSale({ forceOffline = false } = {}) {
    if (cartItems.length === 0) {
      return;
    }

    const salePayload = {
      id: crypto.randomUUID(),
      items: cartItems,
      totals,
      payments: {
        cash: Number(cashAmount || 0),
        mada: Number(madaAmount || 0),
      },
      createdAt: new Date().toISOString(),
    };

    if (forceOffline || !isOnline) {
      await queueOfflineSale(salePayload);
      setOfflineSales(await getOfflineSales());
      showMessage(t('pos.offlineDetected'));
    }

    setCartItems([]);
    setCashAmount('0');
    setMadaAmount('0');
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_0.88fr]">
      <div className="space-y-6">
        <GlassPanel className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className={isDark ? 'text-xs uppercase tracking-[0.24em] text-indigo-200' : 'text-xs uppercase tracking-[0.24em] text-indigo-600'}>{t('pos.productGrid')}</p>
              <p className={isDark ? 'mt-2 text-sm text-slate-300' : 'mt-2 text-sm text-slate-600'}>{t('pos.scaleHint')}</p>
            </div>
            <StatusBadge tone={isOnline ? 'success' : 'warning'}>
              <span className="inline-flex items-center gap-2">
                {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                {isOnline ? t('pos.online') : t('pos.offline')}
              </span>
            </StatusBadge>
          </div>

          <form className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto]" onSubmit={handleScanSubmit}>
            <Field label={t('pos.addProduct')} name="scanner" onChange={(event) => setScannerInput(event.target.value)} placeholder={t('pos.scanPlaceholder')} value={scannerInput} />
            <Button className="self-end" type="submit">{t('pos.scanAction')}</Button>
          </form>
        </GlassPanel>

        <NotificationBanner message={message} />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <GlassPanel className="p-5" key={product.id}>
              <img alt={product.name[language] || product.name.en} className="h-36 w-full rounded-[1.5rem] object-cover" src={product.imageUrl} />
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className={isDark ? 'text-lg font-semibold text-white' : 'text-lg font-semibold text-slate-900'}>{product.name[language] || product.name.en}</h3>
                  <p className={isDark ? 'mt-2 text-sm text-slate-400' : 'mt-2 text-sm text-slate-500'}>{product.brand?.[language] || product.brand?.en || product.category[language] || product.category.en}</p>
                </div>
                {product.isWeighedItem ? <StatusBadge tone="warning">{t('pos.weighedUnit')}</StatusBadge> : null}
              </div>
              <p className={isDark ? 'mt-5 text-2xl font-semibold text-white' : 'mt-5 text-2xl font-semibold text-slate-900'}>SAR {product.sellingPrice.toFixed(2)}</p>
              <Button className="mt-5 w-full justify-center" onClick={() => addResolvedProduct({ product, quantity: 1, unitPrice: product.sellingPrice, scalePayload: null })} variant="secondary">
                {t('pos.addProduct')}
              </Button>
            </GlassPanel>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <GlassPanel className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={isDark ? 'text-xs uppercase tracking-[0.24em] text-indigo-200' : 'text-xs uppercase tracking-[0.24em] text-indigo-600'}>{t('pos.activeTicket')}</p>
              <h3 className={isDark ? 'mt-2 text-xl font-semibold text-white' : 'mt-2 text-xl font-semibold text-slate-900'}>{businessType}</h3>
            </div>
            <div className="flex gap-2">
              <StatusBadge tone="neutral">{t('pos.heldCount')}: {heldCarts.length}</StatusBadge>
              <StatusBadge tone="neutral">{t('pos.queueCount')}: {offlineSales.length}</StatusBadge>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {cartItems.length === 0 ? (
              <div className={isDark ? 'rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400' : 'rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500'}>{t('pos.emptyCart')}</div>
            ) : (
              cartItems.map((item) => (
                <div className={isDark ? 'flex items-center justify-between rounded-2xl bg-white/5 px-4 py-4' : 'flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4'} key={item.id}>
                  <div className="flex items-center gap-3 text-start">
                    {item.imageUrl ? <img alt={item.name[language] || item.name.en} className="h-12 w-12 rounded-2xl object-cover" src={item.imageUrl} /> : null}
                    <div>
                      <p className={isDark ? 'font-medium text-white' : 'font-medium text-slate-900'}>{item.name[language] || item.name.en}</p>
                      <p className={isDark ? 'mt-1 text-sm text-slate-400' : 'mt-1 text-sm text-slate-500'}>{t('pos.quantity')}: {item.quantity}</p>
                    </div>
                  </div>
                  <div className={isDark ? 'text-sm font-semibold text-white' : 'text-sm font-semibold text-slate-900'}>SAR {(item.quantity * item.unitPrice).toFixed(2)}</div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label={t('pos.cash')} name="cashAmount" onChange={(event) => setCashAmount(event.target.value)} type="number" value={cashAmount} />
            <Field label={t('pos.mada')} name="madaAmount" onChange={(event) => setMadaAmount(event.target.value)} type="number" value={madaAmount} />
          </div>

          <div className={isDark ? 'mt-6 space-y-3 rounded-[1.5rem] bg-slate-950/70 p-5' : 'mt-6 space-y-3 rounded-[1.5rem] bg-slate-100 p-5'}>
            <div className={isDark ? 'flex items-center justify-between text-sm text-slate-300' : 'flex items-center justify-between text-sm text-slate-600'}>
              <span>{t('pos.subtotal')}</span>
              <span>SAR {totals.subtotal.toFixed(2)}</span>
            </div>
            <div className={isDark ? 'flex items-center justify-between text-sm text-slate-300' : 'flex items-center justify-between text-sm text-slate-600'}>
              <span>{t('pos.vat')}</span>
              <span>SAR {totals.vat.toFixed(2)}</span>
            </div>
            <div className={isDark ? 'flex items-center justify-between text-base font-semibold text-white' : 'flex items-center justify-between text-base font-semibold text-slate-900'}>
              <span>{t('pos.total')}</span>
              <span>SAR {totals.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={handleHoldCart} type="button" variant="secondary">{t('pos.holdCart')}</Button>
            <Button onClick={() => finalizeSale({ forceOffline: true })} type="button" variant="secondary">{t('pos.queueOffline')}</Button>
            <Button onClick={() => finalizeSale()} type="button">{t('pos.completeSale')}</Button>
          </div>
        </GlassPanel>

        <GlassPanel className="p-6">
          <p className={isDark ? 'text-xs uppercase tracking-[0.24em] text-indigo-200' : 'text-xs uppercase tracking-[0.24em] text-indigo-600'}>{t('pos.resumeCart')}</p>
          <div className="mt-4 space-y-3">
            {heldCarts.length === 0 ? (
              <div className={isDark ? 'rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400' : 'rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500'}>{t('pos.heldCarts')}: 0</div>
            ) : (
              heldCarts.map((heldCart) => (
                <div className={isDark ? 'flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/5 px-4 py-4' : 'flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-4'} key={heldCart.id}>
                  <div>
                    <p className={isDark ? 'font-medium text-white' : 'font-medium text-slate-900'}>{heldCart.items.length} {t('pos.items')}</p>
                    <p className={isDark ? 'mt-1 text-sm text-slate-400' : 'mt-1 text-sm text-slate-500'}>{new Date(heldCart.createdAt).toLocaleString()}</p>
                  </div>
                  <Button onClick={() => handleResumeCart(heldCart.id)} variant="secondary">{t('pos.resumeCart')}</Button>
                </div>
              ))
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
