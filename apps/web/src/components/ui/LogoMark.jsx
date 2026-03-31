import { useTranslation } from 'react-i18next';
import { useAdminTheme } from '../../utils/adminTheme.js';
import { resolveLocalizedValue, useSiteContent } from '../../utils/siteContent.js';

export default function LogoMark({ logoUrl = '', name, shortMark, tagline }) {
  const { i18n } = useTranslation();
  const { isDark } = useAdminTheme();
  const { siteContent } = useSiteContent();
  const language = i18n.resolvedLanguage || 'en';
  const resolvedName = resolveLocalizedValue(name ?? siteContent.brand.name, language);
  const resolvedTagline = resolveLocalizedValue(tagline ?? siteContent.brand.tagline, language);
  const resolvedShortMark = String(shortMark || siteContent.brand.shortMark || resolvedName || 'BE').slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      {logoUrl ? (
        <img alt={resolvedName || 'Brand logo'} className="h-10 w-10 rounded-2xl object-cover shadow-glow" src={logoUrl} />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 via-indigo-500 to-emerald-400 shadow-glow">
          <span className="text-sm font-black tracking-[0.2em] text-white">{resolvedShortMark}</span>
        </div>
      )}
      <div className="text-start">
        <div className={isDark ? 'text-sm font-semibold uppercase tracking-[0.3em] text-indigo-100' : 'text-sm font-semibold uppercase tracking-[0.3em] text-indigo-700'}>{resolvedName}</div>
        <div className={isDark ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>{resolvedTagline}</div>
      </div>
    </div>
  );
}
