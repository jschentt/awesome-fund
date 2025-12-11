'use client';

import { useState, useEffect, useRef } from 'react';
import { useRequest } from 'ahooks';
import Navbar from '@/components/navbar';
import FundList, { FundItem } from '@/components/fund-list';
import { Pagination, Button } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { getLocalStorageWithExpiry } from '@/lib/utils';
import dynamic from 'next/dynamic';

// 动态导入PullToRefresh组件，禁用服务器端渲染
const PullToRefresh = dynamic(() => import('react-pull-to-refresh'), { ssr: false });

// 定义 API 返回数据的接口
interface ApiResponse {
    data: ExtendedFundItem[];
    total: number;
    page: number;
    limit: number;
    totalPages?: number;
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

// 通用去重方法：根据fund.code去重，避免重复添加相同基金
const mergeFundsWithDeduplication = (
    existingFunds: ExtendedFundItem[],
    newFunds: ExtendedFundItem[],
): ExtendedFundItem[] => {
    const existingCodes = new Set(existingFunds.map((f) => f.code));
    const uniqueNewFunds = newFunds.filter(
        (fund: ExtendedFundItem) => !existingCodes.has(fund.code),
    );
    return [...existingFunds, ...uniqueNewFunds];
};

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
    const [data, setData] = useState<ApiResponse>({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
    });

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });

    const firstLoad = useRef(true);

    // 响应式屏幕检测 - 使用客户端方式确保Next.js兼容
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // 只在客户端执行
        if (typeof window !== 'undefined') {
            const checkScreenSize = () => {
                setIsMobile(window.innerWidth <= 768);
            };

            // 初始检测
            checkScreenSize();

            // 监听窗口大小变化
            window.addEventListener('resize', checkScreenSize);

            return () => {
                window.removeEventListener('resize', checkScreenSize);
            };
        }
    }, []);

    // 移动端无限滚动相关状态
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [allFunds, setAllFunds] = useState<ExtendedFundItem[]>([]);

    // 滚动检测ref
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // 构建 API URL 带分页参数
    const apiUrl = `/api/funds?page=${pagination.page}&limit=${pagination.limit}`;

    // ✅ 防抖 500 ms，请求真正发出
    const {
        error,
        loading: isLoading,
        run: refreshFunds,
    } = useRequest(fetcher, {
        defaultParams: [apiUrl],
        debounceWait: 500, // 关键参数
        refreshDeps: [pagination.page, pagination.limit], // 显式监听page和limit变化
        ready: !!apiUrl, // 空 url 时不发请求
        onSuccess: (fetchedData) => {
            setData(fetchedData);

            // 移动端处理：累积所有加载的数据
            if (isMobile) {
                if (fetchedData.page === 1) {
                    setAllFunds(fetchedData.data);
                } else {
                    setAllFunds((prev) => mergeFundsWithDeduplication(prev, fetchedData.data));
                }
                // 计算总页数并检查是否还有更多数据
                const totalPages = Math.ceil(fetchedData.total / fetchedData.limit);
                setHasMore(fetchedData.data.length > 0 && fetchedData.page < totalPages);
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        },
    });

    const loadAllFunds = async () => {
        try {
            const res = await fetch(apiUrl);
            if (!res.ok) {
                throw new Error('获取基金请求失败');
            }
            const data = await res.json();
            setData(data);
        } catch (err) {
            console.error('获取基金数据失败:', err);
        }
    };

    useEffect(() => {
        // 每30秒轮询一次接口
        const interval = setInterval(() => {
            loadAllFunds();
            loadFavoriteList();
            loadMonitorList();
        }, 30 * 1000);

        // 清理定时器
        return () => clearInterval(interval);
    }, [apiUrl]);

    // 当page或limit变化时，显式重新请求数据
    useEffect(() => {
        // 直接在effect内部构建最新的apiUrl，确保使用最新的page和limit值
        const currentApiUrl = `/api/funds?page=${pagination.page}&limit=${pagination.limit}`;
        refreshFunds(currentApiUrl);
    }, [pagination.page, pagination.limit]);

    // 移动端滚动加载更多
    useEffect(() => {
        // 只在客户端和移动端执行
        if (typeof window !== 'undefined' && isMobile && scrollContainerRef.current) {
            const handleScroll = () => {
                const container = scrollContainerRef.current;
                if (!container) return;

                const { scrollTop, clientHeight, scrollHeight } = container;

                // 当滚动到距离底部100px时加载更多
                if (scrollHeight - scrollTop - clientHeight < 100 && !isLoadingMore && hasMore) {
                    loadMoreFunds();
                }
            };

            const container = scrollContainerRef.current;
            container.addEventListener('scroll', handleScroll);

            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [isMobile, isLoadingMore, hasMore]);

    // 加载更多数据
    const loadMoreFunds = async () => {
        if (isLoadingMore || !hasMore) return;

        setIsLoadingMore(true);

        try {
            const nextPage = pagination.page + 1;
            const currentApiUrl = `/api/funds?page=${nextPage}&limit=${pagination.limit}`;

            const res = await fetch(currentApiUrl);
            if (!res.ok) {
                throw new Error('Failed to fetch data');
            }

            const fetchedData = await res.json();

            // 更新状态
            setPagination((prev) => ({
                ...prev,
                page: nextPage,
            }));

            setAllFunds((prev) => mergeFundsWithDeduplication(prev, fetchedData.data));

            // 计算总页数并检查是否还有更多数据
            const totalPages = Math.ceil(fetchedData.total / fetchedData.limit);
            setHasMore(fetchedData.data.length > 0 && nextPage < totalPages);
        } catch (err) {
            console.error('加载更多数据失败:', err);
        } finally {
            setIsLoadingMore(false);
        }
    };

    // 下拉刷新处理函数
    const handleRefresh = async () => {
        // 重置移动端状态
        setPagination((prev) => ({
            ...prev,
            page: 1,
        }));
        setAllFunds([]);
        setHasMore(true);

        // 重新加载数据
        const currentApiUrl = `/api/funds?page=1&limit=${pagination.limit}`;
        await refreshFunds(currentApiUrl);
    };

    const loadFavoriteList = async () => {
        try {
            // 只在客户端执行
            if (typeof window === 'undefined') return;

            const userInfo = getLocalStorageWithExpiry('userInfo');
            if (!userInfo || !userInfo?.id) {
                return;
            }

            // 调用API获取收藏基金列表
            const response = await fetch(`/api/funds/favorite/list`, {
                headers: {
                    'X-User-Id': userInfo?.id,
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
            // 只在客户端执行
            if (typeof window === 'undefined') return;

            const userInfo = getLocalStorageWithExpiry('userInfo');
            if (!userInfo || !userInfo?.id) {
                return;
            }

            // 调用API获取监控基金列表
            const response = await fetch(`/api/funds/monitor/list`, {
                headers: {
                    'X-User-Id': userInfo?.id,
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

    // 根据设备类型选择要显示的基金数据
    const displayFunds = isMobile ? allFunds : funds;

    const fundsWithFavorite = displayFunds.map((fund) => ({
        ...fund,
        isFavorite: favoriteFunds.some((fav) => fav?.id === fund?.id),
        isMonitoring: monitorFunds.some((mon) => mon?.id === fund?.id),
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
                {/* 移动端使用下拉刷新，桌面端正常显示 */}
                {isMobile ? (
                    <PullToRefresh
                        onRefresh={handleRefresh}
                        className="h-[calc(100vh-160px)] overflow-auto"
                    >
                        <div ref={scrollContainerRef} className="h-full overflow-auto">
                            <FundList
                                total={pagination.total}
                                initialFunds={fundsWithFavorite as FundItem[]}
                                showFavoriteList={showFavoriteList}
                                setShowFavoriteList={setShowFavoriteList}
                                refreshFavoriteList={loadFavoriteList}
                                showMonitorList={showMonitorList}
                                setShowMonitorList={setShowMonitorList}
                                refreshMonitorList={loadMonitorList}
                                isLoading={false}
                                favoriteCount={favoriteCount}
                                monitorCount={monitorCount}
                            />

                            {/* 加载更多按钮/状态 */}
                            {!showFavoriteList && !showMonitorList && (
                                <div className="mt-4 flex justify-center pb-8">
                                    {isLoadingMore ? (
                                        <Button loading icon={<LoadingOutlined />}>
                                            加载中...
                                        </Button>
                                    ) : hasMore ? (
                                        <Button onClick={loadMoreFunds}>加载更多</Button>
                                    ) : (
                                        <div className="text-gray-500 text-sm">已加载全部数据</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </PullToRefresh>
                ) : (
                    <>
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
                        {!showFavoriteList && !showMonitorList && (
                            <div className="mt-6 flex justify-center">
                                <Pagination
                                    current={pagination.page}
                                    pageSize={pagination.limit}
                                    total={pagination.total}
                                    onChange={handlePageChange}
                                    onShowSizeChange={(current, size) =>
                                        handleLimitChangeForComponent(size.toString())
                                    }
                                    showSizeChanger
                                    pageSizeOptions={['10', '20', '50', '100']}
                                    showTotal={(total) => `共 ${total} 条记录`}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
