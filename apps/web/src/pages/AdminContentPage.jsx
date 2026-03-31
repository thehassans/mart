import { useTranslation } from 'react-i18next';
import MarketingContentEditor from '../components/admin/MarketingContentEditor.jsx';

export default function AdminContentPage() {
  const { t } = useTranslation();

  return <MarketingContentEditor panelLabel={t('adminPanel.contentManager')} />;
}
