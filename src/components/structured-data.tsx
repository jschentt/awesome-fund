'use client';

import React, { useEffect } from 'react';

interface StructuredDataProps {
    type?: 'website' | 'financial-product' | 'organization';
    data?: any;
}

const StructuredData: React.FC<StructuredDataProps> = ({ type = 'website', data }) => {
    useEffect(() => {
        let jsonLd;

        switch (type) {
            case 'website':
                jsonLd = {
                    '@context': 'https://schema.org',
                    '@type': 'WebSite',
                    name: '基金监测平台',
                    url: 'https://fund.maiqishare.xyz',
                    description:
                        '专业的基金监测平台，提供实时基金净值查询、涨跌幅度分析、个性化基金监控服务。',
                    potentialAction: {
                        '@type': 'SearchAction',
                        target: 'https://fund.maiqishare.xyz/?search={search_term_string}',
                        'query-input': 'required name=search_term_string',
                    },
                };
                break;

            case 'financial-product':
                jsonLd = {
                    '@context': 'https://schema.org',
                    '@type': 'FinancialProduct',
                    name: data?.name || '基金产品',
                    description: data?.description || '基金投资产品',
                    provider: {
                        '@type': 'Organization',
                        name: '基金监测平台',
                    },
                    ...data,
                };
                break;

            case 'organization':
                jsonLd = {
                    '@context': 'https://schema.org',
                    '@type': 'Organization',
                    name: '基金监测平台',
                    url: 'https://fund.maiqishare.xyz',
                    logo: 'https://fund.maiqishare.xyz/images/logo-text.png',
                    description: '专业的基金监测与分析平台',
                };
                break;

            default:
                jsonLd = {
                    '@context': 'https://schema.org',
                    '@type': 'WebSite',
                    name: '基金监测平台',
                    url: 'https://fund.maiqishare.xyz',
                };
        }

        // 创建script标签并添加到页面头部
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(jsonLd);
        document.head.appendChild(script);

        // 组件卸载时移除script标签
        return () => {
            document.head.removeChild(script);
        };
    }, [type, data]);

    return null;
};

export default StructuredData;
