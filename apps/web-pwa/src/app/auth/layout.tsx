'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div key={pathname} data-pathname={pathname}>
      {children}
    </div>
  );
}
