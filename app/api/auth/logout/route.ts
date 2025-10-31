import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// 处理用户注销请求
export async function POST(request: Request) {
  try {
    // 创建带cookies的Supabase客户端
    const supabase = createRouteHandlerClient({ cookies });
    
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: '成功退出登录' });
  } catch (error) {
    console.error('退出登录错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}