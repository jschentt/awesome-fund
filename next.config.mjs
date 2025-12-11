import path from 'path';
/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
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
