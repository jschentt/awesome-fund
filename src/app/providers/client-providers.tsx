'use client';

import { AuthProvider } from './auth-provider';
import { ConfigProvider } from 'antd';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ConfigProvider>
      <AuthProvider>{children}</AuthProvider>
    </ConfigProvider>
  );
}
