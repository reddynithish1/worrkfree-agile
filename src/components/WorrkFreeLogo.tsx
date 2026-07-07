import React, { useId } from 'react';

interface WorrkFreeLogoProps {
  className?: string;
}

export default function WorrkFreeLogo({ className = "" }: WorrkFreeLogoProps) {
  const logoId = useId().replace(/:/g, "");

  return (
    <div className={`shrink-0 flex items-center justify-center min-w-[36px] min-h-[36px] w-9 h-9 ${className}`}>
      <svg width="100%" height="100%" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`bgGradient-${logoId}`} x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4F46E5" />
            <stop offset="1" stopColor="#7C3AED" />
          </linearGradient>
          <linearGradient id={`shineGradient-${logoId}`} x1="18" y1="0" x2="18" y2="18" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" stopOpacity="0.3" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Main Background */}
        <rect width="36" height="36" rx="12" fill={`url(#bgGradient-${logoId})`} />
        
        {/* Subtle Shine/Gloss on top half */}
        <path d="M0 12C0 5.37258 5.37258 0 12 0H24C30.6274 0 36 5.37258 36 12V16C28 12 18 12 0 16V12Z" fill={`url(#shineGradient-${logoId})`} />

        {/* Custom W Shape - Two Overlapping Vs */}
        <path d="M 9 12 L 14.5 24 L 20 12" stroke="white" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 16 12 L 21.5 24 L 27 12" stroke="white" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      </svg>
    </div>
  );
}
