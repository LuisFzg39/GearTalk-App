import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AuthLayout } from '../../components/shared/AuthLayout';
import {
  authCardClass,
  authFieldClass,
  authLabelClass,
  authLinkClass,
  authPrimaryBtnClass,
} from '../../components/shared/authStyles';
import { useI18n } from '../../providers/I18nProvider';

const HOME_BY_ROLE: Record<'manager' | 'specialist', string> = {
  manager: '/manager/dashboard',
  specialist: '/specialist/tasks',
};

const LoginPage = () => {
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { user } = await login(email, password);
      navigate(HOME_BY_ROLE[user.role], { replace: true });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('auth.login.error');
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout headline={t('auth.login.headline')} tagline={t('auth.login.tagline')}>
      <section className={authCardClass}>
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5571DE]">
            {t('auth.login.welcome')}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.75rem]">
            {t('auth.login.title')}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">{t('auth.login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={authLabelClass} htmlFor="email">
              {t('auth.login.email')}
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className={authFieldClass}
            />
          </div>

          <div>
            <label className={authLabelClass} htmlFor="password">
              {t('auth.login.password')}
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={authFieldClass}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting} className={authPrimaryBtnClass}>
            {submitting ? t('auth.login.submitting') : t('auth.login.submit')}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          {t('auth.login.footer')}{' '}
          <Link to="/register" className={authLinkClass}>
            {t('auth.login.createAccount')}
          </Link>
        </p>
      </section>
    </AuthLayout>
  );
};

export default LoginPage;
