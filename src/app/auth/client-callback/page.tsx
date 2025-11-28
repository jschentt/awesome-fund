'use client';

import { useEffect, useState } from 'react';
import Loading from '@/components/loading';

// 这个页面只在客户端执行，专门处理认证回调逻辑
export default function ClientCallbackPage() {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState<string>('');

    useEffect(() => {
        // 确保只在浏览器环境中执行
        if (typeof window === 'undefined') return;

        // 从哈希中提取参数
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        // 处理认证回调
        const handleCallback = async () => {
            try {
                // 动态导入supabase客户端，避免在初始加载时导入
                const { supabase } = await import('@/lib/supabase');

                // 获取认证参数
                const code = hashParams.get('code');
                const tokenHash = hashParams.get('token_hash');
                const type = hashParams.get('type');
                const errorParam = hashParams.get('error');
                const errorDescription = hashParams.get('error_description');

                if (errorParam || errorDescription) {
                    throw new Error(errorDescription || errorParam || '认证失败');
                }

                // 处理OAuth回调
                if (code) {
                    const result = await supabase.auth.exchangeCodeForSession(code);
                    if (result.error) {
                        throw new Error(`OAuth认证失败: ${result.error.message}`);
                    }
                }
                // 处理Magic Link回调
                else if (tokenHash && type === 'email') {
                    const result = await supabase.auth.verifyOtp({
                        type: 'email',
                        token_hash: tokenHash,
                    });
                    if (result.error) {
                        throw new Error(`邮箱验证失败: ${result.error.message}`);
                    }
                }
                // 检查是否已有活动会话
                else {
                    const { data, error: sessionError } = await supabase.auth.getSession();
                    if (sessionError || !data.session) {
                        throw new Error('没有找到有效的认证信息，请重新登录');
                    }
                }

                // 认证成功，检查会话并重定向到首页
                const { data } = await supabase.auth.getSession();
                if (data.session) {
                    setStatus('success');
                    // 延迟重定向
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 2000);
                } else {
                    throw new Error('无法验证会话');
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : '处理回调时发生错误';
                setErrorMessage(message);
                setStatus('error');
            }
        };

        handleCallback();
    }, []);

    // 显示不同的状态UI
    switch (status) {
        case 'loading':
            return <Loading fullScreen text="正在处理认证" type="spinner" size="large" />;
        case 'success':
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                    <div className="text-2xl font-bold text-green-600 mb-4">登录成功!</div>
                    <div className="text-gray-600 mb-6">您已成功登录，正在重定向到首页...</div>
                </div>
            );
        case 'error':
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
                    <div className="text-2xl font-bold text-red-600 mb-4">登录失败</div>
                    <div className="text-gray-600 mb-6">{errorMessage}</div>
                    <button
                        onClick={() => (window.location.href = '/auth/login')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        返回登录页
                    </button>
                </div>
            );
        default:
            return null;
    }
}
