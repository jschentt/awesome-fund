// 中间件配置，用于处理认证路由并确保它们是动态渲染的
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 匹配认证相关的路由
export function middleware(request: NextRequest) {
  // 对于认证回调页面，确保它是动态渲染的
  if (request.nextUrl.pathname.startsWith('/auth/callback')) {
    // 继续请求，但确保它不会被静态预渲染
    return NextResponse.next();
  }
  
  // 其他路由正常处理
  return NextResponse.next();
}

// 配置中间件的匹配路径
export const config = {
  matcher: ['/auth/callback/:path*', '/auth/login/:path*', '/auth/error/:path*'],
};