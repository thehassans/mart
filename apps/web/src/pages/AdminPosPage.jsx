import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import POSInterface from '../components/pos/POSInterface.jsx';
import BusinessTypeSelector from '../components/ui/BusinessTypeSelector.jsx';
import WorkspaceHero from '../components/ui/WorkspaceHero.jsx';
import { useCatalogProducts } from '../utils/catalog.js';

export default function AdminPosPage() {
  const { t } = useTranslation();
  const { businessType, setBusinessType, session } = useOutletContext();
  const { products } = useCatalogProducts({ businessType, session });

  return (
    <div className="space-y-8">
      <WorkspaceHero eyebrow={t('pos.eyebrow')} subtitle={t('pos.subtitle')} title={t('workspaceNav.pos')} />
      <BusinessTypeSelector businessType={businessType} onChange={setBusinessType} />
      <POSInterface businessType={businessType} products={products} />
    </div>
  );
}
