'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Search, Eye, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { Button, Input, Space } from 'antd';

interface FundStatsAndSearchProps {
    activeTab: 'all' | 'monitoring' | 'favorite';
    total: number | undefined;
    monitorCount: number;
    favoriteCount: number;
    showFavoriteList: boolean;
    showMonitorList: boolean;
    onTabChange: (tab: 'all' | 'monitoring' | 'favorite') => void;
    onSortChange: () => void;
    searchTerm: string;
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSearchClick: (searchTerm: string | undefined) => void;
    sortOrder: 'desc' | 'asc' | 'none';
    isIndexFundFiltered?: boolean;
    onToggleIndexFundFilter?: () => void;
    isStockFundFiltered?: boolean;
    onToggleStockFundFilter?: () => void;
}

export default function FundStatsAndSearch({
    activeTab,
    total,
    monitorCount,
    favoriteCount,
    showFavoriteList,
    showMonitorList,
    onTabChange,
    onSortChange,
    searchTerm,
    onSearchChange,
    onSearchClick,
    sortOrder,
    isIndexFundFiltered = false,
    onToggleIndexFundFilter,
    isStockFundFiltered = false,
    onToggleStockFundFilter,
}: FundStatsAndSearchProps) {
    return (
        <div className="space-y-4 mb-4 sticky top-[-1px] z-10 bg-gray-50 pt-0 pb-4 sm:static sm:z-auto sm:bg-transparent sm:pt-0 sm:pb-0">
            {/* Stats Tabs 和 Search Controls 在同一行 */}
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                {/* Stats Tabs */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-white border border-gray-200 rounded-lg p-1 shadow-sm w-full sm:w-auto"
                >
                    <div className="flex w-full">
                        <Space.Compact className="w-full">
                            <Button
                                variant={activeTab === 'all' ? 'solid' : 'text'}
                                className={`flex items-center justify-center space-x-2 px-2 py-1.5 sm:px-4 sm:py-2 flex-1 text-sm ${activeTab === 'all' ? 'bg-blue-50 border-blue-200 text-blue-700 rounded-md' : ''}`}
                                onClick={() => onTabChange('all')}
                            >
                                <span className="hidden sm:inline font-medium">全部基金</span>
                                <span
                                    className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${activeTab === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                                >
                                    {total}
                                </span>
                            </Button>
                            <Button
                                variant={activeTab === 'monitoring' ? 'solid' : 'text'}
                                className={`flex items-center justify-center space-x-2 px-2 py-1.5 sm:px-4 sm:py-2 flex-1 text-sm ${activeTab === 'monitoring' ? 'bg-blue-50 border-blue-200 text-blue-700 rounded-md' : ''}`}
                                onClick={() => onTabChange('monitoring')}
                            >
                                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline font-medium">我的监控</span>
                                <span
                                    className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${activeTab === 'monitoring' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                                >
                                    {monitorCount}
                                </span>
                            </Button>
                            <Button
                                variant={activeTab === 'favorite' ? 'solid' : 'text'}
                                className={`flex items-center justify-center space-x-2 px-2 py-1.5 sm:px-4 sm:py-2 flex-1 text-sm ${activeTab === 'favorite' ? 'bg-blue-50 border-blue-200 text-blue-700 rounded-md' : ''}`}
                                onClick={() => onTabChange('favorite')}
                            >
                                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline font-medium">我的收藏</span>
                                <span
                                    className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${activeTab === 'favorite' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                                >
                                    {favoriteCount}
                                </span>
                            </Button>
                        </Space.Compact>
                    </div>
                </motion.div>

                {/* Search Controls */}
                {!showFavoriteList && !showMonitorList && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex items-center space-x-4 w-full sm:w-auto"
                    >
                        <div className="relative w-full sm:w-80">
                            <div className="flex">
                                <Input
                                    placeholder="搜索基金代码或名称..."
                                    value={searchTerm}
                                    onChange={onSearchChange}
                                    className="flex-1 rounded-r-none"
                                    onKeyDown={(e) =>
                                        e.key === 'Enter' &&
                                        onSearchClick(searchTerm.trim() || undefined)
                                    }
                                    prefix={<Search className="w-4 h-4 text-gray-400" />}
                                />
                                <Button
                                    onClick={() => onSearchClick(searchTerm.trim() || undefined)}
                                    className="rounded-l-none"
                                    type="primary"
                                >
                                    搜索
                                </Button>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button
                                onClick={() => onSortChange()}
                                variant={sortOrder === 'none' ? 'text' : 'solid'}
                                className={`flex items-center justify-center space-x-2 px-3 py-2 sm:px-4 text-sm ${sortOrder === 'none' ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-blue-50 text-blue-700 border-blue-200'}`}
                            >
                                <span className="hidden sm:inline font-medium">按涨跌幅排序</span>
                                <span className="sm:hidden w-full">排序</span>
                                {sortOrder === 'desc' && <ChevronDown className="w-3.5 h-3.5" />}
                                {sortOrder === 'asc' && <ChevronUp className="w-3.5 h-3.5" />}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* 快捷筛选入口 - 指数基金标签和股票基金标签 (独立区域) */}
            {activeTab === 'all' && !showFavoriteList && !showMonitorList && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="flex flex-col items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4"
                >
                    {/* 热门搜索提示文案 */}
                    <div className="w-full mt-2 sm:mt-0">
                        <span className="text-xs text-gray-500 flex items-center flex-wrap gap-2">
                            <span className="whitespace-nowrap">热门搜索：</span>
                            <span
                                onClick={() => {
                                    // 如果当前不是指数基金筛选状态，则切换到指数基金并取消股票基金
                                    if (!isIndexFundFiltered && onToggleIndexFundFilter) {
                                        onToggleIndexFundFilter();
                                        // 如果股票基金当前是选中状态，则取消它
                                        if (isStockFundFiltered && onToggleStockFundFilter) {
                                            onToggleStockFundFilter();
                                        }
                                    } else if (onToggleIndexFundFilter) {
                                        // 如果当前已经是指数基金筛选状态，则取消筛选（恢复显示所有基金）
                                        onToggleIndexFundFilter();
                                    }
                                }}
                                className={`cursor-pointer px-3 py-1 rounded-full transition-all duration-200 hover:shadow-md ${
                                    isIndexFundFiltered
                                        ? 'bg-blue-600 text-white font-medium'
                                        : 'bg-white border border-blue-300 text-blue-600 hover:bg-blue-50'
                                }`}
                            >
                                指数基金
                            </span>
                            <span
                                onClick={() => {
                                    // 如果当前不是股票基金筛选状态，则切换到股票基金并取消指数基金
                                    if (!isStockFundFiltered && onToggleStockFundFilter) {
                                        onToggleStockFundFilter();
                                        // 如果指数基金当前是选中状态，则取消它
                                        if (isIndexFundFiltered && onToggleIndexFundFilter) {
                                            onToggleIndexFundFilter();
                                        }
                                    } else if (onToggleStockFundFilter) {
                                        // 如果当前已经是股票基金筛选状态，则取消筛选（恢复显示所有基金）
                                        onToggleStockFundFilter();
                                    }
                                }}
                                className={`cursor-pointer px-3 py-1 rounded-full transition-all duration-200 hover:shadow-md ${
                                    isStockFundFiltered
                                        ? 'bg-blue-600 text-white font-medium'
                                        : 'bg-white border border-blue-300 text-blue-600 hover:bg-blue-50'
                                }`}
                            >
                                股票基金
                            </span>
                        </span>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
