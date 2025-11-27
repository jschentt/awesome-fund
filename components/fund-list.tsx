'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Eye,
    Settings,
    Bell,
    ChevronDown,
    ChevronUp,
    Check,
    Plus,
    Star,
} from 'lucide-react';
import { Button, message, Modal } from 'antd';
import dayjs from 'dayjs';
import FavoriteFundList from './favorite-fund-list';

export interface FundItem {
    id?: string;
    code: string;
    name: string;
    type?: string;
    shortName?: string;
    netWorth?: number;
    expectWorth?: number;
    expectGrowth?: number;
    estimatedChange?: number;
    netWorthDate?: string;
    expectWorthDate?: string;
    totalCount?: number;
    description?: string;
    // Original fields
    currentValue: string;
    dailyChange: string;
    changePercent: string;
    isMonitoring: boolean;
    isFavorite: boolean;
    updateTime: string;
    status: string;
}

interface FundListProps {
    initialFunds?: FundItem[];
    isLoading?: boolean;
    showFavoriteList?: boolean;
    setShowFavoriteList?: (show: boolean) => void;
}

export default function FundList({ initialFunds = [], isLoading = false, showFavoriteList: parentShowFavoriteList, setShowFavoriteList: parentSetShowFavoriteList }: FundListProps) {
    // 确保每个基金项目都有isFavorite字段，并处理新旧数据结构转换
    const [funds, setFunds] = useState<FundItem[]>(() =>
        initialFunds.map((fund) => ({
            ...fund,
            // 数据转换逻辑
            currentValue: fund.currentValue || fund.netWorth?.toString() || 'N/A',
            dailyChange:
                fund.dailyChange ||
                (fund.estimatedChange
                    ? fund.estimatedChange > 0
                        ? `+${fund.estimatedChange.toFixed(4)}`
                        : fund.estimatedChange.toFixed(4)
                    : 'N/A'),
            changePercent:
                fund.changePercent ||
                (fund.expectGrowth
                    ? fund.expectGrowth > 0
                        ? `+${fund.expectGrowth}%`
                        : `${fund.expectGrowth}%`
                    : 'N/A'),
            isFavorite: fund.isFavorite ?? false, // 提供默认值
            status: fund.status || '打开',
            updateTime: fund.updateTime || new Date().toISOString(), // 添加updateTime默认值
        })),
    );
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc' | 'none'>('none');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'monitoring' | 'favorite'>('all');
    const [notificationModalOpen, setNotificationModalOpen] = useState(false);
    const [favoriteModalOpen, setFavoriteModalOpen] = useState(false);
    const [selectedFund, setSelectedFund] = useState<FundItem | null>(null);
    const [selectedMethods, setSelectedMethods] = useState({ dingtalk: false, wechat: false });
    const [showFundActions, setShowFundActions] = useState<string | null>(null);
    // 使用从父组件传递的showFavoriteList状态和setShowFavoriteList函数
    // 如果父组件未提供，则使用默认值
    const showFavoriteList = parentShowFavoriteList ?? false;
    const setShowFavoriteList = parentSetShowFavoriteList || (() => {});
    // 存储当前用户邮箱，用于传递给收藏列表组件
    const [userEmail, setUserEmail] = useState<string | null>(null);
    // 存储实际的收藏基金数量
    const [actualFavoriteCount, setActualFavoriteCount] = useState(0);

    // 更新基金数据当外部传入的初始数据变化时
    useEffect(() => {
        const updateFundsWithFavoriteStatus = async () => {
            // 从localStorage获取缓存的邮箱
            const getLocalStorageWithExpiry = (key: string): string | null => {
                const itemStr = localStorage.getItem(key);
                if (!itemStr) {
                    return null;
                }

                const item = JSON.parse(itemStr);
                const now = new Date();

                if (now.getTime() > item.expiry) {
                    localStorage.removeItem(key);
                    return null;
                }

                return item.value;
            };

            const email = getLocalStorageWithExpiry('userEmail');

            // 如果没有email，按照原逻辑执行
            if (!email) {
                setFunds(
                    initialFunds.map((fund) => ({
                        ...fund,
                        isFavorite: fund.isFavorite ?? false,
                    })),
                );
                return;
            }

            try {
                // 调用API获取收藏基金列表
                const response = await fetch(
                    `/api/funds/favorite/list?email=${encodeURIComponent(email)}`,
                );

                if (!response.ok) {
                    throw new Error('获取收藏列表失败');
                }

                const data = await response.json();
                const favoriteFundsList = data?.data?.map((item: any) => item.data) || [];

                // 创建一个收藏基金code的Set，方便快速查询
                const favoriteCodes = new Set(
                    favoriteFundsList.map((f: any) => f.code || f.fundCode),
                );

                // 更新基金数据，根据API返回结果设置isFavorite状态
                setFunds(
                    initialFunds.map((fund) => ({
                        ...fund,
                        isFavorite: favoriteCodes.has(fund.code),
                    })),
                );
            } catch (error) {
                console.error('获取收藏状态失败:', error);
                // 出错时按照原逻辑执行
                setFunds(
                    initialFunds.map((fund) => ({
                        ...fund,
                        isFavorite: fund.isFavorite ?? false,
                    })),
                );
            }
        };
        updateFundsWithFavoriteStatus();
    }, [initialFunds]);

    const fetchFavoriteCount = async () => {
        try {
            // 从localStorage获取缓存的邮箱
            const getLocalStorageWithExpiry = (key: string): string | null => {
                const itemStr = localStorage.getItem(key);
                if (!itemStr) {
                    setActualFavoriteCount(0);
                    return null;
                }

                const item = JSON.parse(itemStr);
                const now = new Date();

                if (now.getTime() > item.expiry) {
                    localStorage.removeItem(key);
                    setActualFavoriteCount(0);
                    return null;
                }

                return item.value;
            };

            const email = getLocalStorageWithExpiry('userEmail');
            if (!email) {
                setActualFavoriteCount(0);
                return;
            }

            // 调用API获取收藏基金列表
            const response = await fetch(
                `/api/funds/favorite/list?email=${encodeURIComponent(email)}`,
            );
            if (!response.ok) {
                throw new Error('获取收藏列表失败');
            }

            const data = await response.json();

            const favoriteFunds = data?.data?.map((item: any) => item.data) || [];

            setActualFavoriteCount(favoriteFunds ? favoriteFunds.length : 0);

            // 创建收藏基金code的Set集合用于快速查找
            const favoriteFundCodes = new Set(
                favoriteFunds.map(
                    (f: { fund_code?: string; code?: string }) => f.fund_code || f.code,
                ),
            );

            // 更新initialFunds中基金的收藏状态
            if (initialFunds && initialFunds.length > 0) {
                setFunds(
                    initialFunds.map((fund) => ({
                        ...fund,
                        isFavorite: favoriteFundCodes.has(fund.code), // 如果code在收藏列表中，则设置为true
                    })),
                );
            }
        } catch (error) {
            console.error('获取收藏数量失败:', error);
            setActualFavoriteCount(0);
        }
    };

    // 获取实际的收藏基金数量
    useEffect(() => {
        fetchFavoriteCount();
    }, []);

    const toggleMonitoring = (code: string) => {
        setFunds(
            funds.map((fund) =>
                fund.code === code ? { ...fund, isMonitoring: !fund.isMonitoring } : fund,
            ),
        );
    };

    const toggleFavorite = async (code: string) => {
        try {
            const fund = funds.find((f) => f.code === code);
            if (!fund) return;

            // 从localStorage获取缓存的邮箱
            const getLocalStorageWithExpiry = (key: string): string | null => {
                const itemStr = localStorage.getItem(key);
                if (!itemStr) {
                    return null;
                }

                const item = JSON.parse(itemStr);
                const now = new Date();

                if (now.getTime() > item.expiry) {
                    localStorage.removeItem(key);
                    return null;
                }

                return item.value;
            };

            const email = getLocalStorageWithExpiry('userEmail');
            if (!email) {
                throw new Error('用户未登录，请先登录');
            }

            // 确定是添加还是取消收藏
            const isAddFavorite = !fund.isFavorite;
            const endpoint = `/api/funds/favorite`;

            // 调用API
            const response = await fetch(endpoint, {
                method: isAddFavorite ? 'POST' : 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fundCode: code, email }),
            });

            // 检查响应状态
            if (!response.ok) {
                throw new Error(`API调用失败: ${response.statusText}`);
            }

            // 只在API调用成功后更新本地状态
            setFunds(
                funds.map((fund) =>
                    fund.code === code ? { ...fund, isFavorite: !fund.isFavorite } : fund,
                ),
            );

            // 显示成功提示
            message.success(isAddFavorite ? '添加收藏成功' : '取消收藏成功');

            fetchFavoriteCount();
        } catch (error) {
            console.error('收藏操作失败:', error);
            message.error('操作失败，请稍后重试');
        }
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

    // 使用排序后的所有基金数据，不再进行内部分页
    const currentFunds = sortedFunds;

    // 处理标签页切换
    const handleTabChange = async (tab: 'all' | 'monitoring' | 'favorite') => {
        setActiveTab(tab);
        // 分页由父组件处理

        if (tab === 'favorite') {
            try {
                // 从localStorage获取email
                const getLocalStorageWithExpiry = (key: string): string | null => {
                    const itemStr = localStorage.getItem(key);
                    if (!itemStr) {
                        return null;
                    }

                    const item = JSON.parse(itemStr);
                    const now = new Date();

                    if (now.getTime() > item.expiry) {
                        localStorage.removeItem(key);
                        return null;
                    }

                    return item.value;
                };

                const email = getLocalStorageWithExpiry('userEmail');

                if (!email) {
                    // 如果没有email，使用Modal提示用户登录
                    Modal.error({
                        title: '请先登录',
                        content: '查看收藏列表需要先登录账号',
                        okText: '去登录',
                        onOk: () => {
                            // 跳转到登录页面
                            window.location.href = '/auth/login';
                        },
                    });
                    return;
                }

                // 设置用户邮箱和显示收藏列表组件
                setUserEmail(email);
                setShowFavoriteList(true);
            } catch (error) {
                console.error('Error preparing favorite list:', error);
                Modal.error({
                    title: '获取收藏列表失败',
                    content: '网络错误，请检查网络连接后重试',
                });
            }
        } else {
            // 当切换到其他标签页时，隐藏收藏列表组件
            setShowFavoriteList(false);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        // 分页由父组件处理
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
        // 分页由父组件处理
    };

    const handleSettingsClick = (fund: FundItem) => {
        setSelectedFund(fund);
        setSelectedMethods({ dingtalk: false, wechat: false });
        setNotificationModalOpen(true);
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
    // 优先使用实际从API获取的收藏数量，如果未获取到则使用本地过滤的结果
    const favoriteFunds = actualFavoriteCount;

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
                                variant={activeTab === 'all' ? 'solid' : 'text'}
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
                                variant={activeTab === 'monitoring' ? 'solid' : 'text'}
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
                                variant={activeTab === 'favorite' ? 'solid' : 'text'}
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
                    {!showFavoriteList && (
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
                                variant={sortOrder === 'none' ? 'text' : 'solid'}
                                className={`flex items-center space-x-2 ${sortOrder === 'none' ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-blue-50 text-blue-700 border-blue-200'}`}
                            >
                                <span className="font-medium">按涨跌幅排序</span>
                                {sortOrder === 'desc' && <ChevronDown className="w-4 h-4" />}
                                {sortOrder === 'asc' && <ChevronUp className="w-4 h-4" />}
                            </Button>
                        </motion.div>
                    )}
                </div>

                {/* 条件渲染：如果是收藏标签页且用户已登录，显示FavoriteFundList组件，否则显示原有的基金列表 */}
                {showFavoriteList && userEmail ? (
                    <FavoriteFundList email={userEmail} refreshFavoriteList={fetchFavoriteCount} />
                ) : (
                    /* Fund Cards Grid */
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

                                            {/* 操作按钮容器 */}
                                            <div className="relative">
                                                <Button
                                                    variant="text"
                                                    size="small"
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
                                                            exit={{
                                                                opacity: 0,
                                                                scale: 0.95,
                                                                y: -10,
                                                            }}
                                                            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50 overflow-hidden"
                                                        >
                                                            <button
                                                                className="flex items-center space-x-2 w-full px-4 py-3 text-left hover:bg-gray-50"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
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
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                    // 对于取消收藏操作，直接执行
                                                                    if (fund.isFavorite) {
                                                                        toggleFavorite(fund.code);
                                                                        toggleFundActions(
                                                                            fund.code,
                                                                        );
                                                                    } else {
                                                                        // 对于添加收藏操作，打开确认模态框
                                                                        setSelectedFund(fund);
                                                                        setFavoriteModalOpen(true);
                                                                        toggleFundActions(
                                                                            fund.code,
                                                                        );
                                                                    }
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
                                        <div className="grid grid-cols-3 gap-4 mb-4">
                                            <div>
                                                <div className="text-xs text-gray-500 mb-1">
                                                    当日净值
                                                </div>
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
                                                        <div className="text-xs text-gray-400">
                                                            {fund.expectWorthDate}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* 日涨跌信息 */}
                                        <div className="grid grid-cols-2 gap-4 mb-3">
                                            <div>
                                                <div className="text-xs text-gray-500 mb-1">
                                                    日涨跌
                                                </div>
                                                <div
                                                    className={`text-base font-semibold ${fund.dailyChange && fund.dailyChange.startsWith('+') ? 'text-red-600' : 'text-green-600'}`}
                                                >
                                                    {fund.dailyChange}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 mb-1">
                                                    涨跌幅
                                                </div>
                                                <div
                                                    className={`text-base font-semibold ${fund.changePercent && fund.changePercent.startsWith('+') ? 'text-red-600' : 'text-green-600'}`}
                                                >
                                                    {fund.changePercent}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 更新时间 */}
                                        <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                                            更新时间:{' '}
                                            {dayjs(fund.updateTime).format('YYYY-MM-DD HH:mm:ss')}
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
                )}

                {/* 空状态处理 */}
                {currentFunds.length === 0 && !showFavoriteList && (
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

                {/* 分页由父组件处理 */}
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
