'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

interface FundEmptyStateProps {
    showFunds: boolean;
    h5Loading?: boolean;
}

export default function FundEmptyState({ showFunds, h5Loading }: FundEmptyStateProps) {
    if (showFunds) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
        >
            <div className="bg-gray-100 rounded-full p-4 mb-4">
                {h5Loading ? (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    >
                        <Search className="w-8 h-8 text-gray-400" />
                    </motion.div>
                ) : (
                    <Search className="w-8 h-8 text-gray-400" />
                )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
                {h5Loading ? '正在加载基金...' : '未找到基金'}
            </h3>
            <p className="text-gray-500 max-w-md">
                {h5Loading
                    ? '请稍等，正在获取最新基金数据'
                    : '请尝试调整搜索条件或选择其他标签页查看基金列表'}
            </p>
        </motion.div>
    );
}
