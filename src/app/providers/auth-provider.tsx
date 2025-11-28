'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

// 定义认证上下文类型
interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    error: string | null;
    logout: () => Promise<void>;
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证Provider组件
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 初始化时检查用户会话
    useEffect(() => {
        const checkSession = async () => {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                setSession(session);
                setUser(session?.user || null);
            } catch (err) {
                setError(err instanceof Error ? err.message : '获取用户会话失败');
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        // 监听认证状态变化
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user || null);
        });

        // 清理监听器
        return () => authListener.subscription.unsubscribe();
    }, []);

    // 退出登录函数
    const logout = async () => {
        try {
            // 先清除本地状态，确保UI立即更新
            setUser(null);
            setSession(null);

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
            setSession(null);
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
        session,
        loading,
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
