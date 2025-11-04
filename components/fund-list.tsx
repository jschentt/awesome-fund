'use client';

import React, { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Eye,
    EyeOff,
    Settings,
    Bell,
    ChevronDown,
    ChevronUp,
    Check,
    Plus,
    Star,
} from 'lucide-react';
import { Button } from '@heroui/react';

export interface FundItem {
    code: string;
    name: string;
    currentValue: string;
    accumulatedValue: string;
    dailyChange: string;
    changePercent: string;
    isMonitoring: boolean;
    isFavorite: boolean;
    updateTime: string;
    status: string;
}

interface FundListProps {
    initialFunds?: FundItem[];
}

// 模拟基金数据，用于展示
const mockFunds: FundItem[] = [
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
];

export default function FundList({ initialFunds = mockFunds }: FundListProps) {
    const [funds, setFunds] = useState<FundItem[]>(initialFunds);
    const [loading, setLoading] = useState(false);
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc' | 'none'>('none');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'monitoring' | 'favorite'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [notificationModalOpen, setNotificationModalOpen] = useState(false);
    const [favoriteModalOpen, setFavoriteModalOpen] = useState(false);
    const [selectedFund, setSelectedFund] = useState<FundItem | null>(null);
    const [selectedMethods, setSelectedMethods] = useState({ dingtalk: false, wechat: false });
    const [showFundActions, setShowFundActions] = useState<string | null>(null);
    const [hoveredFundCode, setHoveredFundCode] = useState<string | null>(null);

    const itemsPerPage = 6;

    // 从API获取基金列表（模拟）
    useEffect(() => {
        async function fetchFunds() {
            try {
                setLoading(true);
                // 模拟API请求延迟
                await new Promise((resolve) => setTimeout(resolve, 500));
                // 在实际应用中，这里应该从API获取数据
                // const response = await fetch('/api/funds');
                // if (response.ok) {
                //   const data = await response.json();
                //   setFunds(data);
                // }
                setFunds(initialFunds);
            } catch (error) {
                console.error('获取基金列表失败:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchFunds();
    }, [initialFunds]);

    const toggleMonitoring = (code: string) => {
        setFunds(
            funds.map((fund) =>
                fund.code === code ? { ...fund, isMonitoring: !fund.isMonitoring } : fund,
            ),
        );
    };

    const toggleFavorite = (code: string) => {
        setFunds(
            funds.map((fund) =>
                fund.code === code ? { ...fund, isFavorite: !fund.isFavorite } : fund,
            ),
        );
    };

    const filteredFunds = funds.filter((fund) => {
        const matchesSearch =
            fund.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            fund.code.includes(searchTerm);
        let matchesTab = true;

        if (activeTab === 'monitoring') {
            matchesTab = fund.isMonitoring;
        } else if (activeTab === 'favorite') {
            matchesTab = fund.isFavorite;
        }

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
    const handleTabChange = (tab: 'all' | 'monitoring' | 'favorite') => {
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

    const handleAddToFavoriteClick = (fund: FundItem) => {
        setSelectedFund(fund);
        setFavoriteModalOpen(true);
    };

    const handleConfirmMonitoring = () => {
        if ((selectedMethods.dingtalk || selectedMethods.wechat) && selectedFund) {
            toggleMonitoring(selectedFund.code);
            console.log('设置监控:', {
                fundName: selectedFund.name,
                selectedMethods,
            });
            setNotificationModalOpen(false);
        }
    };

    const handleConfirmAddToFavorite = () => {
        if (selectedFund) {
            toggleFavorite(selectedFund.code);
            setFavoriteModalOpen(false);
        }
    };

    const handleMethodChange = (method: 'dingtalk' | 'wechat') => {
        setSelectedMethods((prev) => ({ ...prev, [method]: !prev[method] }));
    };

    const totalFunds = funds.length;
    const monitoringFunds = funds.filter((f) => f.isMonitoring).length;
    const favoriteFunds = funds.filter((f) => f.isFavorite).length;

    const toggleFundActions = (code: string) => {
        if (showFundActions === code) {
            setShowFundActions(null);
        } else {
            setShowFundActions(code);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-16">
            {/* 头部标题和信息 */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0 mb-6">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-2xl sm:text-3xl font-bold text-gray-900"
                    >
                        基金列表
                    </motion.h1>
                    <div className="flex items-center justify-end space-x-3 sm:space-x-4">
                        <span className="text-sm text-gray-500">总数量: {totalFunds}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                {/* Stats and Search */}
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0 mb-8">
                    {/* Stats Tabs */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="bg-white border border-gray-200 rounded-lg p-1 shadow-sm"
                    >
                        <div className="flex flex-col sm:flex-row">
                            <Button
                                variant={activeTab === 'all' ? 'solid' : 'ghost'}
                                className={`flex items-center space-x-2 px-4 py-2 w-full sm:w-auto ${activeTab === 'all' ? 'bg-blue-50 border-blue-200 text-blue-700 rounded-md' : ''}`}
                                onClick={() => handleTabChange('all')}
                            >
                                <span className="text-sm font-medium">全部基金</span>
                                <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${activeTab === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                                >
                                    {totalFunds}
                                </span>
                            </Button>
                            <Button
                                variant={activeTab === 'monitoring' ? 'solid' : 'ghost'}
                                className={`flex items-center space-x-2 px-4 py-2 w-full sm:w-auto ${activeTab === 'monitoring' ? 'bg-blue-50 border-blue-200 text-blue-700 rounded-md' : ''}`}
                                onClick={() => handleTabChange('monitoring')}
                            >
                                <Eye className="w-4 h-4" />
                                <span className="text-sm font-medium">我的监控</span>
                                <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${activeTab === 'monitoring' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                                >
                                    {monitoringFunds}
                                </span>
                            </Button>
                            <Button
                                variant={activeTab === 'favorite' ? 'solid' : 'ghost'}
                                className={`flex items-center space-x-2 px-4 py-2 w-full sm:w-auto ${activeTab === 'favorite' ? 'bg-blue-50 border-blue-200 text-blue-700 rounded-md' : ''}`}
                                onClick={() => handleTabChange('favorite')}
                            >
                                <Star className="w-4 h-4" />
                                <span className="text-sm font-medium">我的收藏</span>
                                <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${activeTab === 'favorite' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                                >
                                    {favoriteFunds}
                                </span>
                            </Button>
                        </div>
                    </motion.div>

                    {/* Search Controls */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4"
                    >
                        <div className="relative w-full sm:w-64">
                            <input
                                type="text"
                                placeholder="搜索基金代码或名称..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        </div>
                        <Button
                            onClick={() => handleSortChange()}
                            variant={sortOrder === 'none' ? 'ghost' : 'solid'}
                            className={`flex items-center space-x-2 ${sortOrder === 'none' ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-blue-50 text-blue-700 border-blue-200'}`}
                        >
                            <span className="font-medium">按涨跌幅排序</span>
                            {sortOrder === 'desc' && <ChevronDown className="w-4 h-4" />}
                            {sortOrder === 'asc' && <ChevronUp className="w-4 h-4" />}
                        </Button>
                        <Button
                            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                            onClick={() => {
                                /* 添加自选功能 */
                            }}
                        >
                            <Plus className="w-4 h-4" />
                            <span className="font-medium">添加自选</span>
                        </Button>
                    </motion.div>
                </div>

                {/* Fund Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {currentFunds.map((fund, index) => (
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
                                onMouseEnter={() => setHoveredFundCode(fund.code)}
                                onMouseLeave={() => setHoveredFundCode(null)}
                            >
                                <Link
                                    href={`/fund/${fund.code}`}
                                    className="block p-5"
                                    aria-label={`查看基金详情: ${fund.name}`}
                                >
                                    {/* 基金头部信息 */}
                                    <div className="flex justify-between items-start w-full mb-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className="text-base font-semibold text-gray-900">
                                                    {fund.code}
                                                </span>
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        fund.status === '打开'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : fund.status === '暂停'
                                                              ? 'bg-orange-100 text-orange-700'
                                                              : 'bg-gray-100 text-gray-700'
                                                    }`}
                                                >
                                                    {fund.status}
                                                </span>
                                                {fund.isFavorite && (
                                                    <Star
                                                        className="w-4 h-4 text-yellow-500 fill-yellow-500"
                                                        aria-label="已收藏"
                                                    />
                                                )}
                                            </div>
                                            <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                                                {fund.name}
                                            </h3>
                                        </div>

                                        {/* 操作按钮容器 */}
                                        <div className="relative">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-8 h-8 rounded-full text-gray-500 hover:bg-gray-100"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    toggleFundActions(fund.code);
                                                }}
                                                aria-label="基金操作"
                                            >
                                                <Settings className="w-4 h-4" />
                                            </Button>

                                            {/* 下拉操作菜单 */}
                                            <AnimatePresence>
                                                {showFundActions === fund.code && (
                                                    <motion.div
                                                        initial={{
                                                            opacity: 0,
                                                            scale: 0.95,
                                                            y: -10,
                                                        }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50 overflow-hidden"
                                                    >
                                                        <button
                                                            className="flex items-center space-x-2 w-full px-4 py-3 text-left hover:bg-gray-50"
                                                            onClick={() => {
                                                                handleSettingsClick(fund);
                                                                toggleFundActions(fund.code);
                                                            }}
                                                        >
                                                            <Bell className="w-4 h-4 text-blue-600" />
                                                            <span className="text-sm">
                                                                设置监控
                                                            </span>
                                                        </button>
                                                        <button
                                                            className="flex items-center space-x-2 w-full px-4 py-3 text-left hover:bg-gray-50"
                                                            onClick={() => {
                                                                toggleFavorite(fund.code);
                                                                toggleFundActions(fund.code);
                                                            }}
                                                        >
                                                            <Star
                                                                className={`w-4 h-4 ${fund.isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-500'}`}
                                                            />
                                                            <span className="text-sm">
                                                                {fund.isFavorite
                                                                    ? '取消收藏'
                                                                    : '添加收藏'}
                                                            </span>
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    {/* 基金净值信息 */}
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">
                                                当日净值
                                            </div>
                                            <div className="text-lg font-semibold text-gray-900">
                                                {fund.currentValue}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">
                                                累计净值
                                            </div>
                                            <div className="text-lg font-semibold text-gray-900">
                                                {fund.accumulatedValue}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 日涨跌信息 */}
                                    <div className="grid grid-cols-2 gap-4 mb-3">
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

                                    {/* 更新时间 */}
                                    <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                                        更新时间: {fund.updateTime}
                                    </div>
                                </Link>

                                {/* 监控状态指示器 */}
                                {fund.isMonitoring && (
                                    <div className="absolute top-3 right-3">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="w-2 h-2 bg-blue-500 rounded-full"
                                        />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* 空状态处理 */}
                {currentFunds.length === 0 && !loading && (
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
                )}

                {/* 加载状态 */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4" />
                        <p className="text-gray-500">正在加载基金数据...</p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && !loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="mt-8 sm:mt-12 flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-2"
                    >
                        <Button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                        >
                            上一页
                        </Button>

                        <div className="flex space-x-1 overflow-x-auto pb-2 sm:pb-0">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter((page) => {
                                    // 只显示当前页附近的页码，最多显示5个
                                    if (totalPages <= 5) return true;
                                    if (currentPage <= 3) return page <= 5;
                                    if (currentPage >= totalPages - 2)
                                        return page >= totalPages - 4;
                                    return page >= currentPage - 2 && page <= currentPage + 2;
                                })
                                .map((page, index, array) => (
                                    <Fragment key={page}>
                                        {index > 0 && array[index - 1] !== page - 1 && (
                                            <span className="px-3 py-2 text-gray-500">...</span>
                                        )}
                                        <Button
                                            onClick={() => setCurrentPage(page)}
                                            className={`px-3 py-2 text-sm ${currentPage === page ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                        >
                                            {page}
                                        </Button>
                                    </Fragment>
                                ))}
                        </div>

                        <Button
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className={`px-4 py-2 ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                        >
                            下一页
                        </Button>
                    </motion.div>
                )}

                {/* Results Info */}
                {totalPages > 0 && !loading && (
                    <div className="mt-4 sm:mt-6 text-center text-sm text-gray-500 px-4">
                        显示 {startIndex + 1}-{Math.min(endIndex, sortedFunds.length)} 条，共{' '}
                        {sortedFunds.length} 条结果
                        {activeTab === 'monitoring' && ` (监控中: ${monitoringFunds} 只)`}
                        {activeTab === 'favorite' && ` (收藏中: ${favoriteFunds} 只)`}
                    </div>
                )}
            </div>

            {/* 监控设置模态框 */}
            <AnimatePresence>
                {notificationModalOpen && (
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
                                    为 {selectedFund?.name} 设置消息推送方式
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

            {/* 添加收藏确认模态框 */}
            <AnimatePresence>
                {favoriteModalOpen && (
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
                                    <span>添加到收藏</span>
                                </h3>
                            </div>
                            <div className="py-4">
                                <p className="text-gray-600 mb-2">
                                    确定要将 {selectedFund?.name} 添加到收藏吗？
                                </p>
                                <p className="text-sm text-gray-500">
                                    添加后可在「我的收藏」标签页中快速查看
                                </p>
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
                                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleConfirmAddToFavorite();
                                    }}
                                >
                                    确认添加
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
