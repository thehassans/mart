import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BUSINESS_TYPES, TENANT_SUBSCRIPTION_PLANS } from '@vitalblaze/shared';
import { useAdminTheme } from '../../utils/adminTheme.js';
import CapabilityMatrix from './CapabilityMatrix.jsx';
import CreateTenantForm from './CreateTenantForm.jsx';
import ZatcaQrPreview from './ZatcaQrPreview.jsx';
import GlassPanel from '../ui/GlassPanel.jsx';

const initialBlueprint = {
  storeName: 'Buysial ERP Express',
  vatNumber: '300123456700003',
  businessType: BUSINESS_TYPES.BAKALA,
  subscriptionPlan: TENANT_SUBSCRIPTION_PLANS.TRIAL_7_DAYS,
  logoUrl: '',
  generatedAt: '',
};

export default function SuperAdminDashboard() {
  const { t } = useTranslation();
  const { isDark } = useAdminTheme();
  const [blueprint, setBlueprint] = useState(initialBlueprint);

  return (
    <section className="space-y-8">
      <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="max-w-3xl">
            <div className={isDark ? 'mb-4 inline-flex rounded-full border border-indigo-400/20 bg-indigo-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-100' : 'mb-4 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-700'}>
              {t('superAdmin.eyebrow')}
            </div>
            <h1 className={isDark ? 'text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl' : 'text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl'}>{t('superAdmin.title')}</h1>
            <p className={isDark ? 'mt-5 text-lg leading-8 text-slate-300' : 'mt-5 text-lg leading-8 text-slate-600'}>{t('superAdmin.subtitle')}</p>
          </div>

          <div className="mt-8">
            <CreateTenantForm onTenantCreated={setBlueprint} />
          </div>
        </div>

        <div className="space-y-6">
          <GlassPanel className="p-6">
            <p className={isDark ? 'text-xs uppercase tracking-[0.24em] text-indigo-200' : 'text-xs uppercase tracking-[0.24em] text-indigo-600'}>{t('superAdmin.generated')}</p>
            <h2 className={isDark ? 'mt-3 text-2xl font-semibold text-white' : 'mt-3 text-2xl font-semibold text-slate-900'}>{blueprint.storeName}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {blueprint.logoUrl ? (
                <div className={isDark ? 'rounded-2xl bg-white/5 p-4 sm:col-span-2' : 'rounded-2xl bg-slate-50 p-4 sm:col-span-2'}>
                  <img alt={blueprint.storeName || 'Tenant logo'} className="h-20 w-20 rounded-2xl object-cover" src={blueprint.logoUrl} />
                </div>
              ) : null}
              <div className={isDark ? 'rounded-2xl bg-white/5 p-4' : 'rounded-2xl bg-slate-50 p-4'}>
                <span className={isDark ? 'text-sm text-slate-400' : 'text-sm text-slate-500'}>{t('form.businessType')}</span>
                <span className={isDark ? 'mt-2 block text-sm font-semibold text-white' : 'mt-2 block text-sm font-semibold text-slate-900'}>{t(`businessTypes.${blueprint.businessType}`)}</span>
              </div>
              <div className={isDark ? 'rounded-2xl bg-white/5 p-4' : 'rounded-2xl bg-slate-50 p-4'}>
                <span className={isDark ? 'text-sm text-slate-400' : 'text-sm text-slate-500'}>{t('form.vatNumber')}</span>
                <span className={isDark ? 'mt-2 block text-sm font-semibold text-white' : 'mt-2 block text-sm font-semibold text-slate-900'}>{blueprint.vatNumber}</span>
              </div>
              <div className={isDark ? 'rounded-2xl bg-white/5 p-4' : 'rounded-2xl bg-slate-50 p-4'}>
                <span className={isDark ? 'text-sm text-slate-400' : 'text-sm text-slate-500'}>{t('form.subscriptionPlan')}</span>
                <span className={isDark ? 'mt-2 block text-sm font-semibold text-white' : 'mt-2 block text-sm font-semibold text-slate-900'}>{t(`subscriptionPlans.${blueprint.subscriptionPlan}`)}</span>
              </div>
            </div>
          </GlassPanel>

          <CapabilityMatrix businessType={blueprint.businessType} />
          <ZatcaQrPreview sellerName={blueprint.storeName} vatNumber={blueprint.vatNumber} />
        </div>
      </div>
    </section>
  );
}
