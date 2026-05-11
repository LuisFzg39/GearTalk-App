import { ReactNode } from 'react';
import { BrandLogo } from './BrandLogo';

interface AuthLayoutProps {
  children: ReactNode;
  /** Short headline on the dark panel (dashboard-style). */
  headline: string;
  /** Supporting line under the headline. */
  tagline: string;
}

export const AuthLayout = ({ children, headline, tagline }: AuthLayoutProps) => {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Brand panel */}
      <aside className="relative flex min-h-[220px] shrink-0 flex-col justify-between overflow-hidden bg-geartalk-sidebar px-8 py-10 sm:min-h-[260px] sm:px-10 sm:py-12 lg:min-h-screen lg:w-[min(46%,520px)] lg:max-w-xl lg:px-12 lg:py-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          aria-hidden
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
        <div
          className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-[#5571DE]/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 right-[-20%] h-[420px] w-[420px] rounded-full bg-[#322C74]/35 blur-3xl"
          aria-hidden
        />

        <div className="relative z-10">
          <BrandLogo size="lg" />
          <h2 className="mt-8 max-w-lg text-2xl font-semibold leading-snug tracking-tight text-white sm:text-[1.65rem] lg:text-3xl">
            {headline}
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400 sm:text-[15px] lg:text-base">
            {tagline}
          </p>
        </div>

        <p className="relative z-10 mt-10 text-xs text-slate-500 lg:mt-0">
          © {new Date().getFullYear()} GearTalk
        </p>
      </aside>

      {/* Form panel — deep blue background + white card (children) */}
      <div className="relative flex flex-1 flex-col justify-center overflow-hidden bg-gradient-to-b from-geartalk-auth via-[#0a1424] to-geartalk-authDeep px-4 py-12 sm:px-8 lg:min-h-screen lg:py-16">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(85,113,222,0.22),transparent_55%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-[120%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(50,44,116,0.35),transparent_70%)] blur-2xl"
          aria-hidden
        />

        <div className="relative z-10 mx-auto w-full max-w-[440px]">{children}</div>
      </div>
    </div>
  );
};
