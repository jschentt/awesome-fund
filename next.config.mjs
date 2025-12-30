import path from 'path';

const isVercel = process.env.VERCEL === '1'; // Vercel 会自动注

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: isVercel ? undefined : 'standalone', // Vercel 不需要 standalone
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
