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

    // 会员等级标记
    const renderVipBadge = () => {
        if (!user) return null;

        const planCode = vipInfo?.plan_code;
        const getBadgeContent = () => {
            switch (planCode) {
                case 'year':
                    return {
                        bg: 'bg-yellow-100',
                        text: 'text-yellow-800',
                        dot: 'bg-yellow-500',
                        label: '年度会员',
                        shortLabel: '年',
                    };
                case 'month':
                    return {
                        bg: 'bg-blue-100',
                        text: 'text-blue-800',
                        dot: 'bg-blue-500',
                        label: '月度会员',
                        shortLabel: '月',
                    };
                default:
                    return {
                        bg: 'bg-green-100',
                        text: 'text-green-800',
                        dot: 'bg-green-500',
                        label: '免费会员',
                        shortLabel: '免',
                    };
            }
        };

        const { bg, text, dot, label, shortLabel } = getBadgeContent();

        return (
            <span
                className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${bg} ${text} cursor-default`}
            >
                <span
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${dot} mr-0.5 sm:mr-1 animate-pulse`}
                ></span>
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden text-sm">{shortLabel}</span>
            </span>
        );
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
            <div className="container mx-auto px-3 sm:px-4 flex h-16 items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-bold text-gray-800">小基守望</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                    {user?.email ? (
                        <>
                            <div className="flex items-center gap-1 sm:gap-2">
                                <span className="hidden sm:inline text-sm font-medium">
                                    欢迎, {user?.email.split('@')[0]}
                                </span>
                                {renderVipBadge()}
                            </div>
                            <button
                                onClick={handleLogout}
                                disabled={logoutLoading}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 sm:px-4 py-1.5 sm:py-2 rounded flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm min-w-[60px]"
                            >
                                {logoutLoading ? (
                                    <>
                                        <Spin size="small" className="mr-0.5" />
                                        <span className="hidden sm:inline">退出中</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="hidden sm:inline">退出登录</span>
                                        <span className="sm:hidden">退出</span>
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <Link
                            href="/auth/login"
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm"
                        >
                            登录/注册
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
