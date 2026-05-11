interface BrandLogoProps {
  variant?: 'dark' | 'light';
  className?: string;
  /** Larger mark on auth / marketing surfaces */
  size?: 'md' | 'lg';
}

export const BrandLogo = ({ variant = 'light', className = '', size = 'md' }: BrandLogoProps) => {
  const textClass = variant === 'light' ? 'text-white' : 'text-geartalk-sidebar';
  const textSize = size === 'lg' ? 'text-xl sm:text-2xl' : 'text-lg';
  const imgSize = size === 'lg' ? 'h-11 w-11 sm:h-12 sm:w-12' : 'h-10 w-10';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/GearTalk_logo.svg"
        alt=""
        width={48}
        height={48}
        className={`${imgSize} shrink-0 object-contain`}
        decoding="async"
      />
      <span className={`font-semibold tracking-tight ${textSize} ${textClass}`}>GearTalk</span>
    </div>
  );
};
