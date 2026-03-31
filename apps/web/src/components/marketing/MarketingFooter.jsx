import { Mail, MapPin, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { resolveLocalizedValue, useSiteContent } from '../../utils/siteContent.js';
import LogoMark from '../ui/LogoMark.jsx';

export default function MarketingFooter() {
  const { t, i18n } = useTranslation();
  const { siteContent } = useSiteContent();
  const language = i18n.resolvedLanguage || 'en';

  return (
    <footer className="border-t border-white/10 bg-slate-950/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div>
          <LogoMark />
          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300">{resolveLocalizedValue(siteContent.footer.description, language)}</p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-200">{resolveLocalizedValue(siteContent.footer.exploreTitle, language)}</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <a className="block transition hover:text-white" href="#features">
                {t('features.title')}
              </a>
              <a className="block transition hover:text-white" href="#pricing">
                {resolveLocalizedValue(siteContent.pricing.title, language)}
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-200">{resolveLocalizedValue(siteContent.footer.contactTitle, language)}</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-indigo-200" />
                <span>{resolveLocalizedValue(siteContent.footer.location, language)}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-indigo-200" />
                <span>{siteContent.footer.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-indigo-200" />
                <span>{siteContent.footer.phone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
