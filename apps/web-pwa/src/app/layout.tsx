import type { Metadata, Viewport } from 'next';
import React from 'react';
import { Manrope } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/Providers';
import AuthProvider from '@/components/auth/AuthProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SWRProvider } from '@/components/providers/SWRProvider';
import { NotificationPermission } from '@/components/notifications/NotificationPermission';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#13a4ec',
};

export const metadata: Metadata = {
  title: 'FinMatter - Your Smartest Financial Move',
  description:
    'The personal finance super app to optimize credit cards, track spending, and get AI-powered insights.',
  keywords: [
    'credit cards',
    'expense tracking',
    'financial management',
    'rewards optimization',
    'personal finance',
    'AI financial assistant',
  ],
  authors: [{ name: 'FinMatter Team' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'FinMatter - Your Smartest Financial Move',
    description:
      'The personal finance super app to optimize credit cards, track spending, and get AI-powered insights.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FinMatter - Your Smartest Financial Move',
    description:
      'The personal finance super app to optimize credit cards, track spending, and get AI-powered insights.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' className='dark'>
      <head>
        <link rel='manifest' href='/manifest.json' />
        <meta name='theme-color' content='#13a4ec' />
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-status-bar-style' content='default' />
        <meta name='apple-mobile-web-app-title' content='FinMatter' />
        <link
          href='https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200'
          rel='stylesheet'
        />
      </head>
      <body className={`${manrope.variable} ${manrope.className}`}>
        <ErrorBoundary>
          <SWRProvider>
            <Providers>
              <AuthProvider>
                {children}
                <NotificationPermission />
              </AuthProvider>
            </Providers>
          </SWRProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
