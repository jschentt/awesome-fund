'use client';

import { useState } from 'react';
import { useAuth } from '@/app/providers/auth-provider';

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

  // 简单的弹窗组件
  const SimpleDialog = ({ 
    open, 
    onClose, 
    children 
  }: { 
    open: boolean; 
    onClose: () => void; 
    children: React.ReactNode 
  }) => {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
          {children}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">基金监测列表</h1>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm font-medium">欢迎, {user.email}</span>
                <button 
                  onClick={handleLogout}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
                >
                  退出登录
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setShowDialog(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                  邮箱登录
                </button>
                
                <SimpleDialog open={showDialog} onClose={() => setShowDialog(false)}>
                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold">Magic Link 登录</h3>
                      <p className="text-gray-600 text-sm">
                        输入您的邮箱，我们将发送一个登录链接
                      </p>
                    </div>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium block">
                          邮箱地址
                        </label>
                        <input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                          autoFocus
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      {message && (
                        <div className={`text-sm font-medium ${message.includes('已发送') ? 'text-green-500' : 'text-red-500'}`}>
                          {message}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <button 
                        type="button" 
                        onClick={() => setShowDialog(false)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
                      >
                        取消
                      </button>
                      <button 
                        type="button" 
                        onClick={handleSendMagicLink} 
                        disabled={sendLoading}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                      >
                        {sendLoading ? '发送中...' : '发送登录链接'}
                      </button>
                    </div>
                  </div>
                </SimpleDialog>
              </>
            )}
          </div>
        </div>
      </header>
    );
}