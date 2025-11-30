'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check } from 'lucide-react';
import { Button } from 'antd';
import { FundItem } from './fund-list';

interface MonitoringModalProps {
    open: boolean;
    onClose: () => void;
    selectedFund: FundItem | null;
    selectedMethods: { dingtalk: boolean; wechat: boolean };
    onMethodChange: (method: 'dingtalk' | 'wechat') => void;
    onConfirmMonitoring: () => void;
}

export default function MonitoringModal({
    open,
    onClose,
    selectedFund,
    selectedMethods,
    onMethodChange,
    onConfirmMonitoring,
}: MonitoringModalProps) {
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
                                    onClick={() => onMethodChange('dingtalk')}
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
                                    onClick={() => onMethodChange('wechat')}
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
                                    onClose();
                                }}
                            >
                                取消
                            </Button>
                            <Button
                                className={`${(selectedMethods.dingtalk || selectedMethods.wechat) === false ? 'bg-blue-100 text-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onConfirmMonitoring();
                                }}
                                disabled={
                                    (selectedMethods.dingtalk || selectedMethods.wechat) === false
                                }
                            >
                                确认监控
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
