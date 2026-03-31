import { useAdminTheme } from '../../utils/adminTheme.js';

export default function SectionHeading({ badge, title, description, align = 'start' }) {
  const { isDark } = useAdminTheme();
  const alignmentClassName = align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl text-start';

  return (
    <div className={alignmentClassName}>
      {badge ? (
        <div className={isDark ? 'mb-4 inline-flex rounded-full border border-indigo-400/20 bg-indigo-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-100' : 'mb-4 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-700'}>
          {badge}
        </div>
      ) : null}
      <h2 className={isDark ? 'text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl' : 'text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl'}>{title}</h2>
      <p className={isDark ? 'mt-4 text-base leading-7 text-slate-300 sm:text-lg' : 'mt-4 text-base leading-7 text-slate-600 sm:text-lg'}>{description}</p>
    </div>
  );
}
