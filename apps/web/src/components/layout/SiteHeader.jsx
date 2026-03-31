import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LogoMark from '../ui/LogoMark.jsx';
import LanguageToggle from '../ui/LanguageToggle.jsx';
import Button from '../ui/Button.jsx';
import { getPanelPathForRole, useAdminSession } from '../../utils/adminSession.js';

export default function SiteHeader() {
  const { t } = useTranslation();
  const location = useLocation();
  const { session, clearSession } = useAdminSession();
  const panelPath = session?.user ? getPanelPathForRole(session.user.role) : '/admin';

  const navigation = [
    { key: 'home', label: t('nav.home'), to: '/' },
    { key: 'inventory', label: t('workspaceNav.inventory'), to: '/inventory' },
    { key: 'pos', label: t('workspaceNav.pos'), to: '/pos' },
    { key: 'analytics', label: t('workspaceNav.analytics'), to: '/analytics' },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
        <Link className="shrink-0" to="/">
          <LogoMark />
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navigation.map((item) => {
            const isActive = location.pathname === item.to;

            return (
              <Link
                className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`.trim()}
                key={item.key}
                to={item.to}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageToggle />
          <Button className="hidden sm:inline-flex" to={panelPath} variant="secondary">
            {session?.user ? t('common.openPanel') : t('common.adminLogin')}
          </Button>
          {session?.user ? (
            <Button className="hidden sm:inline-flex" onClick={clearSession} variant="ghost">
              {t('common.logout')}
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
