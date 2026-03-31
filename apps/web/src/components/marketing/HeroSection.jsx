import { ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { marketingHighlights } from '../../data/marketing.js';
import { resolveLocalizedValue, useSiteContent } from '../../utils/siteContent.js';
import Button from '../ui/Button.jsx';
import GlassPanel from '../ui/GlassPanel.jsx';

function FloatingDashboardMockup() {
  const { t } = useTranslation();

  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 rounded-[2rem] bg-indigo-500/20 blur-3xl" />
      <GlassPanel className="relative overflow-hidden rounded-[2rem] p-5 shadow-glow">
        <div className="hero-grid absolute inset-0 opacity-40" />
        <div className="relative flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/90">{t('hero.floatingTitle')}</p>
            <h3 className="mt-2 text-lg font-semibold text-white">{t('hero.controlCloud')}</h3>
          </div>
          <div className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            {t('hero.live')}
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-400">{t('hero.todayRevenue')}</p>
                <p className="mt-2 text-3xl font-semibold text-white">SAR 48.2K</p>
                <p className="mt-2 text-sm text-emerald-300">{t('hero.weekOverWeek')}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-400">{t('hero.activeRegisters')}</p>
                <p className="mt-2 text-3xl font-semibold text-white">12</p>
                <p className="mt-2 text-sm text-indigo-200">{t('hero.offlineReady')}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>{t('hero.inventoryRiskRadar')}</span>
                <span>{t('hero.lowStockSkus')}</span>
              </div>
              <div className="mt-4 h-40 rounded-2xl bg-gradient-to-b from-indigo-500/20 via-indigo-500/5 to-transparent p-4">
                <div className="flex h-full items-end gap-3">
                  {[36, 58, 40, 72, 61, 84, 76].map((height, index) => (
                    <div
                      className="flex-1 rounded-t-2xl bg-gradient-to-t from-indigo-500 to-emerald-400"
                      key={index}
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>{t('hero.zatcaStatus')}</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              </div>
              <div className="mt-4 space-y-3">
                {[t('hero.phase1Invoices'), t('hero.phase2QrPayloads'), t('hero.vatValidation')].map((item) => (
                  <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3" key={item}>
                    <span className="text-sm text-slate-200">{item}</span>
                    <span className="text-xs font-semibold text-emerald-300">{t('common.ready')}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">{t('hero.tenantMix')}</p>
              <div className="mt-4 flex items-end gap-3">
                <div className="flex-1 rounded-2xl bg-indigo-500/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-indigo-200">BAKALA</p>
                  <p className="mt-3 text-2xl font-semibold text-white">124</p>
                </div>
                <div className="flex-1 rounded-2xl bg-emerald-500/15 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">GROCERY</p>
                  <p className="mt-3 text-2xl font-semibold text-white">38</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}

export default function HeroSection() {
  const { t, i18n } = useTranslation();
  const { siteContent } = useSiteContent();
  const language = i18n.resolvedLanguage || 'en';

  return (
    <section className="relative overflow-hidden bg-hero-radial">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.08),transparent_25%)]" />
      <div className="mx-auto grid max-w-7xl gap-10 px-6 pb-16 pt-16 lg:grid-cols-[1fr_0.95fr] lg:px-8 lg:pb-24 lg:pt-24">
        <div className="relative flex flex-col justify-center">
          <div className="mb-6 inline-flex w-fit rounded-full border border-indigo-400/20 bg-indigo-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-indigo-100">
            {resolveLocalizedValue(siteContent.hero.badge, language)}
          </div>

          <h1 className="max-w-3xl text-balance text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
            <span className="text-gradient">{resolveLocalizedValue(siteContent.hero.title, language)}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">{resolveLocalizedValue(siteContent.hero.subtitle, language)}</p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button to="/admin">{t('common.adminLogin')}</Button>
            <Button to="/admin" variant="secondary">
              <span>{t('common.openPanel')}</span>
              <ArrowUpRight className="ms-2 h-4 w-4" />
            </Button>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">{t('hero.primaryStat')}</p>
              <div className="mt-4 h-2 rounded-full bg-white/10">
                <div className="h-2 w-[99%] rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400" />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">{t('hero.secondaryStat')}</p>
              <div className="mt-4 flex items-center gap-2 text-sm text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                {t('hero.saudiReady')}
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {marketingHighlights.map((highlight) => {
              const Icon = highlight.icon;

              return (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:-translate-y-1 hover:bg-white/10" key={highlight.labelKey}>
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white/10 p-3 text-indigo-100">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-start">
                      <p className="text-sm font-medium text-slate-200">{t(highlight.labelKey)}</p>
                      <p className="mt-1 text-sm text-slate-400">{t(highlight.valueKey)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <FloatingDashboardMockup />
        </div>
      </div>
    </section>
  );
}
