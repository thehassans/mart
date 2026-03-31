import SiteHeader from '../components/layout/SiteHeader.jsx';
import MarketingContentEditor from '../components/admin/MarketingContentEditor.jsx';
import SuperAdminDashboard from '../components/dashboard/SuperAdminDashboard.jsx';
import MarketingFooter from '../components/marketing/MarketingFooter.jsx';
import { useTranslation } from 'react-i18next';

export default function SuperAdminPage() {
  const { t } = useTranslation();

  return (
    <div>
      <SiteHeader />
      <main className="space-y-8">
        <SuperAdminDashboard />
        <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-8 lg:pb-20">
          <MarketingContentEditor panelLabel={t('superAdmin.contentManager')} />
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
