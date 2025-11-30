'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { Button } from 'antd';
import { FundItem } from './fund-list';

interface AddFavoriteModalProps {
    open: boolean;
    onClose: () => void;
    selectedFund: FundItem | null;
    onConfirmAddToFavorite: () => void;
}

export default function AddFavoriteModal({
    open,
    onClose,
    selectedFund,
    onConfirmAddToFavorite,
}: AddFavoriteModalProps) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={onClose}
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
                                    onClose();
                                }}
                            >
                                取消
                            </Button>
                            <Button
                                className="bg-yellow-500 hover:bg-yellow-600 text-white"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onConfirmAddToFavorite();
                                }}
                            >
                                确认添加
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
