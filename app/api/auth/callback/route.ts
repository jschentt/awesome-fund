import { NextResponse } from 'next/server';

// 处理认证回调，将所有请求重定向到客户端callback页面
export async function GET(request: Request) {
  try {
    // 获取当前URL的查询参数
    const url = new URL(request.url);
    const params = url.searchParams;
    
    // 构建重定向URL，保留所有查询参数
    const redirectUrl = new URL('/auth/callback', request.url);
    
    // 复制所有查询参数
    params.forEach((value, key) => {
      redirectUrl.searchParams.set(key, value);
    });
    
    // 重定向到客户端callback页面
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('回调重定向错误:', error);
    // 出现错误时重定向到错误页面
    return NextResponse.redirect(new URL('/auth/error?message=处理回调时发生错误', request.url));
  }
}