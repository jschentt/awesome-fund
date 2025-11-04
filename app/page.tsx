'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Eye, EyeOff, Settings, Bell } from 'lucide-react';
import Navbar from '@/components/navbar';
import { Button, Input, Badge, Switch, Checkbox } from '@heroui/react';

interface FundItem {
    code: string;
    name: string;
    currentValue: string;
    accumulatedValue: string;
    dailyChange: string;
    changePercent: string;
    isMonitoring: boolean;
    updateTime: string;
    status: string;
}

export default function Page() {
    const [funds, setFunds] = useState<FundItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc' | 'none'>('none');

    // 从API获取基金列表
    useEffect(() => {
        async function fetchFunds() {
            try {
                const response = await fetch('/api/funds');
                if (response.ok) {
                    const data = await response.json();
                    setFunds(data);
                }
            } catch (error) {
                console.error('获取基金列表失败:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchFunds();
    }, []);

    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all' or 'monitoring'
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4; // Show 4 funds per page
    const [notificationModalOpen, setNotificationModalOpen] = useState(false);
    const [selectedFund, setSelectedFund] = useState<FundItem | null>(null);
    const [selectedMethods, setSelectedMethods] = useState({ dingtalk: false, wechat: false });

    const toggleMonitoring = (code: string) => {
        setFunds(
            funds.map((fund) =>
                fund.code === code ? { ...fund, isMonitoring: !fund.isMonitoring } : fund,
            ),
        );
    };

    const filteredFunds = funds.filter((fund) => {
        const matchesSearch = fund.name.includes(searchTerm) || fund.code.includes(searchTerm);
        const matchesTab = activeTab === 'all' || (activeTab === 'monitoring' && fund.isMonitoring);
        return matchesSearch && matchesTab;
    });

    // 排序逻辑
    const sortedFunds = [...filteredFunds].sort((a, b) => {
        if (sortOrder === 'none') return 0;

        // 从涨跌幅字符串中提取数字值
        const parseChangePercent = (str: string) => {
            return parseFloat(str.replace('%', ''));
        };

        const aValue = parseChangePercent(a.changePercent);
        const bValue = parseChangePercent(b.changePercent);

        return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    // Pagination calculations
    const totalPages = Math.ceil(sortedFunds.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentFunds = sortedFunds.slice(startIndex, endIndex);

    // Reset to first page when filters change
    const handleTabChange = (tab: 'all' | 'monitoring') => {
        setActiveTab(tab);
        setCurrentPage(1);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    // 处理排序切换
    const handleSortChange = () => {
        // 循环切换排序状态: none -> desc -> asc -> none
        if (sortOrder === 'none') {
            setSortOrder('desc');
        } else if (sortOrder === 'desc') {
            setSortOrder('asc');
        } else {
            setSortOrder('none');
        }
        setCurrentPage(1); // 排序后重置到第一页
    };

    const handleSettingsClick = (fund: FundItem) => {
        setSelectedFund(fund);
        setSelectedMethods({ dingtalk: false, wechat: false });
        setNotificationModalOpen(true);
    };

    const handleConfirmMonitoring = () => {
        if (selectedMethods.dingtalk || selectedMethods.wechat) {
            console.log('设置监控:', {
                fundName: selectedFund?.name,
                selectedMethods,
            });
            setNotificationModalOpen(false);
        }
    };

    const handleMethodChange = (method: 'dingtalk' | 'wechat') => {
        setSelectedMethods((prev) => ({ ...prev, [method]: !prev[method] }));
    };

    const totalFunds = funds.length;
    const monitoringFunds = funds.filter((f) => f.isMonitoring).length;

    return (
        <div className="min-h-screen bg-gray-50" data-oid="e38gb.n">
            {/* 使用完整的导航栏组件 */}
            <Navbar />
            {/* 主要内容 */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0 mb-6">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900" data-oid="up9q76g">
                        基金管理
                    </h1>
                    <div
                        className="flex items-center justify-end space-x-3 sm:space-x-4"
                        data-oid="k3fhp1l"
                    >
                        <span className="text-xs sm:text-sm text-gray-500" data-oid="1gr45uk">
                            总数量: {totalFunds}
                        </span>
                    </div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6" data-oid="denm-p5">
                {/* Subtitle */}
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6" data-oid="rem0.x2">
                    共 {totalFunds} 只基金 · 实时查看基金净值与涨跌情况
                </p>

                {/* Stats and Search */}
                <div
                    className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0 mb-6"
                    data-oid="3urw3uc"
                >
                    {/* Stats Tabs */}
                    <div className="bg-white border rounded-lg p-1">
                        <div className="flex flex-col sm:flex-row">
                            <Button
                                variant={activeTab === 'all' ? 'solid' : 'ghost'}
                                className={`flex items-center space-x-2 px-3 py-2 w-full sm:w-auto ${activeTab === 'all' ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}
                                onClick={() => handleTabChange('all')}
                            >
                                <span className="text-sm">全部基金</span>
                                <Badge
                                    variant="flat"
                                    className={
                                        activeTab === 'all' ? 'bg-blue-100 text-blue-700' : ''
                                    }
                                >
                                    {totalFunds}
                                </Badge>
                            </Button>
                            <Button
                                variant={activeTab === 'monitoring' ? 'solid' : 'ghost'}
                                className={`flex items-center space-x-2 px-3 py-2 w-full sm:w-auto ${activeTab === 'monitoring' ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}
                                onClick={() => handleTabChange('monitoring')}
                            >
                                <Eye className="w-3 h-3" />
                                <span className="text-sm">我的监控</span>
                                <Badge
                                    variant="flat"
                                    className={
                                        activeTab === 'monitoring'
                                            ? 'bg-blue-100 text-blue-700'
                                            : ''
                                    }
                                >
                                    {monitoringFunds}
                                </Badge>
                            </Button>
                        </div>
                    </div>

                    {/* Search Controls */}
                    <div
                        className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4"
                        data-oid="f004op4"
                    >
                        <Input
                            type="text"
                            placeholder="搜索基金代码或名称..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            startContent={<Search className="w-4 h-4 text-gray-400" />}
                            className="w-full sm:w-64"
                        />
                        <Button
                            onClick={() => handleSortChange()}
                            variant={sortOrder === 'none' ? 'ghost' : 'solid'}
                            className={
                                sortOrder === 'none'
                                    ? ''
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                            }
                        >
                            <span>按涨跌幅排序</span>
                            {sortOrder === 'desc' && <span className="ml-1">↓</span>}
                            {sortOrder === 'asc' && <span className="ml-1">↑</span>}
                        </Button>
                        <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
                            添加自选到列表
                        </Button>
                    </div>
                </div>

                {/* Fund Cards Grid */}
                <div
                    className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6"
                    data-oid="tyj8xkz"
                >
                    {currentFunds.map((fund) => (
                        <div
                            key={fund.code}
                            className="overflow-hidden border rounded-lg bg-white shadow-sm"
                        >
                            <div className="p-4 pb-2">
                                <div className="flex justify-between items-start w-full">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <span className="text-base font-semibold text-gray-900 truncate">
                                                {fund.code}
                                            </span>
                                            <Badge
                                                className={
                                                    fund.status === '打开'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : fund.status === '暂停'
                                                          ? 'bg-green-100 text-green-700'
                                                          : 'bg-gray-100 text-gray-700'
                                                }
                                            >
                                                {fund.status}
                                            </Badge>
                                        </div>
                                        <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                                            {fund.name}
                                        </h3>
                                    </div>
                                    <div className="flex space-x-1 ml-2">
                                        <Button
                                            variant="flat"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleMonitoring(fund.code);
                                            }}
                                            className={fund.isMonitoring ? 'text-blue-600' : ''}
                                        >
                                            {fund.isMonitoring ? (
                                                <Eye className="w-5 h-5" />
                                            ) : (
                                                <EyeOff className="w-5 h-5" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="flat"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSettingsClick(fund);
                                            }}
                                            aria-label="设置监控"
                                        >
                                            <Settings className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 pt-0">
                                {/* Fund Values */}
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">当日净值</div>
                                        <div className="text-lg font-semibold text-gray-900">
                                            {fund.currentValue}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">累计净值</div>
                                        <div className="text-lg font-semibold text-gray-900">
                                            {fund.accumulatedValue}
                                        </div>
                                    </div>
                                </div>

                                {/* Daily Change */}
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">日涨跌</div>
                                        <div
                                            className={`text-base font-semibold ${fund.dailyChange.startsWith('+') ? 'text-red-600' : 'text-green-600'}`}
                                        >
                                            {fund.dailyChange}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">涨跌幅</div>
                                        <div
                                            className={`text-base font-semibold ${fund.changePercent.startsWith('+') ? 'text-red-600' : 'text-green-600'}`}
                                        >
                                            {fund.changePercent}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 pt-0 text-xs text-gray-400 border-t">
                                更新时间: {fund.updateTime}
                            </div>
                            <Link
                                href={`/fund/${fund.code}`}
                                className="absolute inset-0 z-10"
                                aria-hidden="true"
                            />
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div
                        className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-2"
                        data-oid="yak5ccg"
                    >
                        <Button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            variant="ghost"
                            className="w-full sm:w-auto"
                        >
                            上一页
                        </Button>

                        <div
                            className="flex space-x-1 overflow-x-auto pb-2 sm:pb-0"
                            data-oid="6.sks9v"
                        >
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    variant={currentPage === page ? 'solid' : 'ghost'}
                                    size="sm"
                                    className={currentPage === page ? 'bg-blue-600' : ''}
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>

                        <Button
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            variant="ghost"
                            className="w-full sm:w-auto"
                        >
                            下一页
                        </Button>
                    </div>
                )}

                {/* Results Info */}
                <div
                    className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-500 px-4"
                    data-oid="fc0t_5r"
                >
                    显示 {startIndex + 1}-{Math.min(endIndex, sortedFunds.length)} 条，共{' '}
                    {sortedFunds.length} 条结果
                    {activeTab === 'monitoring' && ` (监控中: ${monitoringFunds} 只)`}
                </div>
            </div>

            {/* Notification Modal */}
            <div
                className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${notificationModalOpen ? 'block' : 'hidden'}`}
                onClick={() => setNotificationModalOpen(false)}
            >
                <div
                    className="bg-white rounded-lg shadow-lg p-6 sm:max-w-md"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div>
                        <h3 className="flex items-center space-x-2 text-xl font-semibold">
                            <Bell className="w-5 h-5 text-blue-600" />
                            <span>设置监控通知</span>
                        </h3>
                    </div>
                    <div className="py-4">
                        <p className="text-gray-600 mb-4">
                            为 {selectedFund?.name} 设置消息推送方式
                        </p>

                        <div className="space-y-4">
                            <Checkbox
                                id="dingtalk"
                                checked={selectedMethods.dingtalk}
                                onValueChange={(checked: boolean) => handleMethodChange('dingtalk')}
                                className="flex items-center justify-between"
                            >
                                <div className="flex items-center space-x-2">
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
                            </Checkbox>

                            <Checkbox
                                id="wechat"
                                checked={selectedMethods.wechat}
                                onValueChange={(checked: boolean) => handleMethodChange('wechat')}
                                className="flex items-center justify-between"
                            >
                                <div className="flex items-center space-x-2">
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
                            </Checkbox>
                        </div>

                        {(selectedMethods.dingtalk || selectedMethods.wechat) === false && (
                            <p className="mt-4 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                                请至少选择一种推送方式
                            </p>
                        )}
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button
                            variant="ghost"
                            onClick={(e) => {
                                e.stopPropagation();
                                setNotificationModalOpen(false);
                            }}
                        >
                            取消
                        </Button>
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleConfirmMonitoring();
                            }}
                            disabled={
                                (selectedMethods.dingtalk || selectedMethods.wechat) === false
                            }
                        >
                            确认监控
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
