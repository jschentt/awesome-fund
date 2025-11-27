import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, Bell, Check, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Button, Input, Empty, Tooltip, Modal, message, Pagination } from 'antd';
import dayjs from 'dayjs';

// 导入FundItem接口
import { FundItem } from './fund-list';

interface FavoriteFundListProps {
    email: string;
    onFundClick?: (fundCode: string) => void;
    refreshFavoriteList?: () => void;
}

// 收藏基金API返回的数据结构
interface FavoriteFundResponse {
    message: string;
    data: {
        data: {
            id: string;
            code: string;
            name: string;
            shortName: string;
            type: string;
            netWorth: number;
            expectWorth: number;
            totalNetWorth: number;
            expectGrowth: number;
            actualDayGrowth: number;
            estimatedChange: number;
            netWorthDate: string;
            expectWorthDate: string;
            weeklyGrowth: number;
            monthlyGrowth: number;
            threeMonthsGrowth: number;
            sixMonthsGrowth: number;
            annualGrowth: number;
            manager: string;
            fundScale: string;
            minBuyAmount: number;
            originalBuyRate: number;
            currentBuyRate: number;
            establishDate: string;
            description: string;
            netWorthData?: [string, string, string, string][];
        };
        favorite_at: string;
    }[];
    total?: number;
}

export default function FavoriteFundList({
    email,
    onFundClick,
    refreshFavoriteList,
}: FavoriteFundListProps) {
    // 状态管理
    const [funds, setFunds] = useState<FundItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFund, setSelectedFund] = useState<FundItem | null>(null);
    const [notificationModalOpen, setNotificationModalOpen] = useState(false);
    const [favoriteModalOpen, setFavoriteModalOpen] = useState(false);
    const [selectedMethods, setSelectedMethods] = useState({
        dingtalk: false,
        wechat: false,
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalFunds, setTotalFunds] = useState(0);

    // 映射API返回数据到FundItem接口
    const mapApiDataToFundItem = useCallback(
        (apiData: FavoriteFundResponse['data'][0]): FundItem => {
            const fund = apiData.data;
            return {
                id: fund.id,
                code: fund.code,
                name: fund.name,
                shortName: fund.shortName,
                type: fund.type,
                netWorth: fund.netWorth,
                expectWorth: fund.expectWorth,
                expectGrowth: fund.expectGrowth,
                estimatedChange: fund.estimatedChange,
                netWorthDate: fund.netWorthDate,
                expectWorthDate: fund.expectWorthDate,
                description: fund.description,
                // 转换为FundItem需要的字段格式
                currentValue: fund.netWorth?.toString() || 'N/A',
                dailyChange: fund.actualDayGrowth?.toString() || 'N/A',
                changePercent: fund.actualDayGrowth?.toFixed(2) + '%' || 'N/A',
                isMonitoring: false, // 默认值，后续可以从其他API获取
                isFavorite: true, // 收藏列表中的基金一定是已收藏的
                updateTime: fund.netWorthDate || new Date().toISOString(),
                status: '打开', // 默认状态
            };
        },
        [],
    );

    // 加载收藏基金列表
    const loadFavoriteFunds = useCallback(
        async (page: number = 1) => {
            if (!email) return;

            setLoading(true);
            try {
                const res = await fetch(
                    `/api/funds/favorite/list?email=${encodeURIComponent(email)}&page=${page}&pageSize=${pageSize}`,
                );

                if (res.ok) {
                    const data: FavoriteFundResponse = await res.json();

                    console.log('API返回数据:', data);

                    if (data.data && Array.isArray(data.data)) {
                        // 映射数据格式
                        const mappedFunds = data.data.map(mapApiDataToFundItem);
                        setFunds(mappedFunds);

                        // 设置总数（如果API返回）
                        if (data.total) {
                            setTotalFunds(data.total);
                        } else {
                            // 如果API没有返回总数，使用实际数据长度
                            setTotalFunds(data.data.length);
                        }
                    }
                } else {
                    console.error('Failed to fetch favorite funds');
                    Modal.error({
                        title: '获取收藏列表失败',
                        content: '请稍后重试',
                    });
                }
            } catch (error) {
                console.error('Error fetching favorite funds:', error);
                Modal.error({
                    title: '获取收藏列表失败',
                    content: '网络错误，请检查网络连接后重试',
                });
            } finally {
                setLoading(false);
            }
        },
        [email, pageSize, mapApiDataToFundItem],
    );

    // 组件挂载时和email变化时加载数据
    useEffect(() => {
        loadFavoriteFunds(1);
        setCurrentPage(1);
    }, [email, loadFavoriteFunds]);

    // 处理分页变化
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        loadFavoriteFunds(page);
    };

    // 处理搜索
    const handleSearch = () => {
        // 当搜索框清空时，重新加载所有收藏数据
        if (!searchQuery.trim()) {
            loadFavoriteFunds(1);
            setCurrentPage(1);
            return;
        }

        // 实际应用中可能需要调用搜索API
        // 这里简化为客户端过滤
        const filtered = funds.filter(
            (fund) =>
                fund.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                fund.code.toLowerCase().includes(searchQuery.toLowerCase()),
        );
        setFunds(filtered);
    };

    // 处理收藏操作（从收藏列表移除）
    const handleToggleFavorite = async (fund: FundItem) => {
        const endpoint = `/api/funds/favorite`;

        // 调用API
        const response = await fetch(endpoint, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fundCode: fund.code, email }),
        });

        // 检查响应状态
        if (!response.ok) {
            throw new Error(`API调用失败: ${response.statusText}`);
        }

        setFunds((prev) => prev.filter((item) => item.code !== fund.code));

        message.success('已从收藏中移除');
        // 刷新收藏列表
        if (refreshFavoriteList) {
            refreshFavoriteList();
        }
    };

    // 确认从收藏中移除
    const handleConfirmRemoveFromFavorite = async () => {
        if (!selectedFund || !email) return;

        setLoading(true);
        try {
            const res = await fetch('/api/funds/favorite', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    fund_code: selectedFund.code,
                }),
            });

            if (res.ok) {
                message.success('已从收藏中移除');
                // 重新加载当前页的数据
                loadFavoriteFunds(currentPage);
            } else {
                message.error('移除收藏失败');
            }
        } catch (error) {
            console.error('Error removing favorite:', error);
            message.error('移除收藏失败，请稍后重试');
        } finally {
            setLoading(false);
            setFavoriteModalOpen(false);
        }
    };

    // 处理基金点击
    const handleFundClick = (fund: FundItem) => {
        if (onFundClick) {
            onFundClick(fund.code);
        } else {
            // 默认跳转到基金详情页
            window.location.href = `/fund/${fund.code}`;
        }
    };

    // 处理监控设置
    const handleSetMonitoring = (fund: FundItem) => {
        setSelectedFund(fund);
        setNotificationModalOpen(true);
    };

    // 处理推送方式选择
    const handleMethodChange = (method: 'dingtalk' | 'wechat') => {
        setSelectedMethods((prev) => ({
            ...prev,
            [method]: !prev[method],
        }));
    };

    // 确认监控设置
    const handleConfirmMonitoring = () => {
        // 实际应用中需要调用API设置监控
        message.success('监控设置成功');
        setNotificationModalOpen(false);
        // 重置选择的方法
        setSelectedMethods({ dingtalk: false, wechat: false });
    };

    // 格式化日期
    const formatDate = (dateString: string) => {
        return dayjs(dateString).format('YYYY-MM-DD');
    };

    // 计算涨跌幅样式
    const getChangeStyle = (changePercent: string) => {
        const change = parseFloat(changePercent);
        if (isNaN(change)) return { color: '#666' };

        if (change > 0) {
            return { color: '#ff4d4f' };
        } else if (change < 0) {
            return { color: '#52c41a' };
        }
        return { color: '#666' };
    };

    return (
        <div className="w-full">
            {/* 搜索和筛选区域 */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
                <div className="relative w-full sm:w-64">
                    <Input
                        placeholder="搜索基金名称或代码"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onPressEnter={handleSearch}
                        prefix={<Search className="w-4 h-4 text-gray-400" />}
                        className="w-full"
                    />
                </div>
                <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                    onClick={handleSearch}
                >
                    搜索
                </Button>
            </div>

            {/* 基金列表 */}
            {loading ? (
                <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
                </div>
            ) : funds.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                >
                    <div className="bg-gray-100 rounded-full p-4 mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">未找到基金</h3>
                    <p className="text-gray-500 max-w-md">
                        请尝试调整搜索条件或选择其他标签页查看基金列表
                    </p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {funds.map((fund, index) => (
                        <motion.div
                            key={fund.code}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{
                                duration: 0.5,
                                delay: index * 0.1,
                            }}
                            whileHover={{ y: -5 }}
                            className="overflow-hidden border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow duration-300 relative group"
                            onClick={() => handleFundClick(fund)}
                        >
                            <div className="p-5">
                                {/* 基金头部信息 */}
                                <div className="flex justify-between items-start w-full mb-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <span className="text-base font-semibold text-gray-900">
                                                {fund.code}
                                            </span>
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${fund.status === '打开' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                                            >
                                                {fund.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                                                {fund.name}
                                            </h3>
                                            {fund.type && (
                                                <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                                    {fund.type}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <Tooltip title="已收藏">
                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    </Tooltip>
                                </div>

                                {/* 基金净值信息 */}
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">当日净值</div>
                                        <div className="text-lg font-semibold text-gray-900">
                                            {fund.currentValue}
                                        </div>
                                        {fund.netWorthDate && (
                                            <div className="text-xs text-gray-400">
                                                {fund.netWorthDate}
                                            </div>
                                        )}
                                    </div>

                                    {fund.expectWorth && (
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">
                                                预估净值
                                            </div>
                                            <div className="text-lg font-semibold text-gray-900">
                                                {fund.expectWorth}
                                            </div>
                                            {fund.expectWorthDate && (
                                                <div className="text-xs text-gray-400 whitespace-nowrap">
                                                    {fund.expectWorthDate}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* 日涨跌信息 */}
                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">日涨跌</div>
                                        <div
                                            className="text-base font-semibold"
                                            style={{
                                                color:
                                                    fund.expectWorth && fund.currentValue
                                                        ? fund.expectWorth -
                                                              parseFloat(fund.currentValue) >
                                                          0
                                                            ? 'rgb(220 38 38)' // text-red-600
                                                            : 'rgb(22 163 74)' // text-green-600
                                                        : 'rgb(22 163 74)',
                                            }}
                                        >
                                            {fund.expectWorth && fund.currentValue
                                                ? `${fund.expectWorth - parseFloat(fund.currentValue) > 0 ? '+' : ''}${(fund.expectWorth - parseFloat(fund.currentValue)).toFixed(4)}`
                                                : '--'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">涨跌幅</div>
                                        <div
                                            className="text-base font-semibold"
                                            style={{
                                                color:
                                                    fund.expectWorth && fund.currentValue
                                                        ? fund.expectWorth -
                                                              parseFloat(fund.currentValue) >
                                                          0
                                                            ? 'rgb(220 38 38)' // text-red-600
                                                            : 'rgb(22 163 74)' // text-green-600
                                                        : 'rgb(22 163 74)',
                                            }}
                                        >
                                            {fund.expectWorth &&
                                            fund.currentValue &&
                                            parseFloat(fund.currentValue) > 0
                                                ? `${fund.expectWorth - parseFloat(fund.currentValue) > 0 ? '+' : ''}${(((fund.expectWorth - parseFloat(fund.currentValue)) / parseFloat(fund.currentValue)) * 100).toFixed(2)}%`
                                                : '--'}
                                        </div>
                                    </div>
                                </div>

                                {/* 更新时间 */}
                                <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                                    更新时间: {formatDate(fund.updateTime)}
                                </div>

                                {/* 操作按钮区域 */}
                                <div className="flex justify-end space-x-2 mt-3">
                                    <Button
                                        size="small"
                                        className="border border-blue-200 text-blue-600 hover:bg-blue-50"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSetMonitoring(fund);
                                        }}
                                    >
                                        <Bell className="w-4 h-4 mr-1" />
                                        监控
                                    </Button>
                                    <Button
                                        size="small"
                                        className="border border-red-200 text-red-600 hover:bg-red-50"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleFavorite(fund);
                                        }}
                                    >
                                        <Star className="w-4 h-4 mr-1" />
                                        取消收藏
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* 分页控件 */}
            {totalFunds > pageSize && (
                <div className="flex justify-center mt-8">
                    <Pagination
                        current={currentPage}
                        onChange={handlePageChange}
                        total={totalFunds}
                        pageSize={pageSize}
                        showSizeChanger={false}
                        showQuickJumper
                        showTotal={(total) => `共 ${total} 条记录`}
                    />
                </div>
            )}

            {/* 监控设置模态框 */}
            <AnimatePresence>
                {notificationModalOpen && selectedFund && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setNotificationModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-lg shadow-xl p-6 sm:max-w-md w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div>
                                <h3 className="flex items-center space-x-2 text-xl font-semibold text-gray-900 mb-4">
                                    <Bell className="w-5 h-5 text-blue-600" />
                                    <span>设置监控通知</span>
                                </h3>
                            </div>
                            <div className="py-4">
                                <p className="text-gray-600 mb-4">
                                    为 {selectedFund.name} 设置消息推送方式
                                </p>

                                <div className="space-y-4">
                                    <div
                                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${selectedMethods.dingtalk ? 'border-blue-200 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                                        onClick={() => handleMethodChange('dingtalk')}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-blue-50 rounded-full">
                                                <svg
                                                    className="w-5 h-5 text-blue-600"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                                    />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-medium">钉钉推送</p>
                                                <p className="text-sm text-gray-500">
                                                    通过钉钉接收基金动态通知
                                                </p>
                                            </div>
                                        </div>
                                        <div
                                            className={`w-5 h-5 rounded border flex items-center justify-center ${selectedMethods.dingtalk ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}
                                        >
                                            {selectedMethods.dingtalk && (
                                                <Check className="w-3 h-3 text-white" />
                                            )}
                                        </div>
                                    </div>

                                    <div
                                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${selectedMethods.wechat ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}
                                        onClick={() => handleMethodChange('wechat')}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-green-50 rounded-full">
                                                <svg
                                                    className="w-5 h-5 text-green-600"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                                    />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-medium">微信推送</p>
                                                <p className="text-sm text-gray-500">
                                                    通过微信接收基金动态通知
                                                </p>
                                            </div>
                                        </div>
                                        <div
                                            className={`w-5 h-5 rounded border flex items-center justify-center ${selectedMethods.wechat ? 'border-green-600 bg-green-600' : 'border-gray-300'}`}
                                        >
                                            {selectedMethods.wechat && (
                                                <Check className="w-3 h-3 text-white" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {(selectedMethods.dingtalk || selectedMethods.wechat) === false && (
                                    <p className="mt-4 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                                        请至少选择一种推送方式
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                                <Button
                                    className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-none"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setNotificationModalOpen(false);
                                    }}
                                >
                                    取消
                                </Button>
                                <Button
                                    className={`${(selectedMethods.dingtalk || selectedMethods.wechat) === false ? 'bg-blue-100 text-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleConfirmMonitoring();
                                    }}
                                    disabled={
                                        (selectedMethods.dingtalk || selectedMethods.wechat) ===
                                        false
                                    }
                                >
                                    确认监控
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 取消收藏确认模态框 */}
            <AnimatePresence>
                {favoriteModalOpen && selectedFund && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setFavoriteModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-lg shadow-xl p-6 sm:max-w-md w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div>
                                <h3 className="flex items-center space-x-2 text-xl font-semibold text-gray-900 mb-4">
                                    <Star className="w-5 h-5 text-yellow-500" />
                                    <span>取消收藏</span>
                                </h3>
                            </div>
                            <div className="py-4">
                                <p className="text-gray-600 mb-2">
                                    确定要将 {selectedFund.name} 从收藏中移除吗？
                                </p>
                                <p className="text-sm text-gray-500">移除后可重新添加到收藏列表</p>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                                <Button
                                    className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-none"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFavoriteModalOpen(false);
                                    }}
                                >
                                    取消
                                </Button>
                                <Button
                                    className="bg-red-500 hover:bg-red-600 text-white"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleConfirmRemoveFromFavorite();
                                    }}
                                >
                                    确认移除
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
