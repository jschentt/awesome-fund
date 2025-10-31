'use client';

import { useState } from 'react';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';
import { CardDescription } from '@/components/ui/card';
import { CardFooter } from '@/components/ui/card';
import { CardHeader } from '@/components/ui/card';
import { CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 检查用户是否已登录
  const checkUserSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      redirect('/');
    }
  };

  // 组件挂载时检查用户登录状态
  useState(() => checkUserSession());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">使用邮箱登录</CardTitle>
          <CardDescription className="text-center">
            我们将发送一个Magic Link到您的邮箱
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                邮箱地址
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
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
        </CardContent>
        <CardFooter>
          <Button type="submit" onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? '发送中...' : '发送Magic Link'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}