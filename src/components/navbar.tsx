'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers/auth-provider';
import Link from 'next/link';
import { Spin } from 'antd';

export default function Navbar() {
    const { user, loading, logout } = useAuth();
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [cachedEmail, setCachedEmail] = useState<string | null>(null);

    // 获取本地存储的值（检查是否过期）
    const getLocalStorageWithExpiry = (key: string): string | null => {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) {
            return null;
        }

        const item = JSON.parse(itemStr);
        const now = new Date();

        if (now.getTime() > item.expiry) {
            localStorage.removeItem(key);
            return null;
        }

        return item.value;
    };

    // 组件挂载时获取缓存的邮箱
    useEffect(() => {
        const email = getLocalStorageWithExpiry('userEmail');
        setCachedEmail(email);
    }, []);

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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-16">
                <Spin tip="加载中" size="small" />
            </div>
        );
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
            <div className="container mx-auto px-4 flex h-16 items-center justify-between">
                <div className="flex items-center gap-2"></div>
                <div className="flex items-center gap-4">
                    {cachedEmail || user ? (
                        <>
                            <span className="text-sm font-medium">
                                欢迎, {cachedEmail || user?.email}
                            </span>
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
