'use client';

import React, { useEffect, useState } from 'react';
import { message, Modal } from 'antd';
import FavoriteFundList from './favorite-fund-list';
import { SubscriptionDialog } from './subscription-dialog';
import FundStatsAndSearch from './fund-stats-and-search';
import FundCardsGrid from './fund-cards-grid';
import FundEmptyState from './fund-empty-state';
import MonitoringModal from './monitoring-modal';
import AddFavoriteModal from './add-favorite-modal';
import MonitorFundList from './monitor-fund-list';
import { useAuth } from '@/app/providers/auth-provider';

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
    showFavoriteList: boolean;
    setShowFavoriteList?: (show: boolean) => void;
    total?: number;
    refreshFavoriteList?: () => void;
    showMonitorList: boolean;
    setShowMonitorList?: (show: boolean) => void;
    refreshMonitorList?: () => void;
    isLoading: boolean;
    favoriteCount?: number;
    monitorCount?: number;
}

export default function FundList({
    initialFunds = [],
    total,
    refreshFavoriteList,
    showFavoriteList,
    setShowFavoriteList,
    showMonitorList,
    setShowMonitorList,
    refreshMonitorList,
    isLoading,
    favoriteCount = 0,
    monitorCount = 0,
}: FundListProps) {
    const [funds, setFunds] = useState<FundItem[]>([]);
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc' | 'none'>('none');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'monitoring' | 'favorite'>('all');
    const [notificationModalOpen, setNotificationModalOpen] = useState(false);
    const [favoriteModalOpen, setFavoriteModalOpen] = useState(false);
    const [selectedFund, setSelectedFund] = useState<FundItem | null>(null);
    const [selectedMethods, setSelectedMethods] = useState({ dingtalk: true, wechat: false });
    const [showFundActions, setShowFundActions] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
    const { user, vipInfo } = useAuth();

    // 从 URL 参数中获取 activeTab 并设置
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tabFromUrl = params.get('tab') as 'all' | 'monitoring' | 'favorite';
        if (tabFromUrl && ['all', 'monitoring', 'favorite'].includes(tabFromUrl)) {
            setActiveTab(tabFromUrl);
        }
    }, []);

    useEffect(() => {
        setUserId(user?.id || null);
    }, [user]);

    useEffect(() => {
        setFunds(
            initialFunds.map((fund) => ({
                ...fund,
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
                isFavorite: fund.isFavorite ?? false,
                isMonitoring: fund.isMonitoring ?? false,
                status: fund.status || '打开',
                updateTime: fund.updateTime || new Date().toISOString(),
            })),
        );
    }, [initialFunds]);

    const toggleMonitoring = async (code: string) => {
        try {
            const fund = funds.find((f) => f.code === code);
            if (!fund) return;

            if (!userId) {
                throw new Error('用户未登录，请先登录');
            }

            const isAddMonitoring = !fund.isMonitoring;
            const endpoint = `/api/funds/monitor`;

            const response = await fetch(endpoint, {
                method: isAddMonitoring ? 'POST' : 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': userId,
                },
                body: JSON.stringify({ fundCode: code }),
            });

            if (!response.ok) {
                throw new Error(`API调用失败: ${response.statusText}`);
            }

            refreshMonitorList?.();
            message.success(isAddMonitoring ? '添加监控成功' : '取消监控成功');
        } catch (error) {
            console.error('监控操作失败:', error);
            message.error(error instanceof Error ? error.message : '监控操作失败，请稍后重试');
        }
    };

    const toggleFavorite = async (code: string) => {
        try {
            const fund = funds.find((f) => f.code === code);
            if (!fund) return;

            if (!userId) {
                throw new Error('用户未登录，请先登录');
            }

            const isAddFavorite = !fund.isFavorite;
            const endpoint = `/api/funds/favorite`;

            const response = await fetch(endpoint, {
                method: isAddFavorite ? 'POST' : 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': userId,
                },
                body: JSON.stringify({ fundCode: code }),
            });

            if (!response.ok) {
                throw new Error(`API调用失败: ${response.statusText}`);
            }

            refreshFavoriteList?.();
            message.success(isAddFavorite ? '添加收藏成功' : '取消收藏成功');
        } catch (error) {
            console.error('收藏操作失败:', error);
            message.error(error instanceof Error ? error.message : '收藏操作失败，请稍后重试');
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

    const sortedFunds = [...filteredFunds].sort((a, b) => {
        if (sortOrder === 'none') return 0;

        const parseChangePercent = (str: string) => {
            return parseFloat(str.replace('%', ''));
        };

        const aValue = parseChangePercent(a.changePercent);
        const bValue = parseChangePercent(b.changePercent);

        return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    const currentFunds = sortedFunds;

    const handleTabChange = async (tab: 'all' | 'monitoring' | 'favorite') => {
        setActiveTab(tab);

        if (tab === 'favorite') {
            try {
                if (!user?.id) {
                    Modal.error({
                        title: '请先登录',
                        content: '查看收藏列表需要先登录账号',
                        okText: '去登录',
                        onOk: () => {
                            window.location.href = '/auth/login';
                        },
                    });
                    return;
                }

                setUserId(user.id);
                setShowFavoriteList?.(true);
            } catch (error) {
                console.error('Error preparing favorite list:', error);
                Modal.error({
                    title: '获取收藏列表失败',
                    content: '网络错误，请检查网络连接后重试',
                });
            } finally {
                setShowMonitorList?.(false);
            }
        } else if (tab === 'monitoring') {
            try {
                if (!user?.id) {
                    Modal.error({
                        title: '请先登录',
                        content: '查看监控列表需要先登录账号',
                        okText: '去登录',
                        onOk: () => {
                            window.location.href = '/auth/login';
                        },
                    });
                    return;
                }

                setUserId(user.id);
                setShowMonitorList?.(true);
            } catch (error) {
                console.error('Error preparing monitoring list:', error);
                Modal.error({
                    title: '获取监控列表失败',
                    content: '网络错误，请检查网络连接后重试',
                });
            } finally {
                setShowFavoriteList?.(false);
            }
        } else {
            setShowFavoriteList?.(false);
            setShowMonitorList?.(false);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleSortChange = () => {
        if (sortOrder === 'none') {
            setSortOrder('desc');
        } else if (sortOrder === 'desc') {
            setSortOrder('asc');
        } else {
            setSortOrder('none');
        }
    };

    const handleSettingsClick = (fund: FundItem) => {
        setSelectedFund(fund);
        setSelectedMethods({ dingtalk: true, wechat: false });

        const monitoringCount = funds.filter((f) => f.isMonitoring).length;

        if (
            monitoringCount >= 3 &&
            !fund.isMonitoring &&
            !['year', 'month'].includes(vipInfo.plan_code)
        ) {
            setSubscriptionDialogOpen(true);
        } else {
            const isAddMonitoring = !fund.isMonitoring;
            if (!isAddMonitoring) {
                toggleMonitoring(fund.code);
                return;
            }
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

    const toggleFundActions = (code: string) => {
        if (showFundActions === code) {
            setShowFundActions(null);
        } else {
            setShowFundActions(code);
        }
    };

    const handleSubscribe = (type: 'free' | 'month' | 'year') => {
        console.log('订阅成功:', type);
        setNotificationModalOpen(true);
    };

    const render = () => {
        if (showFavoriteList && userId) {
            return (
                <FavoriteFundList
                    userId={userId}
                    refreshFavoriteList={refreshFavoriteList}
                    visible={showFavoriteList}
                />
            );
        }
        if (showMonitorList && userId) {
            return (
                <MonitorFundList
                    userId={userId}
                    refreshMonitorList={refreshMonitorList}
                    visible={showMonitorList}
                />
            );
        }

        if (isLoading) {
            return (
                <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
                </div>
            );
        }
        return (
            <>
                <FundCardsGrid
                    funds={currentFunds}
                    onHandleSettingsClick={handleSettingsClick}
                    showFundActions={showFundActions}
                    onToggleFundActions={toggleFundActions}
                    onToggleFavorite={toggleFavorite}
                    setFavoriteModalOpen={setFavoriteModalOpen}
                    setSelectedFund={setSelectedFund}
                />
                <FundEmptyState showFunds={currentFunds.length > 0} />
            </>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <FundStatsAndSearch
                    activeTab={activeTab}
                    total={total}
                    monitorCount={monitorCount}
                    favoriteCount={favoriteCount}
                    showFavoriteList={showFavoriteList}
                    showMonitorList={showMonitorList}
                    onTabChange={handleTabChange}
                    onSortChange={handleSortChange}
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    sortOrder={sortOrder}
                />

                {render()}
            </div>

            <MonitoringModal
                open={notificationModalOpen}
                onClose={() => setNotificationModalOpen(false)}
                selectedFund={selectedFund}
                selectedMethods={selectedMethods}
                onMethodChange={handleMethodChange}
                onConfirmMonitoring={handleConfirmMonitoring}
            />

            <AddFavoriteModal
                open={favoriteModalOpen}
                onClose={() => setFavoriteModalOpen(false)}
                selectedFund={selectedFund}
                onConfirmAddToFavorite={handleConfirmAddToFavorite}
            />

            <SubscriptionDialog
                open={subscriptionDialogOpen}
                onOpenChange={setSubscriptionDialogOpen}
                currentMonitorCount={funds.filter((f) => f.isMonitoring).length}
                onSubscribe={handleSubscribe}
            />
        </div>
    );
}
