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
    sortOrder: 'desc' | 'asc' | 'none';
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
    sortOrder,
}: FundStatsAndSearchProps) {
    return (
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0 mb-8">
            {/* Stats Tabs */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white border border-gray-200 rounded-lg p-1 shadow-sm lg:w-auto w-full"
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
                    className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 lg:ml-auto w-full sm:w-auto"
                >
                    <div className="relative w-full sm:w-80">
                        <Input
                            placeholder="搜索基金代码或名称..."
                            value={searchTerm}
                            onChange={onSearchChange}
                            className="w-full"
                            prefix={<Search className="w-4 h-4 text-gray-400" />}
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button
                            onClick={() => onSortChange()}
                            variant={sortOrder === 'none' ? 'text' : 'solid'}
                            className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-3 py-2 sm:px-4 text-sm ${sortOrder === 'none' ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-blue-50 text-blue-700 border-blue-200'}`}
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
    );
}
