'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button, message, Modal } from 'antd';
import dayjs from 'dayjs';
import FavoriteFundList from './favorite-fund-list';
import { SubscriptionDialog } from './subscription-dialog';
import FundStatsAndSearch from './fund-stats-and-search';
import FundCardsGrid from './fund-cards-grid';
import FundEmptyState from './fund-empty-state';
import MonitoringModal from './monitoring-modal';
import AddFavoriteModal from './add-favorite-modal';
import { getLocalStorageWithExpiry } from '@/lib/utils';

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
    total?: number;
}

export default function FundList({
    initialFunds = [],
    total,
    isLoading = false,
    showFavoriteList: parentShowFavoriteList,
    setShowFavoriteList: parentSetShowFavoriteList,
}: FundListProps) {
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
    // 订阅对话框状态
    const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);

    const fetchFavoriteCount = async () => {
        try {
            const email = getLocalStorageWithExpiry('userEmail');
            if (!email) {
                setActualFavoriteCount(0);
                return;
            }

            if (!initialFunds || initialFunds?.length <= 0) {
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

            setFunds(
                initialFunds.map((fund) => ({
                    ...fund,
                    isFavorite: favoriteFundCodes.has(fund.code), // 如果code在收藏列表中，则设置为true
                })),
            );
        } catch (error) {
            console.error('获取收藏数量失败:', error);
            setActualFavoriteCount(0);
        }
    };

    // 获取实际的收藏基金数量
    useEffect(() => {
        if (initialFunds?.length > 0) {
            fetchFavoriteCount();
        }
    }, [initialFunds]);

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

        // 检查当前监控数量，如果超过3个，显示订阅对话框
        const monitoringCount = funds.filter((f) => f.isMonitoring).length;
        if (monitoringCount >= 3 && !fund.isMonitoring) {
            setSubscriptionDialogOpen(true);
        } else {
            setNotificationModalOpen(true);
        }
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

    const handleSubscribe = (type: 'free' | 'monthly' | 'yearly') => {
        // 订阅成功后的处理逻辑
        console.log('订阅成功:', type);
        // 可以在这里添加实际的订阅逻辑，比如调用API保存订阅信息
        // 订阅成功后，打开监控设置对话框
        setNotificationModalOpen(true);
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
                    {/* <div className="flex items-center justify-end space-x-3 sm:space-x-4">
                        <span className="text-sm text-gray-500">总数量: {totalFunds}</span>
                    </div> */}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                {/* Stats and Search */}
                <FundStatsAndSearch
                    activeTab={activeTab}
                    total={total}
                    monitoringFunds={monitoringFunds}
                    favoriteFunds={favoriteFunds}
                    showFavoriteList={showFavoriteList}
                    onTabChange={handleTabChange}
                    onSortChange={handleSortChange}
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    sortOrder={sortOrder}
                />

                {/* 条件渲染：如果是收藏标签页且用户已登录，显示FavoriteFundList组件，否则显示原有的基金列表 */}
                {showFavoriteList && userEmail ? (
                    <FavoriteFundList
                        email={userEmail}
                        refreshFavoriteList={fetchFavoriteCount}
                        visible={showFavoriteList}
                    />
                ) : (
                    <>
                        <FundCardsGrid
                            funds={currentFunds}
                            showFundActions={showFundActions}
                            onToggleFundActions={toggleFundActions}
                            onHandleSettingsClick={handleSettingsClick}
                            onToggleFavorite={toggleFavorite}
                            favoriteModalOpen={favoriteModalOpen}
                            setFavoriteModalOpen={setFavoriteModalOpen}
                            setSelectedFund={setSelectedFund}
                        />

                        {/* 空状态处理 */}
                        <FundEmptyState showFavoriteList={showFavoriteList} />
                    </>
                )}

                {/* 分页由父组件处理 */}
            </div>

            {/* 监控设置模态框 */}
            <MonitoringModal
                open={notificationModalOpen}
                onClose={() => setNotificationModalOpen(false)}
                selectedFund={selectedFund}
                selectedMethods={selectedMethods}
                onMethodChange={handleMethodChange}
                onConfirmMonitoring={handleConfirmMonitoring}
            />

            {/* 添加收藏确认模态框 */}
            <AddFavoriteModal
                open={favoriteModalOpen}
                onClose={() => setFavoriteModalOpen(false)}
                selectedFund={selectedFund}
                onConfirmAddToFavorite={handleConfirmAddToFavorite}
            />

            {/* 订阅对话框 */}
            <SubscriptionDialog
                open={subscriptionDialogOpen}
                onOpenChange={setSubscriptionDialogOpen}
                currentMonitorCount={funds.filter((f) => f.isMonitoring).length}
                onSubscribe={handleSubscribe}
            />
        </div>
    );
}
