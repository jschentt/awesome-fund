import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';
import { CardHeader } from '@/components/ui/card';
import { CardTitle } from '@/components/ui/card';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || '登录验证失败，请重试';

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-red-500">登录失败</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-600 mb-6">{message}</p>
          <div className="flex justify-center">
            <Button asChild>
              <a href="/auth/login">返回登录页</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}