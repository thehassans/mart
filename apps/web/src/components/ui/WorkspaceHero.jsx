import { useAdminTheme } from '../../utils/adminTheme.js';

export default function WorkspaceHero({ eyebrow, title, subtitle, action }) {
  const { isDark } = useAdminTheme();

  return (
    <div className={isDark ? 'rounded-[2rem] border border-white/10 bg-gradient-to-br from-indigo-500/15 via-slate-900/80 to-emerald-500/10 p-8 shadow-glow' : 'rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-indigo-50/80 to-emerald-50/70 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)]'}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className={isDark ? 'inline-flex rounded-full border border-indigo-400/20 bg-indigo-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-100' : 'inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-700'}>
            {eyebrow}
          </div>
          <h1 className={isDark ? 'mt-5 text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl' : 'mt-5 text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl'}>{title}</h1>
          <p className={isDark ? 'mt-5 text-lg leading-8 text-slate-300' : 'mt-5 text-lg leading-8 text-slate-600'}>{subtitle}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
