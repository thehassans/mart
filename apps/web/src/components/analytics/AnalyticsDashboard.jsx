import { BUSINESS_TYPES } from '@vitalblaze/shared';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTranslation } from 'react-i18next';
import { analyticsKpis, analyticsSeries, departmentBreakdown } from '../../data/demo.js';
import { useAdminTheme } from '../../utils/adminTheme.js';
import GlassPanel from '../ui/GlassPanel.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';

function KpiCard({ growth, title, value }) {
  const { isDark } = useAdminTheme();

  return (
    <GlassPanel className="p-5">
      <p className={isDark ? 'text-sm text-slate-400' : 'text-sm text-slate-500'}>{title}</p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <p className={isDark ? 'text-3xl font-semibold text-white' : 'text-3xl font-semibold text-slate-900'}>{value}</p>
        <StatusBadge tone={growth.startsWith('-') ? 'warning' : 'success'}>{growth}</StatusBadge>
      </div>
    </GlassPanel>
  );
}

export default function AnalyticsDashboard({ businessType }) {
  const { t } = useTranslation();
  const { isDark } = useAdminTheme();

  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-3">
        <KpiCard growth={analyticsKpis.revenue.growth} title={t('analytics.revenue')} value={analyticsKpis.revenue.value} />
        <KpiCard growth={analyticsKpis.profit.growth} title={t('analytics.profit')} value={analyticsKpis.profit.value} />
        <KpiCard growth={analyticsKpis.netVatDue.growth} title={t('analytics.netVatDue')} value={analyticsKpis.netVatDue.value} />
      </div>

      <GlassPanel className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className={isDark ? 'text-xs uppercase tracking-[0.24em] text-indigo-200' : 'text-xs uppercase tracking-[0.24em] text-indigo-600'}>{t('analytics.dailyRevenueProfit')}</p>
            <p className={isDark ? 'mt-2 text-sm text-slate-300' : 'mt-2 text-sm text-slate-600'}>{businessType === BUSINESS_TYPES.BAKALA ? t('analytics.simplifiedView') : t('analytics.departmentalView')}</p>
          </div>
          <StatusBadge tone="neutral">{t('analytics.weekGrowth')}</StatusBadge>
        </div>

        <div className="mt-8 h-80">
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart data={analyticsSeries}>
              <defs>
                <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profitFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.24)'} vertical={false} />
              <XAxis dataKey="date" stroke={isDark ? '#94a3b8' : '#64748b'} />
              <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} />
              <Tooltip contentStyle={{ background: isDark ? '#0f172a' : '#ffffff', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(226,232,240,1)', borderRadius: '16px', color: isDark ? '#f8fafc' : '#0f172a' }} />
              <Area dataKey="revenue" fill="url(#revenueFill)" fillOpacity={1} stroke="#818cf8" strokeWidth={3} type="monotone" />
              <Area dataKey="profit" fill="url(#profitFill)" fillOpacity={1} stroke="#34d399" strokeWidth={3} type="monotone" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassPanel>

      {businessType === BUSINESS_TYPES.GROCERY_STORE ? (
        <GlassPanel className="p-6">
          <p className={isDark ? 'text-xs uppercase tracking-[0.24em] text-indigo-200' : 'text-xs uppercase tracking-[0.24em] text-indigo-600'}>{t('analytics.departmentBreakdown')}</p>
          <div className="mt-5 overflow-x-auto">
            <table className={isDark ? 'min-w-full divide-y divide-white/10' : 'min-w-full divide-y divide-slate-200'}>
              <thead>
                <tr>
                  <th className={isDark ? 'px-4 py-3 text-start text-xs font-semibold uppercase tracking-[0.18em] text-slate-400' : 'px-4 py-3 text-start text-xs font-semibold uppercase tracking-[0.18em] text-slate-500'}>{t('analytics.department')}</th>
                  <th className={isDark ? 'px-4 py-3 text-start text-xs font-semibold uppercase tracking-[0.18em] text-slate-400' : 'px-4 py-3 text-start text-xs font-semibold uppercase tracking-[0.18em] text-slate-500'}>{t('analytics.margin')}</th>
                  <th className={isDark ? 'px-4 py-3 text-start text-xs font-semibold uppercase tracking-[0.18em] text-slate-400' : 'px-4 py-3 text-start text-xs font-semibold uppercase tracking-[0.18em] text-slate-500'}>{t('analytics.contribution')}</th>
                </tr>
              </thead>
              <tbody className={isDark ? 'divide-y divide-white/5' : 'divide-y divide-slate-100'}>
                {departmentBreakdown.map((row) => (
                  <tr key={row.department}>
                    <td className={isDark ? 'px-4 py-4 text-sm text-white' : 'px-4 py-4 text-sm text-slate-900'}>{row.department}</td>
                    <td className={isDark ? 'px-4 py-4 text-sm text-slate-300' : 'px-4 py-4 text-sm text-slate-600'}>{row.margin}</td>
                    <td className={isDark ? 'px-4 py-4 text-sm text-slate-300' : 'px-4 py-4 text-sm text-slate-600'}>{row.contribution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassPanel>
      ) : null}
    </div>
  );
}
