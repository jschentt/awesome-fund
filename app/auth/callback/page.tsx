'use client';

// 这是一个极简的认证回调页面，只在浏览器中执行重定向
// 完全避免在服务器端预渲染时执行任何可能导致错误的代码
export default function CallbackPage() {
  // 使用原生JavaScript立即在客户端执行重定向
  // 这确保了只有在浏览器环境中才会执行，完全绕过服务器端预渲染
  if (typeof window !== 'undefined') {
    // 获取当前URL的查询参数
    const searchParams = new URLSearchParams(window.location.search);
    
    // 构建重定向URL，将所有查询参数传递给客户端路由
    // 使用哈希路由来确保这完全在客户端处理
    const hashParams = Array.from(searchParams.entries())
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    // 重定向到哈希路由，这样Next.js就不会尝试预渲染它
    window.location.href = `/auth/client-callback#${hashParams}`;
  }

  // 对于服务器端渲染，返回一个简单的加载状态
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="text-xl text-gray-600">处理认证中...</div>
    </div>
  );
}
