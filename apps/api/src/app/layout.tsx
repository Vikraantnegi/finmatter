import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FinMatter API',
  description: 'Personal finance super app API server',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body>{children}</body>
    </html>
  );
}
