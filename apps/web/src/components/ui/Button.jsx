import { Link } from 'react-router-dom';
 import { useAdminTheme } from '../../utils/adminTheme.js';

function getVariantClasses(variant, isDark) {
  if (variant === 'secondary') {
    return isDark
      ? 'border border-white/15 bg-white/5 text-slate-100 hover:bg-white/10'
      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50';
  }

  if (variant === 'ghost') {
    return isDark
      ? 'border border-transparent bg-transparent text-slate-200 hover:bg-white/5'
      : 'border border-transparent bg-transparent text-slate-600 hover:bg-slate-100';
  }

  return isDark
    ? 'border border-indigo-400/40 bg-indigo-500 text-white shadow-glow hover:bg-indigo-400'
    : 'border border-indigo-500 bg-indigo-600 text-white shadow-[0_16px_40px_rgba(79,70,229,0.28)] hover:bg-indigo-500';
}

export default function Button({ children, className = '', to, type = 'button', variant = 'primary', ...props }) {
  const { isDark } = useAdminTheme();
  const sharedClassName = `inline-flex min-h-11 items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition duration-200 ${getVariantClasses(variant, isDark)} ${className}`.trim();

  if (to) {
    return (
      <Link className={sharedClassName} to={to} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={sharedClassName} type={type} {...props}>
      {children}
    </button>
  );
}
