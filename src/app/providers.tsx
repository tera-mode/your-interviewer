'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { TraitsProvider } from '@/contexts/TraitsContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TraitsProvider>
        {children}
      </TraitsProvider>
    </AuthProvider>
  );
}
