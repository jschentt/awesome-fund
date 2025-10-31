'use client';

import React, { useEffect, useState } from 'react';

export default function AuthErrorPage() {
  const [errorMessage, setErrorMessage] = useState<string>('登录过程中发生错误');
  
  useEffect(() => {
    // 客户端获取URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error') || urlParams.get('message') || '登录验证失败，请重试';
    if (error) {
      setErrorMessage(error);
    }
  }, []);
  
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md">
        <div className="mb-6">
          <h2 className="text-center text-2xl font-bold text-red-500">登录失败</h2>
        </div>
        <div>
          <p className="text-center text-gray-600 mb-6">{errorMessage}</p>
          <div className="flex justify-center">
            <a href="/auth/login" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
              返回登录页
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}