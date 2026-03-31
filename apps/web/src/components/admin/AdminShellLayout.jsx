import { useMemo, useState } from 'react';
import { BUSINESS_TYPES, USER_ROLES } from '@vitalblaze/shared';
import {
  BarChart3,
  Boxes,
  ChevronLeft,
  Globe,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Moon,
  ShieldCheck,
  ShoppingCart,
  SunMedium,
  X,
} from 'lucide-react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AdminThemeProvider, useAdminTheme } from '../../utils/adminTheme.js';
import { useAdminSession } from '../../utils/adminSession.js';
import Button from '../ui/Button.jsx';
import LanguageToggle from '../ui/LanguageToggle.jsx';
import LogoMark from '../ui/LogoMark.jsx';

function AdminShellScaffold() {
  const { t } = useTranslation();
  const location = useLocation();
  const { session, clearSession } = useAdminSession();
  const { isDark, toggleTheme } = useAdminTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [businessType, setBusinessType] = useState(session?.user?.businessType || BUSINESS_TYPES.BAKALA);

  if (!session?.user) {
    return <Navigate replace to="/admin" />;
  }

  const navigationItems = useMemo(() => {
    const baseItems = [
      { icon: LayoutDashboard, label: t('adminShell.dashboard'), summary: t('adminShell.dashboardHint'), to: '/admin/panel' },
      { icon: Boxes, label: t('workspaceNav.inventory'), summary: t('inventory.eyebrow'), to: '/admin/panel/inventory' },
      { icon: ShoppingCart, label: t('workspaceNav.pos'), summary: t('pos.eyebrow'), to: '/admin/panel/pos' },
      { icon: BarChart3, label: t('workspaceNav.analytics'), summary: t('analytics.eyebrow'), to: '/admin/panel/analytics' },
      { icon: Megaphone, label: t('adminShell.content'), summary: t('adminContent.title'), to: '/admin/panel/content' },
    ];

    if (session.user.role === USER_ROLES.SUPER_ADMIN) {
      baseItems.push({ icon: ShieldCheck, label: t('adminShell.tenants'), summary: t('superAdmin.eyebrow'), to: '/admin/panel/tenants' });
    }

    return baseItems;
  }, [session.user.role, t]);

  const activeItem = navigationItems.find((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)) || navigationItems[0];
  const shellClassName = isDark
    ? 'min-h-screen bg-slate-950 text-slate-50'
    : 'min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_45%,#f8fafc_100%)] text-slate-900';
  const sidebarClassName = isDark
    ? 'border-white/10 bg-slate-950/90'
    : 'border-slate-200/80 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)]';
  const topbarClassName = isDark
    ? 'border-white/10 bg-slate-950/70'
    : 'border-slate-200/80 bg-white/80 shadow-[0_10px_30px_rgba(15,23,42,0.05)]';
  const drawerClassName = `${sidebarClassName} fixed inset-y-0 start-0 z-40 flex w-[290px] flex-col backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`;
  const tenantBrandName = session.user.storeName || session.user.name || session.user.email;
  const tenantBrandShortMark = tenantBrandName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => token[0])
    .join('')
    .toUpperCase();
  const tenantBrandTagline = session.user.role === USER_ROLES.SUPER_ADMIN ? t('superAdmin.eyebrow') : t(`businessTypes.${session.user.businessType || businessType}`);

  return (
    <div className={shellClassName}>
      <div className="flex min-h-screen">
        {isSidebarOpen ? <button className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setIsSidebarOpen(false)} type="button" /> : null}

        <aside className={drawerClassName}>
          <div className="flex items-center justify-between border-b border-inherit px-5 py-5">
            <Link to="/admin/panel">
              <LogoMark
                logoUrl={session.user.logoUrl}
                name={tenantBrandName}
                shortMark={tenantBrandShortMark || 'BE'}
                tagline={tenantBrandTagline}
              />
            </Link>
            <button className={isDark ? 'rounded-2xl p-2 text-slate-300 transition hover:bg-white/5 hover:text-white lg:hidden' : 'rounded-2xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden'} onClick={() => setIsSidebarOpen(false)} type="button">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-2 px-4 pb-4">
            {navigationItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  className={({ isActive }) => {
                    const baseClassName = 'group flex items-center gap-4 rounded-[1.5rem] border px-4 py-3 transition';
                    if (isActive) {
                      return isDark
                        ? `${baseClassName} border-indigo-400/30 bg-indigo-500/15 text-white shadow-glow`
                        : `${baseClassName} border-indigo-200 bg-indigo-50 text-slate-900 shadow-[0_14px_40px_rgba(99,102,241,0.12)]`;
                    }

                    return isDark
                      ? `${baseClassName} border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white`
                      : `${baseClassName} border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900`;
                  }}
                  key={item.to}
                  onClick={() => setIsSidebarOpen(false)}
                  to={item.to}
                >
                  <span className={isDark ? 'flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-indigo-200 transition group-hover:bg-white/10' : 'flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-indigo-600 transition group-hover:bg-indigo-50'}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1 text-start">
                    <span className="block text-sm font-semibold">{item.label}</span>
                    <span className={isDark ? 'mt-1 block truncate text-xs text-slate-400' : 'mt-1 block truncate text-xs text-slate-500'}>{item.summary}</span>
                  </span>
                  <ChevronLeft className={isDark ? 'h-4 w-4 shrink-0 text-slate-500' : 'h-4 w-4 shrink-0 text-slate-400'} />
                </NavLink>
              );
            })}
          </nav>

          <div className="border-t border-inherit px-4 py-4">
            <Button className="w-full justify-center" onClick={clearSession} variant="ghost">
              <LogOut className="me-2 h-4 w-4" />
              {t('common.logout')}
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className={`sticky top-0 z-20 border-b backdrop-blur-xl ${topbarClassName}`}>
            <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 lg:px-8">
              <div className="flex items-center gap-3">
                <button className={isDark ? 'rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10 lg:hidden' : 'rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 lg:hidden'} onClick={() => setIsSidebarOpen(true)} type="button">
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <p className={isDark ? 'text-xs uppercase tracking-[0.24em] text-indigo-200' : 'text-xs uppercase tracking-[0.24em] text-indigo-600'}>{t('adminShell.workspace')}</p>
                  <h1 className={isDark ? 'mt-1 text-xl font-semibold text-white' : 'mt-1 text-xl font-semibold text-slate-900'}>{activeItem.label}</h1>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button className={isDark ? 'inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/10' : 'inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'} onClick={toggleTheme} type="button">
                  {isDark ? <SunMedium className="me-2 h-4 w-4" /> : <Moon className="me-2 h-4 w-4" />}
                  {isDark ? t('adminShell.lightMode') : t('adminShell.darkMode')}
                </button>
                <LanguageToggle />
                <Button to="/" variant="secondary">
                  <Globe className="me-2 h-4 w-4" />
                  {t('adminPanel.openLanding')}
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
            <Outlet context={{ businessType, setBusinessType, session }} />
          </main>
        </div>
      </div>
    </div>
  );
}

export default function AdminShellLayout() {
  return (
    <AdminThemeProvider>
      <AdminShellScaffold />
    </AdminThemeProvider>
  );
}
