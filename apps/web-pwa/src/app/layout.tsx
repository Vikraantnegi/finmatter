import type { Metadata } from 'next';
import React from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FinMatter - Smart Credit Card Management',
  description:
    'Manage your credit cards, track expenses, and optimize rewards with FinMatter',
  keywords: [
    'credit cards',
    'expense tracking',
    'financial management',
    'rewards optimization',
  ],
  authors: [{ name: 'FinMatter Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#3b82f6',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'FinMatter - Smart Credit Card Management',
    description:
      'Manage your credit cards, track expenses, and optimize rewards',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FinMatter - Smart Credit Card Management',
    description:
      'Manage your credit cards, track expenses, and optimize rewards',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <head>
        <link rel='manifest' href='/manifest.json' />
        <meta name='theme-color' content='#3b82f6' />
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-status-bar-style' content='default' />
        <meta name='apple-mobile-web-app-title' content='FinMatter' />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
