import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// 检查是否在浏览器环境
const isBrowser = typeof window !== 'undefined';

// 有条件地创建Supabase客户端实例，避免在服务器端或静态预渲染时出错
let supabaseClient: SupabaseClient | null = null;

if (isBrowser && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// 导出客户端实例，在非浏览器环境返回一个模拟对象以避免错误
export const supabase = supabaseClient || {
  auth: {
    exchangeCodeForSession: async () => ({ error: null }),
    verifyOtp: async () => ({ error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    signOut: async () => ({ error: null })
  }
} as unknown as SupabaseClient;