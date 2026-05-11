/** Shared form surfaces — login / register (dark blue backdrop + white card). */

/** Inputs — soft inner surface, clear focus ring (Tailwind-only). */
export const authFieldClass =
  [
    'w-full rounded-xl border-2 border-slate-200/90 bg-slate-50 px-4 py-3.5 text-[15px] leading-snug text-slate-900',
    'shadow-inner shadow-slate-900/[0.04] transition duration-150',
    'placeholder:text-slate-400 placeholder:font-normal',
    'hover:border-slate-300 hover:bg-white',
    'focus:border-[#5571DE] focus:bg-white focus:shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] focus:outline-none focus:ring-4 focus:ring-[#5571DE]/15',
  ].join(' ');

export const authSelectClass = `${authFieldClass} cursor-pointer appearance-none bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-11`;

export const authLabelClass = 'mb-2 block text-sm font-semibold tracking-tight text-slate-800';

/** White card floating on dark blue */
export const authCardClass =
  [
    'rounded-3xl border border-white/70 bg-white p-8',
    'shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45),0_12px_24px_-16px_rgba(15,23,42,0.25)]',
    'ring-1 ring-white/80 sm:p-10',
  ].join(' ');

export const authPrimaryBtnClass =
  [
    'flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-semibold text-white',
    'bg-gradient-to-r from-[#2563eb] to-[#5571DE] shadow-lg shadow-blue-950/30',
    'transition hover:brightness-110 active:translate-y-px active:brightness-95',
    'disabled:cursor-not-allowed disabled:bg-slate-300 disabled:bg-none disabled:shadow-none disabled:brightness-100',
  ].join(' ');

export const authLinkClass =
  'font-semibold text-[#4466d6] underline-offset-2 transition hover:text-[#322C74] hover:underline';
