import { ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../providers/I18nProvider';
import { BrandLogo } from '../shared/BrandLogo';

const NavIcon = {
  dashboard: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  ),
  messages: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  ),
};

const managerNavLinkClass = ({ isActive }: { isActive: boolean }): string =>
  [
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
    isActive ? 'bg-geartalk-accent text-white shadow-sm' : 'text-slate-300 hover:bg-white/5 hover:text-white',
  ].join(' ');

interface ManagerLayoutProps {
  children: ReactNode;
}

const SidebarNav = ({
  onNavigate,
  t,
}: {
  onNavigate?: () => void;
  t: (key: string) => string;
}) => (
  <nav className="flex flex-col gap-1">
    <NavLink to="/manager/dashboard" className={managerNavLinkClass} end onClick={onNavigate}>
      {NavIcon.dashboard}
      {t('nav.dashboard')}
    </NavLink>
    <NavLink to="/manager/messages" className={managerNavLinkClass} onClick={onNavigate}>
      {NavIcon.messages}
      {t('nav.messages')}
    </NavLink>
  </nav>
);

export const ManagerLayout = ({ children }: ManagerLayoutProps) => {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const closeMobile = () => setMenuOpen(false);

  return (
    <div className="flex min-h-screen bg-geartalk-canvas">
      <aside className="relative hidden w-64 shrink-0 flex-col bg-geartalk-sidebar px-4 py-8 md:flex">
        <BrandLogo className="mb-12 px-2" />
        <SidebarNav t={t} />
        <div className="mt-auto border-t border-white/10 pt-6">
          <p className="truncate px-3 text-xs font-medium text-slate-400">
            {user?.name ?? t('layout.managerFallback')}
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 w-full rounded-xl border border-white/10 px-3 py-2 text-left text-sm font-medium text-slate-200 transition hover:bg-white/5"
          >
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur md:hidden">
        <button
          type="button"
          className="rounded-lg p-2 text-geartalk-sidebar hover:bg-slate-100"
          aria-label={t('nav.openMenu')}
          onClick={() => setMenuOpen(true)}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <BrandLogo variant="dark" className="scale-90" />
        <span className="w-10" aria-hidden />
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label={t('nav.closeMenu')}
            onClick={closeMobile}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-geartalk-sidebar px-4 py-8 shadow-xl">
            <div className="mb-8 flex items-center justify-between px-2">
              <BrandLogo />
              <button
                type="button"
                className="rounded-lg p-2 text-slate-300 hover:bg-white/10"
                aria-label={t('nav.close')}
                onClick={closeMobile}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SidebarNav onNavigate={closeMobile} t={t} />
            <div className="mt-auto border-t border-white/10 pt-6">
              <p className="truncate px-3 text-xs font-medium text-slate-400">
                {user?.name ?? t('layout.managerFallback')}
              </p>
              <button
                type="button"
                onClick={() => {
                  closeMobile();
                  handleLogout();
                }}
                className="mt-3 w-full rounded-xl border border-white/10 px-3 py-2 text-left text-sm font-medium text-slate-200 transition hover:bg-white/5"
              >
                {t('nav.logout')}
              </button>
            </div>
          </aside>
        </div>
      )}

      <main className="flex min-h-0 flex-1 flex-col pt-14 md:pt-0">{children}</main>
    </div>
  );
};
