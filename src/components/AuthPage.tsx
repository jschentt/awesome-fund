'use client';

import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import { useAuth } from '@/app/providers/auth-provider';
import { useRouter } from 'next/navigation';

// 表单数据类型定义
interface FormData {
    email: string;
    code: string;
    password: string;
}

// 验证码倒计时状态类型
type CountdownState = {
    isCounting: boolean;
    seconds: number;
};

// 登录/注册标签类型
type TabType = 'login' | 'register';

const AuthPage: React.FC = () => {
    // 状态管理
    const [activeTab, setActiveTab] = useState<TabType>('login');
    const [formData, setFormData] = useState<FormData>({
        email: '',
        code: '',
        password: '',
    });
    const [countdown, setCountdown] = useState<CountdownState>({
        isCounting: false,
        seconds: 60,
    });
    const [isLoading, setIsLoading] = useState(false);

    // 使用认证上下文和路由
    const { user, session, logout } = useAuth();
    const router = useRouter();

    // 表单验证状态
    const [errors, setErrors] = useState<Partial<FormData>>({
        email: '',
        code: '',
        password: '',
    });

    // 设置带过期时间的本地存储
    const setLocalStorageWithExpiry = (key: string, value: string, ttl: number) => {
        const now = new Date();
        const item = {
            value: value,
            expiry: now.getTime() + ttl,
        };
        localStorage.setItem(key, JSON.stringify(item));
    };

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

    // 邮箱格式验证
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // 实时表单验证
    const validateField = (field: keyof FormData, value: string) => {
        let error = '';

        switch (field) {
            case 'email':
                if (!value) {
                    error = '请输入邮箱';
                } else if (!validateEmail(value)) {
                    error = '请输入有效的邮箱地址';
                }
                break;
            case 'code':
                if (activeTab === 'register' && !value) {
                    error = '请输入验证码';
                } else if (value && value.length !== 6) {
                    error = '验证码必须是6位数字';
                }
                break;
            case 'password':
                if (!value) {
                    error = '请输入密码';
                } else if (value.length < 8) {
                    error = '密码长度不能少于8位';
                }
                break;
            default:
                break;
        }

        setErrors((prev) => ({ ...prev, [field]: error }));
        return !error;
    };

    // 处理输入变化
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        validateField(name as keyof FormData, value);
    };

    // 发送验证码
    const handleSendCode = async () => {
        if (!validateField('email', formData.email)) {
            notification.error({ message: '请输入有效的邮箱地址' });
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch('/api/send-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: formData.email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '发送验证码失败');
            }

            notification.success({ message: '验证码发送成功' });

            // 开始倒计时
            setCountdown({ isCounting: true, seconds: 60 });
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev.seconds <= 1) {
                        clearInterval(timer);
                        return { isCounting: false, seconds: 60 };
                    }
                    return { ...prev, seconds: prev.seconds - 1 };
                });
            }, 1000);
        } catch (error) {
            notification.error({
                message: '发送验证码失败',
                description: error instanceof Error ? error.message : '未知错误',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // 处理注册
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        // 验证所有字段
        const isEmailValid = validateField('email', formData.email);
        const isCodeValid = validateField('code', formData.code);
        const isPasswordValid = validateField('password', formData.password);

        if (!isEmailValid || !isCodeValid || !isPasswordValid) {
            notification.error({ message: '请检查表单填写是否正确' });
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    code: formData.code,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '注册失败');
            }

            notification.success({ message: '注册成功' });

            // 注册成功后将邮箱存入本地存储，24小时有效期
            setLocalStorageWithExpiry('userEmail', formData.email, 24 * 60 * 60 * 1000);

            setActiveTab('login');
            setFormData({ email: '', code: '', password: '' });
        } catch (error) {
            notification.error({
                message: '注册失败',
                description: error instanceof Error ? error.message : '未知错误',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // 处理登录
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        // 验证所有字段
        const isEmailValid = validateField('email', formData.email);
        const isPasswordValid = validateField('password', formData.password);

        if (!isEmailValid || !isPasswordValid) {
            notification.error({ message: '请检查表单填写是否正确' });
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '登录失败');
            }

            notification.success({ message: '登录成功' });

            // 登录成功后将邮箱存入本地存储，24小时有效期
            setLocalStorageWithExpiry('userEmail', formData.email, 24 * 60 * 60 * 1000);

            // 登录成功后立即跳转到首页
            router.replace('/');
        } catch (error) {
            notification.error({
                message: '登录失败',
                description: error instanceof Error ? error.message : '未知错误',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
            <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
                {/* 已登录用户信息展示 */}
                {user && session ? (
                    <div className="text-center space-y-4">
                        <h2 className="text-2xl font-bold text-gray-800">欢迎回来</h2>
                        <p className="text-gray-600">
                            已登录为:{' '}
                            <span className="font-medium text-blue-600">{user.email}</span>
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                            <button
                                onClick={() => router.push('/')}
                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                            >
                                进入首页
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        await logout();
                                    } catch (error) {
                                        console.error('登出失败:', error);
                                    }
                                }}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                            >
                                退出登录
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* 标签切换 */}
                        <div className="flex mb-6 border-b">
                            <button
                                className={`flex-1 py-2 text-center font-medium ${activeTab === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setActiveTab('login')}
                            >
                                登录
                            </button>
                            <button
                                className={`flex-1 py-2 text-center font-medium ${activeTab === 'register' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setActiveTab('register')}
                            >
                                注册
                            </button>
                        </div>

                        {/* 登录表单 */}
                        {activeTab === 'login' && (
                            <form onSubmit={handleLogin} className="space-y-4">
                                {/* 邮箱输入 */}
                                <div className="space-y-2">
                                    <label
                                        htmlFor="login-email"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        邮箱地址
                                    </label>
                                    <input
                                        id="login-email"
                                        type="email"
                                        name="email"
                                        placeholder="your@email.com"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-red-600">{errors.email}</p>
                                    )}
                                </div>

                                {/* 密码输入 */}
                                <div className="space-y-2">
                                    <label
                                        htmlFor="login-password"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        密码
                                    </label>
                                    <input
                                        id="login-password"
                                        type="password"
                                        name="password"
                                        placeholder="请输入密码"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {errors.password && (
                                        <p className="text-sm text-red-600">{errors.password}</p>
                                    )}
                                </div>

                                {/* 登录按钮 */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? '登录中...' : '登录'}
                                </button>
                            </form>
                        )}

                        {/* 注册表单 */}
                        {activeTab === 'register' && (
                            <form onSubmit={handleRegister} className="space-y-4">
                                {/* 邮箱输入 */}
                                <div className="space-y-2">
                                    <label
                                        htmlFor="register-email"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        邮箱地址
                                    </label>
                                    <input
                                        id="register-email"
                                        type="email"
                                        name="email"
                                        placeholder="your@email.com"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-red-600">{errors.email}</p>
                                    )}
                                </div>

                                {/* 验证码输入 */}
                                <div className="space-y-2">
                                    <div className="flex space-x-2">
                                        <div className="flex-1">
                                            <input
                                                id="register-code"
                                                type="text"
                                                name="code"
                                                placeholder="请输入验证码"
                                                value={formData.code}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleSendCode}
                                            disabled={countdown.isCounting || isLoading}
                                            className="px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                        >
                                            {countdown.isCounting
                                                ? `${countdown.seconds}s后重试`
                                                : '发送验证码'}
                                        </button>
                                    </div>
                                    {errors.code && (
                                        <p className="text-sm text-red-600">{errors.code}</p>
                                    )}
                                </div>

                                {/* 密码输入 */}
                                <div className="space-y-2">
                                    <label
                                        htmlFor="register-password"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        密码
                                    </label>
                                    <input
                                        id="register-password"
                                        type="password"
                                        name="password"
                                        placeholder="请输入密码"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {errors.password && (
                                        <p className="text-sm text-red-600">{errors.password}</p>
                                    )}
                                </div>

                                {/* 注册按钮 */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? '注册中...' : '注册'}
                                </button>
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AuthPage;
