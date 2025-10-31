'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // 从URL获取可能的认证参数
        const code = searchParams.get('code');
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');

        // 处理认证回调
        const handleCallback = async () => {
            try {
                // 检查是否有错误参数
                const errorParam = searchParams.get('error');
                const errorDescription = searchParams.get('error_description');
                
                if (errorParam || errorDescription) {
                    throw new Error(errorDescription || errorParam || '认证失败');
                }
                
                // 同时支持OAuth回调(code参数)和Magic Link回调(token_hash参数)
                if (code) {
                    // OAuth流程 - 使用exchangeCodeForSession
                    const { error: authError } = await supabase.auth.exchangeCodeForSession(code);
                    if (authError) {
                        throw new Error(`OAuth认证失败: ${authError.message}`);
                    }
                } else if (tokenHash && type === 'email') {
                    // Magic Link流程 - 使用verifyOtp
                    const { error: authError } = await supabase.auth.verifyOtp({
                        type: 'email',
                        token_hash: tokenHash
                    });
                    if (authError) {
                        throw new Error(`邮箱验证失败: ${authError.message}`);
                    }
                } else {
                    // 如果没有有效的认证参数，检查是否已经有活动会话
                    const { data, error: sessionError } = await supabase.auth.getSession();
                    if (sessionError || !data.session) {
                        throw new Error('没有找到有效的认证信息，请重新登录');
                    }
                }

                // 认证成功
                setSuccess(true);
                // 延迟重定向，让用户看到成功消息
                setTimeout(() => {
                    router.replace('/');
                }, 2000);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : '认证过程中发生错误';
                setError(errorMessage);
                console.error('认证回调错误:', errorMessage);
                // 延迟重定向到错误页面
                setTimeout(() => {
                    router.push(
                        `/auth/error?message=${encodeURIComponent(errorMessage)}`,
                    );
                }, 3000);
            } finally {
                setLoading(false);
            }
        };

        handleCallback();
    }, [searchParams, router]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">正在处理登录...</h1>
                    <p className="text-gray-600">请稍候，我们正在验证您的身份。</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
                <div className="text-center max-w-md">
                    <h1 className="text-2xl font-bold text-red-500 mb-4">登录失败</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <p className="text-sm text-gray-500">正在重定向到错误页面...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
            <div className="text-center max-w-md">
                <h1 className="text-2xl font-bold text-green-500 mb-4">登录成功!</h1>
                <p className="text-gray-600 mb-6">您已成功登录，正在重定向到首页...</p>
            </div>
        </div>
    );
}
