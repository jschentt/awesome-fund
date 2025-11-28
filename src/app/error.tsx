"use client";

import { useEffect } from 'react';
import { Alert } from 'antd';

/**
 * 全局错误处理组件
 * 用于捕获App Router中的运行时错误
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // 记录错误到控制台
    console.error('应用错误:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Alert
        message="应用发生错误"
        description={error.message || '未知错误'}
        type="error"
        showIcon
        className="max-w-md w-full mb-4"
      />
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        重试
      </button>
    </div>
  );
}
