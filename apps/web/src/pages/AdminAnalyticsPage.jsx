import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard.jsx';
import BusinessTypeSelector from '../components/ui/BusinessTypeSelector.jsx';
import WorkspaceHero from '../components/ui/WorkspaceHero.jsx';

export default function AdminAnalyticsPage() {
  const { t } = useTranslation();
  const { businessType, setBusinessType } = useOutletContext();

  return (
    <div className="space-y-8">
      <WorkspaceHero eyebrow={t('analytics.eyebrow')} subtitle={t('analytics.subtitle')} title={t('workspaceNav.analytics')} />
      <BusinessTypeSelector businessType={businessType} onChange={setBusinessType} />
      <AnalyticsDashboard businessType={businessType} />
    </div>
  );
}
