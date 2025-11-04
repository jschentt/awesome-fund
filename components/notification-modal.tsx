'use client';

import React, { useState } from 'react';
import { Bell } from 'lucide-react';

interface NotificationModalProps {
    onClose: () => void;
    fundName: string;
}

export default function NotificationModal({ onClose, fundName }: NotificationModalProps) {
    const [selectedMethods, setSelectedMethods] = useState<{ dingtalk: boolean; wechat: boolean }>({
        dingtalk: false,
        wechat: false,
    });

    const handleMethodChange = (method: 'dingtalk' | 'wechat') => {
        setSelectedMethods((prev) => ({
            ...prev,
            [method]: !prev[method],
        }));
    };

    const handleConfirm = () => {
        // 检查是否至少选择了一种推送方式
        if (selectedMethods.dingtalk || selectedMethods.wechat) {
            // 这里可以添加实际的监控设置逻辑
            console.log('设置监控:', { fundName, selectedMethods });
            onClose();
        }
        // 如果没有选择，不执行任何操作，让用户看到提示信息
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // 模态框由父组件控制渲染，不需要额外的isOpen检查

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={handleBackdropClick}
        >
            <div
                className="bg-white rounded-lg p-5 sm:p-6 w-full max-w-md mx-4 shadow-lg"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 弹窗头部 */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <Bell className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">设置监控通知</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="关闭"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* 弹窗内容 */}
                <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-3">为{fundName}设置消息推送方式</p>
                </div>

                {/* 推送方式选择 */}
                <div className="space-y-4 mb-5">
                    {/* 钉钉推送 */}
                    <div className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                        <input
                            type="checkbox"
                            id="dingtalk"
                            checked={selectedMethods.dingtalk}
                            onChange={() => handleMethodChange('dingtalk')}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="ml-3 flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center text-blue-600">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                            </div>
                            <label
                                htmlFor="dingtalk"
                                className="text-sm text-gray-700 cursor-pointer"
                            >
                                钉钉推送
                            </label>
                        </div>
                        <p className="ml-auto text-xs text-gray-500">通过钉钉接收基金动态通知</p>
                    </div>

                    {/* 微信推送 */}
                    <div className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                        <input
                            type="checkbox"
                            id="wechat"
                            checked={selectedMethods.wechat}
                            onChange={() => handleMethodChange('wechat')}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <div className="ml-3 flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-md bg-green-100 flex items-center justify-center text-green-600">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                            </div>
                            <label
                                htmlFor="wechat"
                                className="text-sm text-gray-700 cursor-pointer"
                            >
                                微信推送
                            </label>
                        </div>
                        <p className="ml-auto text-xs text-gray-500">通过微信接收基金动态通知</p>
                    </div>
                </div>

                {/* 提示信息 */}
                {!(selectedMethods.dingtalk || selectedMethods.wechat) && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-md mb-5">
                        <p className="text-sm">请至少选择一种推送方式</p>
                    </div>
                )}

                {/* 底部按钮 */}
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        确认监控
                    </button>
                </div>
            </div>
        </div>
    );
}
