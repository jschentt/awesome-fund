'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import Navbar from '@/components/navbar';
import FundList, { FundItem } from '@/components/fund-list';
import { Spin } from 'antd';

// 定义 API 返回数据的接口
interface ApiResponse {
    data: ExtendedFundItem[];
    total: number;
    page: number;
    limit: number;
}

// 扩展 FundItem 接口以匹配新的数据结构
interface ExtendedFundItem {
    id: string;
    code: string;
    name: string;
    type: string;
    shortName: string;
    netWorth: number;
    expectWorth: number;
    expectGrowth: number;
    estimatedChange: number;
    netWorthDate: string;
    expectWorthDate: string;
    totalCount: number;
    description: string;
    // 兼容FundList组件所需的字段
    currentValue?: string;
    dailyChange?: string;
    changePercent?: string;
    isMonitoring?: boolean;
    isFavorite?: boolean;
    status?: string;
    updateTime?: string; // 增加缺失的updateTime属性
}

// 定义 fetcher 函数
const fetcher = async (url: string): Promise<ApiResponse> => {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error('Failed to fetch data');
    }
    return res.json();
};

export default function Page() {
    // 分页状态
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [showFavoriteList, setShowFavoriteList] = useState(false);

    // 构建 API URL 带分页参数
    const apiUrl = `/api/funds?page=${page}&limit=${limit}`;

    // 使用 SWR 从 API 获取基金数据
    const { data, error, isLoading } = useSWR<ApiResponse>(apiUrl, fetcher);

    // 解构基金数据，提供默认值
    const funds = data?.data || [];
    const pagination = {
        page: data?.page || 1,
        limit: data?.limit || 10,
        total: data?.total || 0,
        totalPages: Math.ceil((data?.total || 0) / (data?.limit || 10)),
    };

    // 同步本地状态与API返回的分页信息
    useEffect(() => {
        if (data?.page && data.page !== page) {
            setPage(data.page);
        }
        if (data?.limit && data.limit !== limit) {
            setLimit(data.limit);
        }
    }, [data, page, limit]);

    // 加载状态
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Spin size="large" className="flex justify-center mt-10" />
            </div>
        );
    }

    // 错误状态
    if (error || !funds) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <Navbar />
                <div className="p-6 bg-white rounded-lg shadow-sm mt-8">
                    <h2 className="text-xl font-semibold text-red-500 mb-2">加载失败</h2>
                    <p className="text-gray-600 mb-4">无法获取基金数据，请稍后重试。</p>
                    <button
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        onClick={() => window.location.reload()}
                    >
                        重试
                    </button>
                </div>
            </div>
        );
    }

    // 分页控制函数
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPage(newPage);
        }
    };

    // 每页数量改变处理函数
    const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLimit(parseInt(e.target.value, 10));
        setPage(1); // 重置到第一页
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 使用导航栏组件 */}
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                {/* 使用基金列表组件 */}
                <FundList
                    total={pagination.total}
                    initialFunds={funds as FundItem[]}
                    isLoading={isLoading}
                    showFavoriteList={showFavoriteList}
                    setShowFavoriteList={setShowFavoriteList}
                />

                {/* 分页控件 - 当显示收藏列表时隐藏 */}
                {!showFavoriteList && (
                    <div className="mt-6 flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            显示 {(pagination.page - 1) * pagination.limit + 1} -{' '}
                            {Math.min(pagination.page * pagination.limit, pagination.total)} 条，共{' '}
                            {pagination.total} 条记录
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">每页显示：</span>
                            <select
                                value={pagination.limit}
                                onChange={handleLimitChange}
                                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="10">10条</option>
                                <option value="20">20条</option>
                                <option value="50">50条</option>
                            </select>
                            <div className="flex items-center space-x-1 ml-4">
                                <button
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                    className={`px-3 py-1 rounded border ${pagination.page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'} transition-colors`}
                                >
                                    上一页
                                </button>
                                <span className="px-3 py-1 text-sm">
                                    {pagination.page} / {pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page === pagination.totalPages}
                                    className={`px-3 py-1 rounded border ${pagination.page === pagination.totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'} transition-colors`}
                                >
                                    下一页
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
