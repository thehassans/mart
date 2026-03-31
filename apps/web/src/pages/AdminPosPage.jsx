import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import POSInterface from '../components/pos/POSInterface.jsx';
import BusinessTypeSelector from '../components/ui/BusinessTypeSelector.jsx';
import WorkspaceHero from '../components/ui/WorkspaceHero.jsx';
import { demoProducts } from '../data/demo.js';

export default function AdminPosPage() {
  const { t } = useTranslation();
  const { businessType, setBusinessType } = useOutletContext();

  const products = useMemo(
    () => demoProducts.filter((product) => product.businessTypes.includes(businessType)),
    [businessType]
  );

  return (
    <div className="space-y-8">
      <WorkspaceHero eyebrow={t('pos.eyebrow')} subtitle={t('pos.subtitle')} title={t('workspaceNav.pos')} />
      <BusinessTypeSelector businessType={businessType} onChange={setBusinessType} />
      <POSInterface businessType={businessType} products={products} />
    </div>
  );
}
