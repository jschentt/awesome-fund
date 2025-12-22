import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: 'https://fund.maiqishare.xyz',
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        // 可以根据需要添加更多路由
        // {
        //     url: 'https://your-domain.com/about',
        //     lastModified: new Date(),
        //     changeFrequency: 'monthly',
        //     priority: 0.8,
        // },
    ];
}
