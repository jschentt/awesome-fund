import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 处理用户注销请求
export async function POST(request: Request) {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: '成功退出登录' });
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}