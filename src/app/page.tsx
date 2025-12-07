'use client';

import { useState, useEffect, useRef } from 'react';
import { useRequest } from 'ahooks';
import Navbar from '@/components/navbar';
import FundList, { FundItem } from '@/components/fund-list';
import Pagination from '@/components/Pagination';
import { getLocalStorageWithExpiry } from '@/lib/utils';

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
    const [favoriteFunds, setFavoriteFunds] = useState<ExtendedFundItem[]>([]);
    const [showFavoriteList, setShowFavoriteList] = useState(false);
    const [monitorFunds, setMonitorFunds] = useState<ExtendedFundItem[]>([]);
    const [showMonitorList, setShowMonitorList] = useState(false);
    const [favoriteCount, setFavoriteCount] = useState(0);
    const [monitorCount, setMonitorCount] = useState(0);

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });

    const firstLoad = useRef(true);

    // 构建 API URL 带分页参数
    const apiUrl = `/api/funds?page=${pagination.page}&limit=${pagination.limit}`;

    // ✅ 防抖 500 ms，请求真正发出
    const {
        data,
        error,
        loading: isLoading,
        run: refreshFunds,
    } = useRequest(fetcher, {
        defaultParams: [apiUrl],
        debounceWait: 500, // 关键参数
        refreshDeps: [pagination.page, pagination.limit], // 显式监听page和limit变化
        ready: !!apiUrl, // 空 url 时不发请求
        onSuccess: () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },
    });

    // 当page或limit变化时，显式重新请求数据
    useEffect(() => {
        // 直接在effect内部构建最新的apiUrl，确保使用最新的page和limit值
        const currentApiUrl = `/api/funds?page=${pagination.page}&limit=${pagination.limit}`;
        refreshFunds(currentApiUrl);
    }, [pagination.page, pagination.limit, refreshFunds]);

    const loadFavoriteList = async () => {
        try {
            const userInfo = getLocalStorageWithExpiry('userInfo');
            if (!userInfo.id) {
                return;
            }

            // 调用API获取收藏基金列表
            const response = await fetch(`/api/funds/favorite/list`, {
                headers: {
                    'X-User-Id': userInfo.id,
                },
            });
            if (!response.ok) {
                throw new Error('获取收藏列表失败');
            }
            const data = await response.json();

            const favoriteFunds =
                data?.data?.map((item: { data: ExtendedFundItem }) => item.data) || [];

            setFavoriteFunds(favoriteFunds);
            setFavoriteCount(favoriteFunds.length);
        } catch (error) {
            console.error('获取收藏列表失败:', error);
        }
    };

    const loadMonitorList = async () => {
        try {
            const userInfo = getLocalStorageWithExpiry('userInfo');
            if (!userInfo.id) {
                return;
            }

            // 调用API获取监控基金列表
            const response = await fetch(`/api/funds/monitor/list`, {
                headers: {
                    'X-User-Id': userInfo.id,
                },
            });
            if (!response.ok) {
                throw new Error('获取监控列表失败');
            }
            const data = await response.json();

            const monitorFunds =
                data?.data?.map((item: { data: ExtendedFundItem }) => item.data) || [];

            setMonitorFunds(monitorFunds);
            setMonitorCount(monitorFunds.length);
        } catch (error) {
            console.error('获取监控列表失败:', error);
        }
    };

    useEffect(() => {
        if (firstLoad.current) {
            loadFavoriteList();
            loadMonitorList();
            firstLoad.current = false;
        }
    }, []);

    // 解构基金数据，提供默认值
    const funds = data?.data || [];

    useEffect(() => {
        setPagination({
            page: data?.page || 1,
            limit: data?.limit || 10,
            total: data?.total || 0,
            totalPages: Math.ceil((data?.total || 0) / (data?.limit || 10)),
        });
    }, [data]);

    const fundsWithFavorite = funds.map((fund) => ({
        ...fund,
        isFavorite: favoriteFunds.some((fav) => fav.id === fund.id),
        isMonitoring: monitorFunds.some((mon) => mon.id === fund.id),
    }));

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
            setPagination({ ...pagination, page: newPage });
        }
    };

    // 为组件提供的简化版limit改变处理函数
    const handleLimitChangeForComponent = (newLimit: string) => {
        setPagination({
            ...pagination,
            limit: parseInt(newLimit, 10),
            page: 1, // 重置到第一页
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 使用导航栏组件 */}
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                {/* 使用基金列表组件 */}
                <FundList
                    total={pagination.total}
                    initialFunds={fundsWithFavorite as FundItem[]}
                    showFavoriteList={showFavoriteList}
                    setShowFavoriteList={setShowFavoriteList}
                    refreshFavoriteList={loadFavoriteList}
                    showMonitorList={showMonitorList}
                    setShowMonitorList={setShowMonitorList}
                    refreshMonitorList={loadMonitorList}
                    isLoading={isLoading}
                    favoriteCount={favoriteCount}
                    monitorCount={monitorCount}
                />

                {/* 分页控件 - 当显示收藏列表时隐藏 */}
                {!showFavoriteList && (
                    <Pagination
                        page={pagination.page}
                        limit={pagination.limit}
                        total={pagination.total}
                        totalPages={pagination.totalPages}
                        onPageChange={handlePageChange}
                        onLimitChange={handleLimitChangeForComponent}
                    />
                )}
            </div>
        </div>
    );
}
