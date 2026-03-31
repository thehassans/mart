import { Activity, ArrowRight, BarChart3, Boxes, Megaphone, ShoppingCart } from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard.jsx';
import BusinessTypeSelector from '../components/ui/BusinessTypeSelector.jsx';
import Button from '../components/ui/Button.jsx';
import GlassPanel from '../components/ui/GlassPanel.jsx';
import WorkspaceHero from '../components/ui/WorkspaceHero.jsx';
import { useAdminTheme } from '../utils/adminTheme.js';

export default function AdminPanelPage() {
  const { t } = useTranslation();
  const { isDark } = useAdminTheme();
  const { businessType, setBusinessType, session } = useOutletContext();

  const overviewCards = [
    { icon: Activity, label: t('adminShell.liveOperations'), value: '24/7', tone: isDark ? 'text-emerald-300' : 'text-emerald-600' },
    { icon: Boxes, label: t('workspaceNav.inventory'), value: '126', tone: isDark ? 'text-indigo-200' : 'text-indigo-600' },
    { icon: ShoppingCart, label: t('workspaceNav.pos'), value: '12', tone: isDark ? 'text-amber-300' : 'text-amber-600' },
    { icon: BarChart3, label: t('workspaceNav.analytics'), value: 'SAR 48.2K', tone: isDark ? 'text-sky-300' : 'text-sky-600' },
  ];

  const quickLinks = [
    { icon: Boxes, label: t('workspaceNav.inventory'), to: '/admin/panel/inventory' },
    { icon: ShoppingCart, label: t('workspaceNav.pos'), to: '/admin/panel/pos' },
    { icon: BarChart3, label: t('workspaceNav.analytics'), to: '/admin/panel/analytics' },
    { icon: Megaphone, label: t('adminShell.content'), to: '/admin/panel/content' },
  ];

  return (
    <div className="space-y-8">
      <WorkspaceHero
        action={<Button to="/admin/panel/content">{t('adminPanel.contentManager')}</Button>}
        eyebrow={t('adminPanel.eyebrow')}
        subtitle={t('adminShell.welcomeSubtitle')}
        title={session?.user?.storeName || session?.user?.name || session?.user?.email}
      />

      <div className="grid gap-4 xl:grid-cols-4">
        {overviewCards.map((card) => {
          const Icon = card.icon;

          return (
            <GlassPanel className="p-5" key={card.label}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className={isDark ? 'text-sm text-slate-400' : 'text-sm text-slate-500'}>{card.label}</p>
                  <p className={isDark ? 'mt-3 text-3xl font-semibold text-white' : 'mt-3 text-3xl font-semibold text-slate-900'}>{card.value}</p>
                </div>
                <div className={isDark ? `flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 ${card.tone}` : `flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 ${card.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </GlassPanel>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <GlassPanel className="p-6">
          <p className={isDark ? 'text-xs uppercase tracking-[0.24em] text-indigo-200' : 'text-xs uppercase tracking-[0.24em] text-indigo-600'}>{t('adminPanel.quickAccess')}</p>
          <p className={isDark ? 'mt-3 text-sm text-slate-300' : 'mt-3 text-sm text-slate-600'}>{t('adminPanel.quickAccessHint')}</p>
          <div className="mt-6 grid gap-3">
            {quickLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link className={isDark ? 'flex items-center justify-between rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 text-slate-100 transition hover:bg-white/10' : 'flex items-center justify-between rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-slate-800 transition hover:bg-slate-50'} key={item.to} to={item.to}>
                  <span className="inline-flex items-center gap-3">
                    <span className={isDark ? 'flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-indigo-200' : 'flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600'}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-semibold">{item.label}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              );
            })}
          </div>
        </GlassPanel>

        <GlassPanel className="p-6">
          <p className={isDark ? 'text-xs uppercase tracking-[0.24em] text-indigo-200' : 'text-xs uppercase tracking-[0.24em] text-indigo-600'}>{t('adminPanel.preview')}</p>
          <h2 className={isDark ? 'mt-3 text-2xl font-semibold text-white' : 'mt-3 text-2xl font-semibold text-slate-900'}>{t('adminShell.previewTitle')}</h2>
          <p className={isDark ? 'mt-3 text-sm text-slate-300' : 'mt-3 text-sm text-slate-600'}>{t('adminPanel.previewHint')}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button to="/">{t('adminPanel.openLanding')}</Button>
            <Button to="/admin/panel/analytics" variant="secondary">{t('workspaceNav.analytics')}</Button>
          </div>
        </GlassPanel>
      </div>

      <BusinessTypeSelector businessType={businessType} onChange={setBusinessType} />
      <AnalyticsDashboard businessType={businessType} />
    </div>
  );
}
