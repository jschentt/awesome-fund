'use client';

import { AuthProvider } from './auth-provider';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

interface ClientProvidersProps {
    children: React.ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
    return (
        <ConfigProvider locale={zhCN}>
            <AuthProvider>{children}</AuthProvider>
        </ConfigProvider>
    );
}
