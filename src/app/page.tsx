'use client';

import { useState, useEffect, useRef } from 'react';
import { useRequest } from 'ahooks';
import Navbar from '@/components/navbar';
import FundList, { FundItem } from '@/components/fund-list';
import { Pagination, Button } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { getLocalStorageWithExpiry } from '@/lib/utils';

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
const fetcher = async (params: {
    page: number;
    limit: number;
    keyword?: string;
    isIndexFundFiltered: boolean;
    isStockFundFiltered: boolean;
}): Promise<ApiResponse> => {
    // 根据筛选条件构建whiteList
    let whiteList: string[] = [];
    if (params.isIndexFundFiltered) {
        whiteList = whiteList.concat(['联接C', '增强C', '指数C']);
    }
    if (params.isStockFundFiltered) {
        whiteList.push('股票');
    }

    const res = await fetch('/api/funds', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...params,
            whiteList,
        }),
    });
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
    const [keyword, setKeyword] = useState('');
    const [favoriteCount, setFavoriteCount] = useState(0);
    const [monitorCount, setMonitorCount] = useState(0);
    const [data, setData] = useState<ApiResponse>({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
    });
    // 指数基金筛选状态，默认选中
    const [isIndexFundFiltered, setIsIndexFundFiltered] = useState(false);
    // 股票基金筛选状态，默认未选中
    const [isStockFundFiltered, setIsStockFundFiltered] = useState(false);

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

    // ✅ 防抖 500 ms，请求真正发出
    const {
        error,
        loading: isLoading,
        run: refreshFunds,
    } = useRequest(fetcher, {
        defaultParams: [
            {
                page: pagination.page,
                limit: pagination.limit,
                keyword,
                isIndexFundFiltered,
                isStockFundFiltered,
            },
        ],
        debounceWait: 500, // 关键参数
        refreshDeps: [
            pagination.page,
            pagination.limit,
            keyword,
            isIndexFundFiltered,
            isStockFundFiltered,
        ], // 显式监听page、limit、keyword和筛选状态变化
        onSuccess: (fetchedData) => {
            setData(fetchedData);

            // 更新分页状态的total和totalPages
            setPagination((prev) => ({
                ...prev,
                total: fetchedData.total,
                totalPages: Math.ceil(fetchedData.total / prev.limit),
            }));

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

    useEffect(() => {
        // 每30秒轮询一次接口
        const interval = setInterval(() => {
            refreshFunds({
                page: pagination.page,
                limit: pagination.limit,
                keyword,
                isIndexFundFiltered,
                isStockFundFiltered,
            });
            loadFavoriteList();
            loadMonitorList();
        }, 30 * 1000);

        // 清理定时器
        return () => clearInterval(interval);
    }, [pagination.page, pagination.limit, keyword, isIndexFundFiltered, isStockFundFiltered]);

    // 当page、limit、keyword或筛选状态变化时，显式重新请求数据
    useEffect(() => {
        refreshFunds({
            page: pagination.page,
            limit: pagination.limit,
            keyword,
            isIndexFundFiltered,
            isStockFundFiltered,
        });
    }, [pagination.page, pagination.limit, keyword, isIndexFundFiltered, isStockFundFiltered]);

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

            // 根据筛选条件构建whiteList
            let whiteList: string[] = [];
            if (isIndexFundFiltered) {
                whiteList = whiteList.concat(['联接C', '增强C', '指数C']);
            }
            if (isStockFundFiltered) {
                whiteList.push('股票');
            }

            const res = await fetch('/api/funds', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    page: nextPage,
                    limit: pagination.limit,
                    keyword,
                    whiteList,
                }),
            });
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

    // 搜索按钮点击处理函数
    const handleSearchClick = (searchTerm: string | undefined) => {
        setKeyword(searchTerm || '');
        // 重置到第一页
        setPagination((prev) => ({
            ...prev,
            page: 1,
        }));
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
            setPagination((prev) => ({ ...prev, page: newPage }));
        }
    };

    // 为组件提供的简化版limit改变处理函数
    const handleLimitChangeForComponent = (newLimit: string) => {
        setPagination((prev) => ({
            ...prev,
            limit: parseInt(newLimit, 10),
            page: 1, // 重置到第一页
        }));
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 使用导航栏组件 */}
            <Navbar />

            {/* 移动端使用下拉刷新，桌面端正常显示 */}
            {isMobile ? (
                <div className="container mx-auto px-0 py-4">
                    <div
                        ref={scrollContainerRef}
                        className="overflow-y-auto max-h-[calc(100vh-100px)]"
                    >
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
                            h5Loading={isLoading}
                            favoriteCount={favoriteCount}
                            monitorCount={monitorCount}
                            onSearchClick={handleSearchClick}
                            isIndexFundFiltered={isIndexFundFiltered}
                            onToggleIndexFundFilter={() => setIsIndexFundFiltered((prev) => !prev)}
                            isStockFundFiltered={isStockFundFiltered}
                            onToggleStockFundFilter={() => setIsStockFundFiltered((prev) => !prev)}
                        />

                        {/* 加载更多按钮/状态 */}
                        {!showFavoriteList && !showMonitorList && (
                            <div className="mt-2 flex justify-center pb-8">
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
                </div>
            ) : (
                <div className="container mx-auto px-4 py-8">
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
                        onSearchClick={handleSearchClick}
                        isIndexFundFiltered={isIndexFundFiltered}
                        onToggleIndexFundFilter={() => setIsIndexFundFiltered((prev) => !prev)}
                        isStockFundFiltered={isStockFundFiltered}
                        onToggleStockFundFilter={() => setIsStockFundFiltered((prev) => !prev)}
                    />

                    {/* 分页控件 - 当显示收藏列表时隐藏 */}
                    {!showFavoriteList && !showMonitorList && (
                        <div className="mt-6 flex justify-center">
                            <Pagination
                                current={pagination.page}
                                pageSize={pagination.limit}
                                total={pagination.total}
                                onChange={handlePageChange}
                                onShowSizeChange={(current, size) => {
                                    handleLimitChangeForComponent(size.toString());
                                }}
                                showSizeChanger
                                pageSizeOptions={['10', '20', '50', '100']}
                                showTotal={(total) => `共 ${total} 条记录`}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
