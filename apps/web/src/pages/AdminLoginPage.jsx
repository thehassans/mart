import { useState } from 'react';
import { LockKeyhole, ShieldCheck, Sparkles, Store } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AdminThemeProvider, useAdminTheme } from '../utils/adminTheme.js';
import { getPanelPathForRole, useAdminSession } from '../utils/adminSession.js';
import Button from '../components/ui/Button.jsx';
import Field from '../components/ui/Field.jsx';
import GlassPanel from '../components/ui/GlassPanel.jsx';
import LanguageToggle from '../components/ui/LanguageToggle.jsx';
import LogoMark from '../components/ui/LogoMark.jsx';

function resolveApiBaseUrl() {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  if (window.location.port === '5173') {
    return 'http://localhost:5000';
  }

  return window.location.origin;
}

const initialFormState = {
  username: '',
  password: '',
};

function AdminLoginContent() {
  const { t } = useTranslation();
  const { isDark, toggleTheme } = useAdminTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { session, saveSession } = useAdminSession();
  const [formState, setFormState] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (session?.user) {
    return <Navigate replace to={getPanelPathForRole(session.user.role)} />;
  }

  function updateField(fieldKey, value) {
    setFormState((currentState) => ({
      ...currentState,
      [fieldKey]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${resolveApiBaseUrl()}/api/auth/demo-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formState),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || t('adminLogin.loginFailed'));
      }

      saveSession(payload);

      const targetPath = location.state?.from || getPanelPathForRole(payload.user.role);
      navigate(targetPath, { replace: true });
    } catch (error) {
      setErrorMessage(error.message || t('adminLogin.loginFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={isDark ? 'min-h-screen bg-slate-950 text-slate-50' : 'min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_42%,#f8fafc_100%)] text-slate-900'}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <LogoMark />
        <div className="flex items-center gap-3">
          <button className={isDark ? 'inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/10' : 'inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'} onClick={toggleTheme} type="button">
            {isDark ? t('adminShell.lightMode') : t('adminShell.darkMode')}
          </button>
          <LanguageToggle />
        </div>
      </div>

      <main className="mx-auto grid min-h-[calc(100vh-92px)] max-w-7xl gap-8 px-6 pb-10 pt-4 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-16 lg:pt-10">
        <div className="flex flex-col justify-center">
          <div className={isDark ? 'inline-flex w-fit rounded-full border border-indigo-400/20 bg-indigo-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-100' : 'inline-flex w-fit rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-700'}>
            {t('adminLogin.eyebrow')}
          </div>
          <h1 className={isDark ? 'mt-6 max-w-2xl text-balance text-5xl font-semibold tracking-tight text-white sm:text-6xl' : 'mt-6 max-w-2xl text-balance text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl'}>{t('adminLogin.title')}</h1>
          <p className={isDark ? 'mt-6 max-w-2xl text-lg leading-8 text-slate-300' : 'mt-6 max-w-2xl text-lg leading-8 text-slate-600'}>{t('adminLogin.subtitle')}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <GlassPanel className="p-5">
              <div className={isDark ? 'flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-100' : 'flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600'}>
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className={isDark ? 'mt-5 text-lg font-semibold text-white' : 'mt-5 text-lg font-semibold text-slate-900'}>{t('adminLogin.superAdminPanel')}</h2>
              <p className={isDark ? 'mt-2 text-sm leading-7 text-slate-300' : 'mt-2 text-sm leading-7 text-slate-600'}>{t('adminLogin.superAdminPanelHint')}</p>
            </GlassPanel>

            <GlassPanel className="p-5">
              <div className={isDark ? 'flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-200' : 'flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600'}>
                <Store className="h-5 w-5" />
              </div>
              <h2 className={isDark ? 'mt-5 text-lg font-semibold text-white' : 'mt-5 text-lg font-semibold text-slate-900'}>{t('adminLogin.adminPanel')}</h2>
              <p className={isDark ? 'mt-2 text-sm leading-7 text-slate-300' : 'mt-2 text-sm leading-7 text-slate-600'}>{t('adminLogin.adminPanelHint')}</p>
            </GlassPanel>
          </div>

          <GlassPanel className="mt-8 p-5">
            <div className="flex items-start gap-4">
              <div className={isDark ? 'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-indigo-200' : 'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600'}>
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className={isDark ? 'text-sm font-semibold text-white' : 'text-sm font-semibold text-slate-900'}>{t('adminLogin.demoCredentials')}</p>
                <p className={isDark ? 'mt-2 text-sm text-slate-300' : 'mt-2 text-sm text-slate-600'}>{t('adminLogin.demoCredentialsHint')}</p>
              </div>
            </div>
          </GlassPanel>
        </div>

        <div className="flex items-center justify-center">
          <GlassPanel className="w-full max-w-xl p-6 lg:p-8">
            <div className="flex items-center gap-3">
              <div className={isDark ? 'flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-100' : 'flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600'}>
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <p className={isDark ? 'text-xs uppercase tracking-[0.24em] text-indigo-200' : 'text-xs uppercase tracking-[0.24em] text-indigo-600'}>{t('adminLogin.submit')}</p>
                <h2 className={isDark ? 'mt-1 text-2xl font-semibold text-white' : 'mt-1 text-2xl font-semibold text-slate-900'}>{t('adminLogin.signInTitle')}</h2>
              </div>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <Field label={t('adminLogin.username')} name="username" onChange={(event) => updateField('username', event.target.value)} placeholder={t('adminLogin.usernamePlaceholder')} value={formState.username} />
              <Field label={t('adminLogin.password')} name="password" onChange={(event) => updateField('password', event.target.value)} placeholder={t('adminLogin.passwordPlaceholder')} type="password" value={formState.password} />

              {errorMessage ? <div className={isDark ? 'rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200' : 'rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'}>{errorMessage}</div> : null}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <p className={isDark ? 'text-sm text-slate-400' : 'text-sm text-slate-500'}>{t('adminLogin.accessHint')}</p>
                <Button disabled={isSubmitting} type="submit">
                  {isSubmitting ? t('adminLogin.loggingIn') : t('adminLogin.submit')}
                </Button>
              </div>
            </form>
          </GlassPanel>
        </div>
      </main>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <AdminThemeProvider>
      <AdminLoginContent />
    </AdminThemeProvider>
  );
}
