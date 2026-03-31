import { BUSINESS_TYPE_CAPABILITIES } from '@vitalblaze/shared';
import { useTranslation } from 'react-i18next';
import { useAdminTheme } from '../../utils/adminTheme.js';
import GlassPanel from '../ui/GlassPanel.jsx';

function CapabilityList({ items, tone, title }) {
  const { isDark } = useAdminTheme();
  const toneClassName = tone === 'enabled' ? (isDark ? 'text-emerald-300' : 'text-emerald-700') : (isDark ? 'text-amber-300' : 'text-amber-700');
  const dotClassName = tone === 'enabled' ? 'bg-emerald-400' : 'bg-amber-400';

  return (
    <div>
      <h4 className={`text-sm font-semibold ${toneClassName}`}>{title}</h4>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div className={isDark ? 'flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3' : 'flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3'} key={item}>
            <span className={`h-2.5 w-2.5 rounded-full ${dotClassName}`} />
            <span className={isDark ? 'text-sm text-slate-200' : 'text-sm text-slate-700'}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CapabilityMatrix({ businessType }) {
  const { t } = useTranslation();
  const { isDark } = useAdminTheme();
  const capabilityProfile = BUSINESS_TYPE_CAPABILITIES[businessType];

  if (!capabilityProfile) {
    return null;
  }

  return (
    <GlassPanel className="p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className={isDark ? 'text-xs uppercase tracking-[0.24em] text-indigo-200' : 'text-xs uppercase tracking-[0.24em] text-indigo-600'}>{t('superAdmin.featureMatrix')}</p>
          <h3 className={isDark ? 'mt-2 text-xl font-semibold text-white' : 'mt-2 text-xl font-semibold text-slate-900'}>{t(`businessTypes.${businessType}`)}</h3>
        </div>
        <div className={isDark ? 'rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200' : 'rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700'}>
          {businessType}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <CapabilityList
          items={capabilityProfile.enabled.map((capability) => t(`capabilityLabels.${capability}`))}
          title={t('superAdmin.enabledFeatures')}
          tone="enabled"
        />
        <CapabilityList
          items={capabilityProfile.limited.map((capability) => t(`capabilityLabels.${capability}`))}
          title={t('superAdmin.limitedFeatures')}
          tone="limited"
        />
      </div>
    </GlassPanel>
  );
}
