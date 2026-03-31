import { useAdminTheme } from '../../utils/adminTheme.js';

export default function StatusBadge({ children, tone = 'neutral' }) {
  const { isDark } = useAdminTheme();
  const toneMap = isDark
    ? {
        success: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
        warning: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
        danger: 'border-rose-400/20 bg-rose-400/10 text-rose-300',
        neutral: 'border-white/10 bg-white/5 text-slate-200',
      }
    : {
        success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        warning: 'border-amber-200 bg-amber-50 text-amber-700',
        danger: 'border-rose-200 bg-rose-50 text-rose-700',
        neutral: 'border-slate-200 bg-slate-100 text-slate-700',
      };

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${toneMap[tone]}`.trim()}>
      {children}
    </span>
  );
}
