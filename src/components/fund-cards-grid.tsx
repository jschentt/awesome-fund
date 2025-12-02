'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Bell, Star } from 'lucide-react';
import { Button } from 'antd';
import dayjs from 'dayjs';
import { FundItem } from './fund-list';

interface FundCardsGridProps {
    funds: FundItem[];
    showFundActions: string | null;
    onToggleFundActions: (code: string) => void;
    onHandleSettingsClick: (fund: FundItem) => void;
    onToggleFavorite: (code: string) => void;
    setFavoriteModalOpen: (open: boolean) => void;
    setSelectedFund: (fund: FundItem) => void;
}

export default function FundCardsGrid({
    funds,
    showFundActions,
    onToggleFundActions,
    onHandleSettingsClick,
    onToggleFavorite,
    setFavoriteModalOpen,
    setSelectedFund,
}: FundCardsGridProps) {
    return (
        /* Fund Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
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
                                            onToggleFundActions(fund.code);
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
                                                        onHandleSettingsClick(fund);
                                                        onToggleFundActions(fund.code);
                                                    }}
                                                >
                                                    <Bell className="w-4 h-4 text-blue-600" />
                                                    <span className="text-sm">设置监控</span>
                                                </button>
                                                <button
                                                    className="flex items-center space-x-2 w-full px-4 py-3 text-left hover:bg-gray-50"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        // 对于取消收藏操作，直接执行
                                                        if (fund.isFavorite) {
                                                            onToggleFavorite(fund.code);
                                                            onToggleFundActions(fund.code);
                                                        } else {
                                                            // 对于添加收藏操作，打开确认模态框
                                                            setSelectedFund(fund);
                                                            setFavoriteModalOpen(true);
                                                            onToggleFundActions(fund.code);
                                                        }
                                                    }}
                                                >
                                                    <Star
                                                        className={`w-4 h-4 ${fund.isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-500'}`}
                                                    />
                                                    <span className="text-sm">
                                                        {fund.isFavorite ? '取消收藏' : '添加收藏'}
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
                                        <div className="text-xs text-gray-500 mb-1">预估净值</div>
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
                                    <div className="text-xs text-gray-500 mb-1">日涨跌</div>
                                    <div
                                        className={`text-base font-semibold ${fund.dailyChange && fund.dailyChange.startsWith('+') ? 'text-red-600' : 'text-green-600'}`}
                                    >
                                        {fund.dailyChange}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">涨跌幅</div>
                                    <div
                                        className={`text-base font-semibold ${fund.changePercent && fund.changePercent.startsWith('+') ? 'text-red-600' : 'text-green-600'}`}
                                    >
                                        {fund.changePercent}
                                    </div>
                                </div>
                            </div>

                            {/* 更新时间 */}
                            <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                                更新时间: {dayjs(fund.updateTime).format('YYYY-MM-DD HH:mm:ss')}
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
    );
}
