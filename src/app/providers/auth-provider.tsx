'use client';

import { createContext, useContext, useState, useEffect, ReactNode, use } from 'react';
import { User } from '@supabase/supabase-js';
import { getLocalStorageWithExpiry } from '@/lib/utils';

// 定义认证上下文类型
interface AuthContextType {
    user: User | null;
    error: string | null;
    logout: () => Promise<void>;
    vipInfo: {
        plan_code: string;
        plan_name: string;
    };
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证Provider组件
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);

    // 添加窗口焦点事件，确保页面重新获得焦点时也能更新用户信息
    useEffect(() => {
        const handleFocus = () => {
            const userInfo = getLocalStorageWithExpiry('userInfo');
            setUser(userInfo || null);
            if (userInfo?.id) {
                getVipInfo();
            }
        };

        // 立即执行一次，确保首次加载时同步状态
        handleFocus();

        // 监听浏览器标签页切换、页面可见性变化以及 pageshow，确保任何回到页面的动作都能同步缓存
        const onVisibilityOrFocus = () => {
            if (!document.hidden) handleFocus();
        };
        window.addEventListener('focus', handleFocus);
        window.addEventListener('pageshow', handleFocus);
        document.addEventListener('visibilitychange', onVisibilityOrFocus);

        // 同时轮询 localStorage，若其它标签页修改了 userInfo，也能实时同步
        const storagePoll = setInterval(() => {
            const latest = getLocalStorageWithExpiry('userInfo');
            if (JSON.stringify(latest) !== JSON.stringify(user)) {
                setUser(latest || null);
            }
        }, 1000);

        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('pageshow', handleFocus);
            document.removeEventListener('visibilitychange', onVisibilityOrFocus);
            clearInterval(storagePoll);
        };
    }, []);

    const [vipInfo, setVipInfo] = useState<AuthContextType['vipInfo']>({
        plan_code: '',
        plan_name: '',
    });

    const getVipInfo = async () => {
        const userInfo = getLocalStorageWithExpiry('userInfo');

        if (!userInfo?.id) return;

        try {
            const res = await fetch('/api/vip', {
                method: 'GET',
                headers: {
                    'X-User-Id': userInfo.id,
                },
            });
            const data = await res.json();
            setVipInfo(data.data);
        } catch (error) {
            console.error('获取会员信息失败:', error);
        }
    };

    useEffect(() => {
        // 每30秒轮询一次VIP信息，确保user存在时才调用API
        const interval = setInterval(() => {
            getVipInfo();
        }, 30 * 1000);

        return () => clearInterval(interval);
    }, []);

    // 退出登录函数
    const logout = async () => {
        try {
            // 先清除本地状态，确保UI立即更新
            setUser(null);

            // 清除localStorage中所有缓存信息
            console.log('正在清除localStorage缓存...');
            localStorage.clear();
            console.log('localStorage缓存已清除');

            // 然后调用API执行服务器端登出
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '退出登录失败');
            }

            // 强制刷新页面到登录页，确保所有状态都被清除
            setTimeout(() => {
                window.location.replace('/auth/login');
            }, 100);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '退出登录失败';
            setError(errorMessage);
            console.error('登出错误:', err);

            // 即使发生错误，仍然尝试清除本地状态、localStorage缓存并重定向
            setUser(null);
            try {
                localStorage.clear();
            } catch (storageErr) {
                console.error('清除localStorage失败:', storageErr);
            }

            setTimeout(() => {
                window.location.replace('/auth/login');
            }, 100);
        }
    };

    const value = {
        user,
        vipInfo,
        error,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 自定义Hook用于在组件中访问认证状态
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
