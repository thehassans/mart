import { useState } from 'react';
import { BUSINESS_TYPES } from '@vitalblaze/shared';
import { useTranslation } from 'react-i18next';
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard.jsx';
import SiteHeader from '../components/layout/SiteHeader.jsx';
import MarketingFooter from '../components/marketing/MarketingFooter.jsx';
import BusinessTypeSelector from '../components/ui/BusinessTypeSelector.jsx';
import WorkspaceHero from '../components/ui/WorkspaceHero.jsx';

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES.GROCERY_STORE);

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-7xl space-y-8 px-6 py-16 lg:px-8 lg:py-20">
        <WorkspaceHero eyebrow={t('analytics.eyebrow')} subtitle={t('analytics.subtitle')} title={t('analytics.title')} />
        <BusinessTypeSelector businessType={businessType} onChange={setBusinessType} />
        <AnalyticsDashboard businessType={businessType} />
      </main>
      <MarketingFooter />
    </div>
  );
}
