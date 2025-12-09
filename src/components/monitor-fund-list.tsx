import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, QrCode, Settings } from 'lucide-react';
import { Button, Input, Tooltip, Modal, message, Pagination, Drawer } from 'antd';
import dayjs from 'dayjs';
import Image from 'next/image';
import { FundItem } from './fund-list';
import { useAuth } from '@/app/providers/auth-provider';
import MonitoringSettingsModal from './monitoring-settings-modal';

interface MonitorFundListProps {
    onFundClick?: (fundCode: string) => void;
    refreshMonitorList?: () => void;
    visible?: boolean;
    userId: string;
}

// 监控基金API返回的数据结构
interface MonitorFundResponse {
    message: string;
    data: {
        data: {
            isMonitoring: boolean;
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
            monthGrowth: number;
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
        monitor_at: string;
    }[];
    total?: number;
}

export default function MonitorFundList({
    userId,
    onFundClick,
    refreshMonitorList,
    visible = false,
}: MonitorFundListProps) {
    // 状态管理
    const [funds, setFunds] = useState<FundItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFund, setSelectedFund] = useState<FundItem | null>(null);
    const [monitorModalOpen, setMonitorModalOpen] = useState(false);
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalFunds, setTotalFunds] = useState(0);
    const hasLoaded = useRef(true);
    const { vipInfo } = useAuth();

    // 映射API返回数据到FundItem接口
    const mapApiDataToFundItem = useCallback(
        (apiData: MonitorFundResponse['data'][0]): FundItem => {
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

    // 加载监控基金列表
    const loadMonitorFunds = useCallback(
        async (page: number = 1) => {
            if (!userId) return;

            setLoading(true);
            try {
                const res = await fetch(
                    `/api/funds/monitor/list?page=${page}&pageSize=${pageSize}`,
                    {
                        headers: {
                            'X-User-Id': userId,
                        },
                    },
                );

                if (res.ok) {
                    const data: MonitorFundResponse = await res.json();

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
                    console.error('Failed to fetch monitor funds');
                    Modal.error({
                        title: '获取监控列表失败',
                        content: '请稍后重试',
                    });
                }
            } catch (error) {
                console.error('Error fetching monitor funds:', error);
                Modal.error({
                    title: '获取监控列表失败',
                    content: '网络错误，请检查网络连接后重试',
                });
            } finally {
                setLoading(false);
            }
        },
        [pageSize, mapApiDataToFundItem],
    );

    // 组件挂载时和email变化时加载数据
    useEffect(() => {
        // 只有当visible为true且数据尚未加载过时才加载
        if (visible && userId) {
            if (hasLoaded.current) {
                loadMonitorFunds(1);
                setCurrentPage(1);
                hasLoaded.current = false;
            }
        }
        // 当visible变为false时，可以重置加载状态
        if (!visible) {
            hasLoaded.current = true;
        }
    }, [visible, userId]);

    // 处理分页变化
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        loadMonitorFunds(page);
    };

    // 处理搜索
    const handleSearch = () => {
        // 当搜索框清空时，重新加载所有监控数据
        if (!searchQuery.trim()) {
            loadMonitorFunds(1);
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

    // 处理监控操作（从监控列表移除）
    const handleToggleMonitor = async (fund: FundItem) => {
        const endpoint = `/api/funds/monitor`;

        // 调用API
        const response = await fetch(endpoint, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': userId,
            },
            body: JSON.stringify({ fundCode: fund.code }),
        });

        // 检查响应状态
        if (!response.ok) {
            throw new Error(`API调用失败: ${response.statusText}`);
        }

        setFunds((prev) => prev.filter((item) => item.code !== fund.code));

        message.success('已从监控中移除');
        // 刷新监控列表
        if (refreshMonitorList) {
            refreshMonitorList();
        }
    };

    // 确认从监控中移除
    const handleConfirmRemoveFromMonitor = async () => {
        if (!selectedFund || !userId) return;

        try {
            await handleToggleMonitor(selectedFund);
        } catch (error) {
            console.error('Error removing monitor:', error);
            message.error('移除监控失败，请稍后重试');
        } finally {
            setMonitorModalOpen(false);
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

    // 格式化日期
    const formatDate = (dateString: string) => {
        return dayjs(dateString).format('YYYY-MM-DD');
    };

    // 鼠标悬停显示二维码状态
    const [showQrCode, setShowQrCode] = useState(false);

    // 按钮拖拽功能
    const buttonRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [offsetY, setOffsetY] = useState(0);

    // 鼠标按下事件
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (buttonRef.current) {
            setIsDragging(true);
            const rect = buttonRef.current.getBoundingClientRect();
            setOffsetY(e.clientY - rect.top);
        }
    };

    // 鼠标移动事件
    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !buttonRef.current) return;

        // 计算新的垂直位置
        const newTop = e.clientY - offsetY;
        // 限制在窗口范围内
        const windowHeight = window.innerHeight;
        const buttonHeight = buttonRef.current.offsetHeight;
        const maxTop = windowHeight - buttonHeight - 16; // 16px 底部边距
        const minTop = 16; // 16px 顶部边距
        const clampedTop = Math.max(minTop, Math.min(newTop, maxTop));

        // 设置新位置
        if (buttonRef.current) {
            buttonRef.current.style.top = `${clampedTop}px`;
            buttonRef.current.style.bottom = 'auto';
        }
    };

    // 鼠标释放事件
    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // 添加全局事件监听
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div className="w-full">
            {/* 右侧可拖拽的钉钉群组按钮 */}
            <div
                ref={buttonRef}
                className="fixed right-4 top-50 z-50 cursor-move"
                onMouseDown={handleMouseDown}
                style={{ touchAction: 'none' }}
            >
                <Button
                    type="primary"
                    size="large"
                    icon={<QrCode />}
                    className="shadow-lg rounded-full px-6 absolute right-0"
                    onClick={() => setShowQrCode(true)}
                >
                    钉钉群组
                </Button>
            </div>

            {/* 侧边弹窗 Drawer */}
            <Drawer
                title="钉钉群组二维码"
                placement="right"
                width={320}
                open={showQrCode}
                onClose={() => setShowQrCode(false)}
                footer={
                    <div className="text-center text-xs text-gray-400">
                        扫码加入钉钉群组，获取监控提醒
                    </div>
                }
            >
                <div className="flex flex-col items-center text-center">
                    <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                        {vipInfo?.plan_code === 'year' ? (
                            <span>
                                当前您为<span className="font-bold text-yellow-600">年度</span>
                                会员， 扫码加入专属一对一
                                <span className="font-bold text-blue-600">VIP</span>
                                钉钉群组，获取实时监控提醒、专业基金分析与独家策略
                            </span>
                        ) : vipInfo?.plan_code === 'month' ? (
                            <span>
                                当前您为<span className="font-bold text-blue-600">月度</span>会员，
                                扫码加入专属一对一
                                <span className="font-bold text-blue-600">VIP</span>
                                钉钉群组，获取实时监控提醒、专业基金分析与独家策略
                            </span>
                        ) : (
                            <span>
                                当前您为<span className="font-bold text-green-600">免费</span>会员，
                                扫码加入<span className="font-bold text-green-600">免费</span>
                                钉钉群组，获取基础监控提醒
                            </span>
                        )}
                    </p>
                    <div className="w-48 h-48 bg-gray-50 rounded-md flex items-center justify-center mb-4 overflow-hidden border border-gray-100">
                        {/* 使用 Next.js Image 组件加载二维码图片 */}
                        {vipInfo?.qr_code_url && (
                            <Image
                                src={vipInfo?.qr_code_url}
                                alt="钉钉群组二维码"
                                width={192}
                                height={192}
                                className="object-contain p-2"
                                // 如果图片不存在，会显示默认的占位符
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    // 使用原生 DOM 方法创建和添加元素
                                    const placeholderDiv = document.createElement('div');
                                    placeholderDiv.className = 'text-gray-500 text-sm';
                                    placeholderDiv.textContent = '请上传钉钉群组二维码图片';
                                    target.parentElement?.appendChild(placeholderDiv);
                                }}
                            />
                        )}
                    </div>

                    {/* 会员权益对比 */}
                    <div className="w-full space-y-3">
                        <div className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-gray-800">免费版</span>
                                <span className="text-xs text-gray-500">永久</span>
                            </div>
                            <ul className="text-xs text-gray-600 space-y-1">
                                <li>• 最多监控3只基金</li>
                                <li>• 基本涨跌提醒</li>
                                <li>• 每日更新一次</li>
                            </ul>
                        </div>

                        <div className="border border-blue-200 rounded-lg p-3 bg-blue-50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-blue-800">
                                    月度会员
                                </span>
                                <span className="text-xs text-blue-700">¥9.9/月</span>
                            </div>
                            <ul className="text-xs text-blue-700 space-y-1">
                                <li>• 无限基金监控</li>
                                <li>• 实时涨跌提醒</li>
                                <li>• 每日更新多次</li>
                                <li>• 优先技术支持</li>
                            </ul>
                        </div>

                        <div className="border border-yellow-200 rounded-lg p-3 bg-yellow-50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-yellow-800">
                                    年度会员
                                </span>
                                <span className="text-xs text-yellow-700">¥99/年</span>
                            </div>
                            <ul className="text-xs text-yellow-700 space-y-1">
                                <li>• 无限基金监控</li>
                                <li>• 实时涨跌提醒</li>
                                <li>• 每日更新多次</li>
                                <li>• 优先技术支持</li>
                                <li>• 专属客服</li>
                            </ul>
                            <div className="mt-2 text-xs text-yellow-600 font-medium">
                                立省19.8元
                            </div>
                        </div>
                    </div>
                </div>
            </Drawer>
            {/* 搜索和筛选区域 */}
            <div className="flex flex-col sm:flex-row items-Bellt sm:items-center mb-4 space-y-2 sm:space-y-0">
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
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto ml-5"
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
                                <div className="flex justify-between items-Bellt w-full mb-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <span className="text-base font-semibold text-gray-900">
                                                {fund.code}
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
                                    <Tooltip title="已监控">
                                        <Bell className="w-4 h-4 text-blue-600" />
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
                                            setSettingsModalOpen(true);
                                            setSelectedFund(fund);
                                        }}
                                    >
                                        <Settings className="w-4 h-4 mr-1" />
                                        设置
                                    </Button>
                                    <Button
                                        size="small"
                                        className="border border-red-200 text-red-600 hover:bg-red-50"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setMonitorModalOpen(true);
                                            setSelectedFund(fund);
                                        }}
                                    >
                                        <Bell className="w-4 h-4 mr-1" />
                                        取消监控
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

            {/* 取消监控确认模态框 */}
            <AnimatePresence>
                {monitorModalOpen && selectedFund && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setMonitorModalOpen(false)}
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
                                    <Bell className="w-5 h-5 text-yellow-500" />
                                    <span>取消监控</span>
                                </h3>
                            </div>
                            <div className="py-4">
                                <p className="text-gray-600 mb-2">
                                    确定要将 {selectedFund.name} 从监控中移除吗？
                                </p>
                                <p className="text-sm text-gray-500">移除后可重新添加到监控列表</p>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                                <Button
                                    className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-none"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setMonitorModalOpen(false);
                                    }}
                                >
                                    取消
                                </Button>
                                <Button
                                    className="bg-red-500 hover:bg-red-600 text-white"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleConfirmRemoveFromMonitor();
                                    }}
                                >
                                    确认移除
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 监控设置模态框 */}
            {selectedFund && (
                <MonitoringSettingsModal
                    open={settingsModalOpen}
                    onClose={() => setSettingsModalOpen(false)}
                    fundName={selectedFund.name}
                />
            )}
        </div>
    );
}
