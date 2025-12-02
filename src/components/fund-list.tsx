'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { message, Modal } from 'antd';
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
    showFavoriteList?: boolean;
    favoriteCount: number;
    setShowFavoriteList?: (show: boolean) => void;
    total?: number;
    refreshFavoriteList?: () => void;
}

export default function FundList({
    initialFunds = [],
    total,
    favoriteCount,
    refreshFavoriteList,
    showFavoriteList: parentShowFavoriteList,
    setShowFavoriteList: parentSetShowFavoriteList,
}: FundListProps) {
    const [funds, setFunds] = useState<FundItem[]>([]);
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc' | 'none'>('none');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'monitoring' | 'favorite'>('all');
    const [notificationModalOpen, setNotificationModalOpen] = useState(false);
    const [favoriteModalOpen, setFavoriteModalOpen] = useState(false);
    const [selectedFund, setSelectedFund] = useState<FundItem | null>(null);
    const [selectedMethods, setSelectedMethods] = useState({ dingtalk: false, wechat: false });
    const [showFundActions, setShowFundActions] = useState<string | null>(null);
    const showFavoriteList = parentShowFavoriteList ?? false;
    const setShowFavoriteList = parentSetShowFavoriteList || (() => {});
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);

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
                status: fund.status || '打开',
                updateTime: fund.updateTime || new Date().toISOString(),
            })),
        );
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

            const email = getLocalStorageWithExpiry('userEmail');
            if (!email) {
                throw new Error('用户未登录，请先登录');
            }

            const isAddFavorite = !fund.isFavorite;
            const endpoint = `/api/funds/favorite`;

            const response = await fetch(endpoint, {
                method: isAddFavorite ? 'POST' : 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fundCode: code, email }),
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
            setShowFavoriteList(false);
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
        setSelectedMethods({ dingtalk: false, wechat: false });

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

    const monitoringFunds = funds.filter((f) => f.isMonitoring).length;

    const toggleFundActions = (code: string) => {
        if (showFundActions === code) {
            setShowFundActions(null);
        } else {
            setShowFundActions(code);
        }
    };

    const handleSubscribe = (type: 'free' | 'monthly' | 'yearly') => {
        console.log('订阅成功:', type);
        setNotificationModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-16">
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
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <FundStatsAndSearch
                    activeTab={activeTab}
                    total={total}
                    monitoringFunds={monitoringFunds}
                    favoriteFunds={favoriteCount}
                    showFavoriteList={showFavoriteList}
                    onTabChange={handleTabChange}
                    onSortChange={handleSortChange}
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    sortOrder={sortOrder}
                />

                {showFavoriteList && userEmail ? (
                    <FavoriteFundList
                        email={userEmail}
                        refreshFavoriteList={refreshFavoriteList}
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
                            setFavoriteModalOpen={setFavoriteModalOpen}
                            setSelectedFund={setSelectedFund}
                        />

                        <FundEmptyState showFunds={currentFunds.length > 0} />
                    </>
                )}
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
