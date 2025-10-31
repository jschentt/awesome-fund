'use client';

import { useState } from 'react';
import { useAuth } from '@/app/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';
import { CardDescription } from '@/components/ui/card';
import { CardFooter } from '@/components/ui/card';
import { CardHeader } from '@/components/ui/card';
import { CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { DialogContent } from '@/components/ui/dialog';
import { DialogDescription } from '@/components/ui/dialog';
import { DialogFooter } from '@/components/ui/dialog';
import { DialogHeader } from '@/components/ui/dialog';
import { DialogTitle } from '@/components/ui/dialog';
import { DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleSendMagicLink = async () => {
    if (!email) {
      setMessage('请输入邮箱地址');
      return;
    }

    setSendLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setEmail('');
        setTimeout(() => setShowDialog(false), 3000);
      } else {
        setMessage(data.error || '发送失败');
      }
    } catch (error) {
      setMessage('服务器错误');
    } finally {
      setSendLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">基金监测列表</h1>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm font-medium">欢迎, {user.email}</span>
              <Button variant="secondary" onClick={handleLogout}>
                退出登录
              </Button>
            </>
          ) : (
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button>邮箱登录</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Magic Link 登录</DialogTitle>
                  <DialogDescription>
                    输入您的邮箱，我们将发送一个登录链接
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
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
                      autoFocus
                    />
                  </div>
                  {message && (
                    <div className={`text-sm font-medium ${message.includes('已发送') ? 'text-green-500' : 'text-red-500'}`}>
                      {message}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="secondary" onClick={() => setShowDialog(false)}>
                    取消
                  </Button>
                  <Button type="button" onClick={handleSendMagicLink} disabled={sendLoading}>
                    {sendLoading ? '发送中...' : '发送登录链接'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </header>
  );
}