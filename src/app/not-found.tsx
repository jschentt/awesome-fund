"use client";

import { Alert } from 'antd';
import { useRouter } from 'next/navigation';

/**
 * 404页面组件
 * 用于处理资源不存在的情况
 */
export default function NotFound() {
  const router = useRouter();

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Alert
        message="页面不存在"
        description="抱歉，您访问的页面不存在或已被移除"
        type="warning"
        showIcon
        className="max-w-md w-full mb-4"
      />
      <button
        onClick={handleGoHome}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        返回首页
      </button>
    </div>
  );
}
