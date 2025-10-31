'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
// 使用原生HTML元素代替不存在的组件

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 检查用户是否已登录
  const checkUserSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/');
      }
    } catch (err) {
      console.error('检查登录状态失败:', err);
    }
  };

  // 组件挂载时检查用户登录状态
  useEffect(() => {
    checkUserSession();
  }, [router]);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '发送Magic Link失败');
      }

      setSuccess(data.message);
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '服务器错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md">
        <div className="mb-6">
          <h2 className="text-center text-2xl font-bold mb-2">使用邮箱登录</h2>
          <p className="text-center text-gray-600">
            我们将发送一个Magic Link到您的邮箱
          </p>
        </div>
        <div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                邮箱地址
              </label>
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-2 border rounded"
                disabled={loading}
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm font-medium">{error}</div>
            )}
            {success && (
              <div className="text-green-500 text-sm font-medium">{success}</div>
            )}
          </form>
        </div>
        <div className="mt-6">
          <button type="submit" onClick={handleSubmit} disabled={loading} className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded">
            {loading ? '发送中...' : '发送Magic Link'}
          </button>
        </div>
      </div>
    </div>
  );
}