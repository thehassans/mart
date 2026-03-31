import { useMemo, useState } from 'react';
import { BUSINESS_TYPES } from '@vitalblaze/shared';
import { useTranslation } from 'react-i18next';
import SiteHeader from '../components/layout/SiteHeader.jsx';
import MarketingFooter from '../components/marketing/MarketingFooter.jsx';
import POSInterface from '../components/pos/POSInterface.jsx';
import BusinessTypeSelector from '../components/ui/BusinessTypeSelector.jsx';
import WorkspaceHero from '../components/ui/WorkspaceHero.jsx';
import { demoProducts } from '../data/demo.js';

export default function PosPage() {
  const { t } = useTranslation();
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES.GROCERY_STORE);

  const products = useMemo(
    () => demoProducts.filter((product) => product.businessTypes.includes(businessType)),
    [businessType]
  );

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-7xl space-y-8 px-6 py-16 lg:px-8 lg:py-20">
        <WorkspaceHero eyebrow={t('pos.eyebrow')} subtitle={t('pos.subtitle')} title={t('pos.title')} />
        <BusinessTypeSelector businessType={businessType} onChange={setBusinessType} />
        <POSInterface businessType={businessType} products={products} />
      </main>
      <MarketingFooter />
    </div>
  );
}
