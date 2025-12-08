'use client';

import { useState } from 'react';
import { useAuth } from '@/app/providers/auth-provider';
import Link from 'next/link';
import { Spin } from 'antd';

export default function Navbar() {
    const { user, vipInfo, logout } = useAuth();
    const [logoutLoading, setLogoutLoading] = useState(false);

    const handleLogout = async () => {
        setLogoutLoading(true);
        try {
            await logout();
        } catch (error) {
            console.error('登出失败:', error);
        } finally {
            setLogoutLoading(false);
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
            <div className="container mx-auto px-4 flex h-16 items-center justify-between">
                <div className="flex items-center gap-2">
                    {/* 左侧 Logo 区域 */}
                    <span className="text-lg font-bold text-gray-800">小基守望</span>
                </div>
                <div className="flex items-center gap-4">
                    {user?.email ? (
                        <>
                            <div className="flex items-center gap-2 relative group">
                                <span className="text-sm font-medium">欢迎, {user?.email}</span>
                                {/* 会员等级标记 */}
                                {(() => {
                                    if (!user) {
                                        return null;
                                    }

                                    const planCode = vipInfo?.plan_code;

                                    const badge =
                                        planCode === 'year' ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                <span className="w-2 h-2 rounded-full bg-yellow-500 mr-1 animate-pulse"></span>
                                                年度会员
                                            </span>
                                        ) : planCode === 'month' ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                <span className="w-2 h-2 rounded-full bg-blue-500 mr-1 animate-pulse"></span>
                                                月度会员
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <span className="w-2 h-2 rounded-full bg-green-500 mr-1 animate-pulse"></span>
                                                免费会员
                                            </span>
                                        );

                                    const tooltip =
                                        planCode === 'year' ? (
                                            <div className="absolute top-full left-0 mt-2 w-64 hidden group-hover:block bg-white border border-yellow-200 rounded-lg p-3 shadow-lg z-50">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-semibold text-yellow-800">
                                                        年度会员
                                                    </span>
                                                </div>
                                                <ul className="text-xs text-yellow-700 space-y-1">
                                                    <li>• 无限基金监控</li>
                                                    <li>• 实时涨跌提醒</li>
                                                    <li>• 每日更新多次</li>
                                                    <li>• 优先技术支持</li>
                                                    <li>• 专属客服</li>
                                                </ul>
                                            </div>
                                        ) : planCode === 'month' ? (
                                            <div className="absolute top-full left-0 mt-2 w-64 hidden group-hover:block bg-white border border-blue-200 rounded-lg p-3 shadow-lg z-50">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-semibold text-blue-800">
                                                        月度会员
                                                    </span>
                                                </div>
                                                <ul className="text-xs text-blue-700 space-y-1">
                                                    <li>• 无限基金监控</li>
                                                    <li>• 实时涨跌提醒</li>
                                                    <li>• 每日更新多次</li>
                                                    <li>• 优先技术支持</li>
                                                </ul>
                                            </div>
                                        ) : (
                                            <div className="absolute top-full left-0 mt-2 w-64 hidden group-hover:block bg-white border border-gray-200 rounded-lg p-3 shadow-lg z-50">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-semibold text-gray-800">
                                                        免费版
                                                    </span>
                                                </div>
                                                <ul className="text-xs text-gray-600 space-y-1">
                                                    <li>• 最多监控3只基金</li>
                                                    <li>• 基本涨跌提醒</li>
                                                    <li>• 每日更新一次</li>
                                                </ul>
                                            </div>
                                        );

                                    return (
                                        <>
                                            {badge}
                                            {tooltip}
                                        </>
                                    );
                                })()}
                            </div>
                            <button
                                onClick={handleLogout}
                                disabled={logoutLoading}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded flex items-center justify-center gap-2"
                            >
                                {logoutLoading ? (
                                    <>
                                        <Spin size="small" className="mr-1" />
                                        <span>退出中</span>
                                    </>
                                ) : (
                                    '退出登录'
                                )}
                            </button>
                        </>
                    ) : (
                        <Link
                            href="/auth/login"
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                        >
                            登录/注册
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
