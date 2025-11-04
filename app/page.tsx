'use client';

import { useState } from 'react';
import Navbar from '@/components/navbar';
import FundList, { FundItem } from '@/components/fund-list';

export default function Page() {
    // 模拟基金数据
    const [funds] = useState<FundItem[]>([
        {
            code: '000001',
            name: '华夏成长混合',
            currentValue: '1.2345',
            accumulatedValue: '3.4567',
            dailyChange: '+0.0345',
            changePercent: '+2.85%',
            isMonitoring: true,
            isFavorite: true,
            updateTime: '2023-10-15 15:00',
            status: '打开',
        },
        {
            code: '000002',
            name: '易方达蓝筹精选混合',
            currentValue: '2.3456',
            accumulatedValue: '5.6789',
            dailyChange: '-0.0123',
            changePercent: '-0.52%',
            isMonitoring: false,
            isFavorite: true,
            updateTime: '2023-10-15 15:00',
            status: '打开',
        },
        {
            code: '000003',
            name: '嘉实沪深300ETF联接',
            currentValue: '1.8901',
            accumulatedValue: '2.3456',
            dailyChange: '+0.0567',
            changePercent: '+3.08%',
            isMonitoring: true,
            isFavorite: false,
            updateTime: '2023-10-15 15:00',
            status: '暂停',
        },
        {
            code: '000004',
            name: '南方中证500ETF联接',
            currentValue: '1.4567',
            accumulatedValue: '3.1234',
            dailyChange: '+0.0234',
            changePercent: '+1.63%',
            isMonitoring: false,
            isFavorite: false,
            updateTime: '2023-10-15 15:00',
            status: '打开',
        },
        {
            code: '000005',
            name: '博时沪深300指数',
            currentValue: '1.6789',
            accumulatedValue: '2.8901',
            dailyChange: '-0.0345',
            changePercent: '-2.01%',
            isMonitoring: true,
            isFavorite: true,
            updateTime: '2023-10-15 15:00',
            status: '打开',
        },
        {
            code: '000006',
            name: '富国天惠成长混合',
            currentValue: '2.1234',
            accumulatedValue: '4.5678',
            dailyChange: '+0.0456',
            changePercent: '+2.20%',
            isMonitoring: false,
            isFavorite: false,
            updateTime: '2023-10-15 15:00',
            status: '暂停',
        },
    ]);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 使用导航栏组件 */}
            <Navbar />
            {/* 使用基金列表组件 */}
            <FundList initialFunds={funds} />
        </div>
    );
}
