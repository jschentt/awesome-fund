import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 处理Magic Link回调
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token_hash = url.searchParams.get('token_hash');
    const type = url.searchParams.get('type');
    const next = '/'; // 登录成功后重定向的默认路径

    if (token_hash && type === 'email') {
      // 使用Supabase验证Magic Link令牌
      const { error } = await supabase.auth.verifyOtp({
        type: 'email',
        token_hash,
      });

      if (error) {
        // 验证失败，重定向到错误页面
        return NextResponse.redirect(new URL(`/auth/error?message=${encodeURIComponent(error.message)}`, request.url));
      }

      // 验证成功，重定向到首页
      return NextResponse.redirect(new URL(next, request.url));
    }

    // 参数不完整，重定向到错误页面
    return NextResponse.redirect(new URL('/auth/error', request.url));
  } catch (error) {
    return NextResponse.redirect(new URL('/auth/error', request.url));
  }
}