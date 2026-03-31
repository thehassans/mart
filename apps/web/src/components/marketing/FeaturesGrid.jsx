import { useTranslation } from 'react-i18next';
import { featureCards } from '../../data/marketing.js';
import SectionHeading from '../ui/SectionHeading.jsx';

export default function FeaturesGrid() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
      <SectionHeading
        align="center"
        badge="Retail Cloud"
        description={t('features.subtitle')}
        title={t('features.title')}
      />

      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {featureCards.map((feature) => {
          const Icon = feature.icon;

          return (
            <article
              className="group rounded-[1.75rem] border border-white/10 bg-white/5 p-6 transition duration-200 hover:-translate-y-2 hover:border-indigo-400/30 hover:bg-white/10 hover:shadow-glow"
              key={feature.key}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-100 transition group-hover:scale-105 group-hover:bg-indigo-500/25">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-white">{t(feature.titleKey)}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{t(feature.descriptionKey)}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
