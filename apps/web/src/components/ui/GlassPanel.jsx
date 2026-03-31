import { useAdminTheme } from '../../utils/adminTheme.js';

export default function GlassPanel({ children, className = '' }) {
  const { isDark } = useAdminTheme();
  const panelClassName = isDark
    ? 'glass-panel surface-ring'
    : 'rounded-2xl border border-slate-200/80 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl';

  return <div className={`${panelClassName} ${className}`.trim()}>{children}</div>;
}
