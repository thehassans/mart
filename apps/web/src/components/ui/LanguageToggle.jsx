import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from './Button.jsx';

export default function LanguageToggle() {
  const { i18n, t } = useTranslation();

  function handleToggleLanguage() {
    i18n.changeLanguage(i18n.resolvedLanguage === 'ar' ? 'en' : 'ar');
  }

  return (
    <Button className="gap-2" onClick={handleToggleLanguage} variant="secondary">
      <Languages className="h-4 w-4" />
      {t('common.language')}
    </Button>
  );
}
