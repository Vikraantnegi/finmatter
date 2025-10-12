/**
 * Card Network Logo Components
 * SVG icons for major card networks
 */

import React from 'react';

interface NetworkLogoProps {
  className?: string;
}

export function VisaLogo({ className = 'w-12 h-8' }: NetworkLogoProps) {
  return (
    <svg
      className={className}
      viewBox='0 0 48 32'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <rect width='48' height='32' rx='4' fill='white' fillOpacity='0.9' />
      <path
        d='M19.5 10h-3.2l-2 12h3.2l2-12zm8.5 7.7l1.7-4.7 1 4.7h-2.7zm3.6 4.3h3l-2.6-12h-2.7c-.6 0-1.1.4-1.3.9l-4.6 11.1h3.4l.7-1.9h4.2l.4 1.9zm-7.5-3.9c0-3.2-4.4-3.4-4.4-4.8 0-.4.4-.9 1.3-.9.7 0 1.5.1 2.2.4l.4-1.9c-.7-.3-1.6-.5-2.7-.5-2.8 0-4.8 1.5-4.8 3.6 0 1.6 1.4 2.4 2.5 3 1.1.5 1.5.9 1.5 1.4 0 .7-.9 1-1.7 1-.9 0-1.9-.2-2.8-.6l-.4 2c.9.4 2 .6 3.1.6 3 0 4.9-1.5 4.9-3.7zm-11.9-8.1l-5 12h-3.4l-2.5-9.7c-.1-.5-.3-.7-.8-.9-.8-.3-2.1-.6-3.2-.8l.1-.6h5.5c.7 0 1.3.5 1.5 1.3l1.4 7.4 3.4-8.7h3.5z'
        fill='#1434CB'
      />
    </svg>
  );
}

export function MastercardLogo({ className = 'w-12 h-8' }: NetworkLogoProps) {
  return (
    <svg
      className={className}
      viewBox='0 0 48 32'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <rect width='48' height='32' rx='4' fill='white' fillOpacity='0.9' />
      <circle cx='18' cy='16' r='8' fill='#EB001B' />
      <circle cx='30' cy='16' r='8' fill='#F79E1B' />
      <path
        d='M24 9.6c-1.7 1.4-2.8 3.5-2.8 5.9s1.1 4.5 2.8 5.9c1.7-1.4 2.8-3.5 2.8-5.9s-1.1-4.5-2.8-5.9z'
        fill='#FF5F00'
      />
    </svg>
  );
}

export function RupayLogo({ className = 'w-12 h-8' }: NetworkLogoProps) {
  return (
    <svg
      className={className}
      viewBox='0 0 48 32'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <rect width='48' height='32' rx='4' fill='white' fillOpacity='0.9' />
      <path
        d='M12 12h6c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2h-6v-8zm2 6h3c.6 0 1-.4 1-1v-2c0-.6-.4-1-1-1h-3v4z'
        fill='#097939'
      />
      <path
        d='M22 12h2v6.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5V12h2v6.5c0 1.9-1.6 3.5-3.5 3.5s-3.5-1.6-3.5-3.5V12z'
        fill='#523080'
      />
      <path
        d='M32 12h4c1.1 0 2 .9 2 2s-.9 2-2 2h-2v4h-2v-8zm2 3h2v-2h-2v2z'
        fill='#EE7623'
      />
    </svg>
  );
}

export function AmexLogo({ className = 'w-12 h-8' }: NetworkLogoProps) {
  return (
    <svg
      className={className}
      viewBox='0 0 48 32'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <rect width='48' height='32' rx='4' fill='#006FCF' />
      <path
        d='M12 14l-2 4h4l-2-4zm8 0h-4v4h4v-1h-3v-.5h3v-1h-3V15h3v-1zm4 0l-2 4h2l.3-.7h1.4l.3.7h2l-2-4h-2zm.5 2.3l.5-1.1.5 1.1h-1zm4.5-2.3l-1.5 2 1.5 2h-2l-1-1.3-1 1.3h-2l1.5-2-1.5-2h2l1 1.3 1-1.3h2z'
        fill='white'
      />
    </svg>
  );
}

export function DiscoverLogo({ className = 'w-12 h-8' }: NetworkLogoProps) {
  return (
    <svg
      className={className}
      viewBox='0 0 48 32'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <rect width='48' height='32' rx='4' fill='white' fillOpacity='0.9' />
      <path d='M36 16c0 4.4-3.6 8-8 8H8V8h20c4.4 0 8 3.6 8 8z' fill='#FF6000' />
      <text
        x='12'
        y='19'
        fontFamily='Arial, sans-serif'
        fontSize='8'
        fontWeight='bold'
        fill='#000'
      >
        DISCOVER
      </text>
    </svg>
  );
}

/**
 * Get network logo component by network type
 */
export function getNetworkLogo(
  network: string,
): React.ComponentType<NetworkLogoProps> {
  const networkMap: Record<string, React.ComponentType<NetworkLogoProps>> = {
    visa: VisaLogo,
    mastercard: MastercardLogo,
    rupay: RupayLogo,
    amex: AmexLogo,
    discover: DiscoverLogo,
  };

  return networkMap[network.toLowerCase()] || VisaLogo;
}
