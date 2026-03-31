import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminTheme } from '../../utils/adminTheme.js';
import Button from '../ui/Button.jsx';
import Field from '../ui/Field.jsx';
import GlassPanel from '../ui/GlassPanel.jsx';
import SectionHeading from '../ui/SectionHeading.jsx';
import { buildSiteContentSnapshot, useSiteContent } from '../../utils/siteContent.js';

const pricingCycles = ['monthlyPlans', 'yearlyPlans'];
const planKeys = ['bakala', 'superstore'];

function cloneContent(content) {
  return buildSiteContentSnapshot(JSON.parse(JSON.stringify(content)));
}

function PlanEditor({ cycleKey, draft, language, onFeatureChange, onPlanFieldChange, t }) {
  const { isDark } = useAdminTheme();
  const cycleLabel = cycleKey === 'monthlyPlans' ? t('common.monthly') : t('common.yearly');

  return (
    <div className={isDark ? 'space-y-4 rounded-[1.75rem] border border-white/10 bg-white/5 p-5' : 'space-y-4 rounded-[1.75rem] border border-slate-200 bg-white p-5'}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={isDark ? 'text-xs uppercase tracking-[0.24em] text-indigo-200' : 'text-xs uppercase tracking-[0.24em] text-indigo-600'}>{t('adminContent.pricingCycle')}</p>
          <h3 className={isDark ? 'mt-2 text-lg font-semibold text-white' : 'mt-2 text-lg font-semibold text-slate-900'}>{cycleLabel}</h3>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {draft.pricing[cycleKey].map((plan) => (
          <div className={isDark ? 'rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-4' : 'rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4'} key={`${cycleKey}-${plan.key}`}>
            <p className={isDark ? 'text-xs uppercase tracking-[0.22em] text-slate-400' : 'text-xs uppercase tracking-[0.22em] text-slate-500'}>{plan.key}</p>
            <div className="mt-4 grid gap-4">
              <Field label={t('adminContent.planName')} name={`${cycleKey}-${plan.key}-name`} onChange={(event) => onPlanFieldChange(cycleKey, plan.key, 'name', language, event.target.value)} value={plan.name[language]} />
              <Field label={t('adminContent.planPrice')} name={`${cycleKey}-${plan.key}-price`} onChange={(event) => onPlanFieldChange(cycleKey, plan.key, 'price', null, event.target.value)} value={plan.price} />
              <Field as="textarea" className="min-h-28 resize-y" label={t('adminContent.planDescription')} name={`${cycleKey}-${plan.key}-description`} onChange={(event) => onPlanFieldChange(cycleKey, plan.key, 'description', language, event.target.value)} value={plan.description[language]} />
              <Field as="textarea" className="min-h-32 resize-y" label={t('adminContent.planFeatures')} name={`${cycleKey}-${plan.key}-features`} onChange={(event) => onFeatureChange(cycleKey, plan.key, language, event.target.value)} value={plan.features[language].join('\n')} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MarketingContentEditor({ panelLabel }) {
  const { t, i18n } = useTranslation();
  const { isDark } = useAdminTheme();
  const { siteContent, saveSiteContent, resetSiteContent } = useSiteContent();
  const [draft, setDraft] = useState(() => cloneContent(siteContent));
  const [language, setLanguage] = useState(i18n.resolvedLanguage || 'en');

  useEffect(() => {
    setDraft(cloneContent(siteContent));
  }, [siteContent]);

  const availableLanguages = useMemo(
    () => [
      { value: 'en', label: t('adminContent.english') },
      { value: 'ar', label: t('adminContent.arabic') },
    ],
    [t]
  );

  function updateLocalizedSection(sectionKey, fieldKey, nextValue) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [sectionKey]: {
        ...currentDraft[sectionKey],
        [fieldKey]: {
          ...currentDraft[sectionKey][fieldKey],
          [language]: nextValue,
        },
      },
    }));
  }

  function updateFooterField(fieldKey, nextValue) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      footer: {
        ...currentDraft.footer,
        [fieldKey]: nextValue,
      },
    }));
  }

  function updatePlanField(cycleKey, planKey, fieldKey, locale, nextValue) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      pricing: {
        ...currentDraft.pricing,
        [cycleKey]: currentDraft.pricing[cycleKey].map((plan) => {
          if (plan.key !== planKey) {
            return plan;
          }

          if (!locale) {
            return {
              ...plan,
              [fieldKey]: nextValue,
            };
          }

          return {
            ...plan,
            [fieldKey]: {
              ...plan[fieldKey],
              [locale]: nextValue,
            },
          };
        }),
      },
    }));
  }

  function updatePlanFeatures(cycleKey, planKey, locale, nextValue) {
    const featureList = nextValue
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);

    setDraft((currentDraft) => ({
      ...currentDraft,
      pricing: {
        ...currentDraft.pricing,
        [cycleKey]: currentDraft.pricing[cycleKey].map((plan) => {
          if (plan.key !== planKey) {
            return plan;
          }

          return {
            ...plan,
            features: {
              ...plan.features,
              [locale]: featureList,
            },
          };
        }),
      },
    }));
  }

  function handleSave() {
    saveSiteContent(draft);
  }

  function handleReset() {
    resetSiteContent();
  }

  return (
    <div className="space-y-6">
      <SectionHeading badge={panelLabel} description={t('adminContent.subtitle')} title={t('adminContent.title')} />

      <GlassPanel className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className={isDark ? 'text-xs uppercase tracking-[0.24em] text-indigo-200' : 'text-xs uppercase tracking-[0.24em] text-indigo-600'}>{t('adminContent.editLanguage')}</p>
            <p className={isDark ? 'mt-2 text-sm text-slate-300' : 'mt-2 text-sm text-slate-600'}>{t('adminContent.languageHint')}</p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            {availableLanguages.map((item) => (
              <Button key={item.value} onClick={() => setLanguage(item.value)} variant={language === item.value ? 'primary' : 'secondary'}>
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </GlassPanel>

      <GlassPanel className="p-6">
        <p className={isDark ? 'text-xs uppercase tracking-[0.24em] text-indigo-200' : 'text-xs uppercase tracking-[0.24em] text-indigo-600'}>{t('adminContent.brandSection')}</p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <Field label={t('adminContent.brandName')} name="brand-name" onChange={(event) => updateLocalizedSection('brand', 'name', event.target.value)} value={draft.brand.name[language]} />
          <Field label={t('adminContent.brandShortMark')} name="brand-short-mark" onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, brand: { ...currentDraft.brand, shortMark: event.target.value } }))} value={draft.brand.shortMark} />
          <Field as="textarea" className="min-h-28 resize-y lg:col-span-2" label={t('adminContent.brandTagline')} name="brand-tagline" onChange={(event) => updateLocalizedSection('brand', 'tagline', event.target.value)} value={draft.brand.tagline[language]} />
        </div>
      </GlassPanel>

      <GlassPanel className="p-6">
        <p className={isDark ? 'text-xs uppercase tracking-[0.24em] text-indigo-200' : 'text-xs uppercase tracking-[0.24em] text-indigo-600'}>{t('adminContent.heroSection')}</p>
        <div className="mt-5 grid gap-4">
          <Field label={t('adminContent.heroBadge')} name="hero-badge" onChange={(event) => updateLocalizedSection('hero', 'badge', event.target.value)} value={draft.hero.badge[language]} />
          <Field label={t('adminContent.heroTitle')} name="hero-title" onChange={(event) => updateLocalizedSection('hero', 'title', event.target.value)} value={draft.hero.title[language]} />
          <Field as="textarea" className="min-h-32 resize-y" label={t('adminContent.heroSubtitle')} name="hero-subtitle" onChange={(event) => updateLocalizedSection('hero', 'subtitle', event.target.value)} value={draft.hero.subtitle[language]} />
        </div>
      </GlassPanel>

      <GlassPanel className="p-6">
        <p className={isDark ? 'text-xs uppercase tracking-[0.24em] text-indigo-200' : 'text-xs uppercase tracking-[0.24em] text-indigo-600'}>{t('adminContent.pricingSection')}</p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <Field label={t('adminContent.pricingTitle')} name="pricing-title" onChange={(event) => updateLocalizedSection('pricing', 'title', event.target.value)} value={draft.pricing.title[language]} />
          <Field label={t('adminContent.pricingSaveBadge')} name="pricing-save-badge" onChange={(event) => updateLocalizedSection('pricing', 'saveBadge', event.target.value)} value={draft.pricing.saveBadge[language]} />
          <Field as="textarea" className="min-h-28 resize-y lg:col-span-2" label={t('adminContent.pricingSubtitle')} name="pricing-subtitle" onChange={(event) => updateLocalizedSection('pricing', 'subtitle', event.target.value)} value={draft.pricing.subtitle[language]} />
        </div>
      </GlassPanel>

      {pricingCycles.map((cycleKey) => (
        <PlanEditor
          cycleKey={cycleKey}
          draft={draft}
          key={cycleKey}
          language={language}
          onFeatureChange={updatePlanFeatures}
          onPlanFieldChange={updatePlanField}
          t={t}
        />
      ))}

      <GlassPanel className="p-6">
        <p className={isDark ? 'text-xs uppercase tracking-[0.24em] text-indigo-200' : 'text-xs uppercase tracking-[0.24em] text-indigo-600'}>{t('adminContent.footerSection')}</p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <Field label={t('adminContent.footerExploreTitle')} name="footer-explore-title" onChange={(event) => updateLocalizedSection('footer', 'exploreTitle', event.target.value)} value={draft.footer.exploreTitle[language]} />
          <Field label={t('adminContent.footerContactTitle')} name="footer-contact-title" onChange={(event) => updateLocalizedSection('footer', 'contactTitle', event.target.value)} value={draft.footer.contactTitle[language]} />
          <Field label={t('adminContent.footerEmail')} name="footer-email" onChange={(event) => updateFooterField('email', event.target.value)} type="email" value={draft.footer.email} />
          <Field label={t('adminContent.footerPhone')} name="footer-phone" onChange={(event) => updateFooterField('phone', event.target.value)} value={draft.footer.phone} />
          <Field label={t('adminContent.footerLocation')} name="footer-location" onChange={(event) => updateLocalizedSection('footer', 'location', event.target.value)} value={draft.footer.location[language]} />
          <Field as="textarea" className="min-h-28 resize-y lg:col-span-2" label={t('adminContent.footerDescription')} name="footer-description" onChange={(event) => updateLocalizedSection('footer', 'description', event.target.value)} value={draft.footer.description[language]} />
        </div>
      </GlassPanel>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button onClick={handleReset} variant="ghost">{t('adminContent.reset')}</Button>
        <Button onClick={handleSave}>{t('adminContent.save')}</Button>
      </div>
    </div>
  );
}
