import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 处理Magic Link发送请求
export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: '邮箱地址不能为空' }, { status: 400 });
        }

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: '请输入有效的邮箱地址' }, { status: 400 });
        }

        // 获取origin header
        const origin = request.headers.get('origin');
        if (!origin) {
            return NextResponse.json({ error: '无法确定重定向地址' }, { status: 500 });
        }

        // 使用Supabase的Magic Link认证功能
        const callbackPath = '/auth/client-callback';
        const redirectUrl = `${origin}${callbackPath}`;
        
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: redirectUrl,
            },
        });

        if (error) {
            console.error('Supabase error:', error);
            // 根据错误类型返回适当的状态码
            if (error.message.includes('invalid')) {
                return NextResponse.json({ error: error.message }, { status: 400 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            message: 'Magic Link已发送到您的邮箱，请查收',
        });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({ error: '服务器错误' }, { status: 500 });
    }
}
