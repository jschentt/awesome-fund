'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Search, Eye, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from 'antd';

interface FundStatsAndSearchProps {
    activeTab: 'all' | 'monitoring' | 'favorite';
    total: number | undefined;
    monitoringFunds: number;
    favoriteFunds: number;
    showFavoriteList: boolean;
    onTabChange: (tab: 'all' | 'monitoring' | 'favorite') => void;
    onSortChange: () => void;
    searchTerm: string;
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    sortOrder: 'desc' | 'asc' | 'none';
}

export default function FundStatsAndSearch({
    activeTab,
    total,
    monitoringFunds,
    favoriteFunds,
    showFavoriteList,
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
                className="bg-white border border-gray-200 rounded-lg p-1 shadow-sm"
            >
                <div className="flex flex-col sm:flex-row">
                    <Button
                        variant={activeTab === 'all' ? 'solid' : 'text'}
                        className={`flex items-center space-x-2 px-4 py-2 w-full sm:w-auto ${activeTab === 'all' ? 'bg-blue-50 border-blue-200 text-blue-700 rounded-md' : ''}`}
                        onClick={() => onTabChange('all')}
                    >
                        <span className="text-sm font-medium">全部基金</span>
                        <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${activeTab === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                        >
                            {total}
                        </span>
                    </Button>
                    <Button
                        variant={activeTab === 'monitoring' ? 'solid' : 'text'}
                        className={`flex items-center space-x-2 px-4 py-2 w-full sm:w-auto ${activeTab === 'monitoring' ? 'bg-blue-50 border-blue-200 text-blue-700 rounded-md' : ''}`}
                        onClick={() => onTabChange('monitoring')}
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
                        onClick={() => onTabChange('favorite')}
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
                            onChange={onSearchChange}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    </div>
                    <Button
                        onClick={() => onSortChange()}
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
    );
}
