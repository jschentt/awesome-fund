import type { Metadata } from 'next';
// 导入全局样式文件
import './globals.css';
import ClientProviders from './providers/client-providers';
import StructuredData from '@/components/structured-data';

export const metadata: Metadata = {
    title: '守望小基 - 实时基金净值查询与监测平台',
    description:
        '专业的基金监测平台，提供实时基金净值查询、涨跌幅度分析、个性化基金监控服务，帮助投资者及时掌握基金市场动态。',
    keywords: '基金监测,基金净值,实时基金,基金查询,基金监控,投资分析',
    authors: [{ name: '基金监测平台' }],
    viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 1,
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    // 社交媒体元标签
    openGraph: {
        title: '守望小基 - 实时基金净值查询与监测平台',
        description: '专业的基金监测平台，提供实时基金净值查询、涨跌幅度分析、个性化基金监控服务。',
        url: 'https://your-domain.com',
        siteName: '基金监测平台',
        type: 'website',
        images: [
            {
                url: 'https://your-domain.com/og-image.jpg',
                width: 1200,
                height: 630,
                alt: '基金监测平台',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: '守望小基 - 实时基金净值查询与监测平台',
        description: '专业的基金监测平台，提供实时基金净值查询、涨跌幅度分析、个性化基金监控服务。',
        images: ['https://your-domain.com/og-image.jpg'],
        creator: '@your-twitter-handle',
    },
    // 其他SEO相关标签
    generator: 'Next.js',
    applicationName: '基金监测平台',
    referrer: 'origin-when-cross-origin',
    publisher: '基金监测平台',
    formatDetection: {
        email: true,
        address: true,
        telephone: true,
    },
};

// 定时任务初始化逻辑已移至CronTaskInitializer组件

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="zh-CN">
            <head>
                <StructuredData type="website" />
            </head>
            <body className="">
                <ClientProviders>{children}</ClientProviders>
            </body>
        </html>
    );
}
