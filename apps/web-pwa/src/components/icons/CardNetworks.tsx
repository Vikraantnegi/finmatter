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
      viewBox='0 0 82 26'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M34.6037 25.2891H27.3177L31.7097 0.71875H39.0027L34.6037 25.2891Z'
        fill='#1434CB'
      />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M59.3063 1.71875C57.9063 1.21875 55.7063 0.71875 53.0063 0.71875C46.4063 0.71875 41.7063 4.11875 41.6063 8.91875C41.5063 12.4188 44.9063 14.3188 47.4063 15.4188C50.0063 16.5188 50.9063 17.2188 50.9063 18.2188C50.8063 19.7188 48.9063 20.4188 47.1063 20.4188C44.6063 20.4188 43.2063 19.9188 41.0063 19.0188L40.2063 18.7188L39.4063 24.7188C41.0063 25.4188 43.9063 26.0188 46.9063 26.0188C53.9063 26.0188 58.5063 22.6188 58.6063 17.5188C58.7063 14.7188 57.0063 12.6188 53.2063 10.9188C50.9063 9.81875 49.5063 9.11875 49.5063 8.01875C49.5063 7.01875 50.7063 6.01875 53.1063 6.01875C55.1063 6.01875 56.6063 6.41875 57.8063 6.91875L58.4063 7.11875L59.3063 1.71875Z'
        fill='#1434CB'
      />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M68.1063 0.71875H73.4063C74.8063 0.81875 75.9063 1.31875 76.3063 2.71875L81.4063 25.2188H74.1063L73.2063 21.7188H64.7063L63.3063 25.2188H55.0063L64.8063 2.31875C65.3063 1.21875 66.5063 0.71875 68.1063 0.71875ZM69.0063 7.71875L66.2063 16.7188H71.6063L69.0063 7.71875Z'
        fill='#1434CB'
      />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M22.8063 0.71875L15.9063 17.7188L15.3063 15.1188C14.2063 11.4188 10.7063 7.41875 6.80627 5.51875L13.1063 25.2188L20.5063 25.1188L31.2063 0.71875H22.8063Z'
        fill='#1434CB'
      />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M10.4063 0.71875H0.106274L0.00627422 1.11875C8.00627 3.11875 13.4063 8.51875 15.3063 15.1188L13.1063 2.81875C12.8063 1.31875 11.7063 0.81875 10.4063 0.71875Z'
        fill='#F2AE14'
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
