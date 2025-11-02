'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  return (
    <div key={pathname} data-pathname={pathname}>
      {children}
    </div>
  );
};

export default AuthLayout;
