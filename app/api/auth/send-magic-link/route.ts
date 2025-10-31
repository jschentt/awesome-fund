import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 处理Magic Link发送请求
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: '邮箱地址不能为空' }, { status: 400 });
    }

    // 使用Supabase的Magic Link认证功能
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${request.headers.get('origin')}/auth/callback`,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Magic Link已发送到您的邮箱，请查收',
    });
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}