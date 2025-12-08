import path from 'path';
/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
        domains: ['upload-images.jianshu.io'],
    },
};
export default nextConfig;
