'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Debug logging to see if layout is working
  // console.log('AuthLayout: rendering for pathname', pathname);

  // Simple approach: just wrap with a div that has the pathname as key
  // This should force React to remount when pathname changes
  return (
    <div key={pathname} data-pathname={pathname}>
      {children}
    </div>
  );
}
