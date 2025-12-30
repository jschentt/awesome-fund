import path from 'path';

// 让 Vercel 走 /，自己服务器走 /fund
const isVercel = process.env.VERCEL === '1'; // Vercel 会自动注入 VERCEL=1
const isLocalDev = process.env.NODE_ENV === 'development'; // 本地开发环境
const basePath = isVercel || isLocalDev ? '' : '/fund';

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: isVercel ? undefined : 'standalone', // Vercel 不需要 standalone
    basePath,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'upload-images.jianshu.io',
                pathname: '**',
            },
        ],
    },
};

export default nextConfig;
