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
  authSelectClass,
} from '../../components/shared/authStyles';
import { REGISTRATION_LANGUAGES } from '../../constants/languages';
import { useI18n } from '../../providers/I18nProvider';

const HOME_BY_ROLE: Record<'manager' | 'specialist', string> = {
  manager: '/manager/dashboard',
  specialist: '/specialist/tasks',
};

const RegisterPage = () => {
  const { register } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preferred_language, setPreferredLanguage] = useState<string>('es');
  const [role, setRole] = useState<'manager' | 'specialist'>('specialist');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { user } = await register(name, email, password, role, preferred_language);
      navigate(HOME_BY_ROLE[user.role], { replace: true });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('auth.register.error');
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout headline={t('auth.register.headline')} tagline={t('auth.register.tagline')}>
      <section
        className={`${authCardClass} max-h-[min(100%,calc(100dvh-6rem))] overflow-y-auto lg:max-h-none`}
      >
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5571DE]">
            {t('auth.register.badge')}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.75rem]">
            {t('auth.register.title')}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">{t('auth.register.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={authLabelClass} htmlFor="name">
              {t('auth.register.name')}
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('auth.register.namePlaceholder')}
              className={authFieldClass}
            />
          </div>

          <div>
            <label className={authLabelClass} htmlFor="email">
              {t('auth.register.email')}
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
              {t('auth.register.password')}
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.register.passwordHint')}
              className={authFieldClass}
            />
          </div>

          <div>
            <label className={authLabelClass} htmlFor="preferred_language">
              {t('auth.register.language')}
            </label>
            <select
              id="preferred_language"
              required
              value={preferred_language}
              onChange={(e) => setPreferredLanguage(e.target.value)}
              className={authSelectClass}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              }}
            >
              {REGISTRATION_LANGUAGES.map(({ code, label }) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={authLabelClass} htmlFor="role">
              {t('auth.register.role')}
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'manager' | 'specialist')}
              className={authSelectClass}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              }}
            >
              <option value="specialist">{t('auth.register.roleSpecialist')}</option>
              <option value="manager">{t('auth.register.roleManager')}</option>
            </select>
          </div>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting} className={authPrimaryBtnClass}>
            {submitting ? t('auth.register.submitting') : t('auth.register.submit')}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          {t('auth.register.footer')}{' '}
          <Link to="/login" className={authLinkClass}>
            {t('auth.register.signIn')}
          </Link>
        </p>
      </section>
    </AuthLayout>
  );
};

export default RegisterPage;
