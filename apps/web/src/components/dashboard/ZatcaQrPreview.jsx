import { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { generateZatcaQR } from '@vitalblaze/shared';
import { useTranslation } from 'react-i18next';
import { useAdminTheme } from '../../utils/adminTheme.js';
import GlassPanel from '../ui/GlassPanel.jsx';

export default function ZatcaQrPreview({ sellerName, vatNumber }) {
  const { t } = useTranslation();
  const { isDark } = useAdminTheme();

  const qrValue = useMemo(() => {
    if (!sellerName || !/^\d{15}$/.test(String(vatNumber || '').trim())) {
      return '';
    }

    return generateZatcaQR(sellerName, vatNumber, new Date().toISOString(), 287.5, 37.5);
  }, [sellerName, vatNumber]);

  return (
    <GlassPanel className="p-6">
      <p className={isDark ? 'text-xs uppercase tracking-[0.24em] text-indigo-200' : 'text-xs uppercase tracking-[0.24em] text-indigo-600'}>{t('superAdmin.sampleQr')}</p>
      <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex h-40 w-40 items-center justify-center rounded-[1.5rem] bg-white p-4">
          {qrValue ? <QRCodeSVG bgColor="#ffffff" fgColor="#0f172a" size={128} value={qrValue} /> : <div className="text-center text-sm text-slate-500">{t('form.vatNumber')}</div>}
        </div>

        <div className="flex-1">
          <h3 className={isDark ? 'text-lg font-semibold text-white' : 'text-lg font-semibold text-slate-900'}>{sellerName || t('superAdmin.defaultSellerName')}</h3>
          <p className={isDark ? 'mt-2 text-sm leading-7 text-slate-300' : 'mt-2 text-sm leading-7 text-slate-600'}>{t('superAdmin.qrHint')}</p>
          <div className={isDark ? 'mt-4 rounded-2xl bg-slate-950/70 p-4 text-xs leading-6 text-slate-400' : 'mt-4 rounded-2xl bg-slate-100 p-4 text-xs leading-6 text-slate-500'}>
            <span className={isDark ? 'block text-slate-200' : 'block text-slate-700'}>{qrValue ? `${qrValue.slice(0, 72)}...` : t('superAdmin.awaitingQrInput')}</span>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
