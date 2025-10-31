import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// 检查是否在浏览器环境
const isBrowser = typeof window !== 'undefined';

// 在任何环境中都创建Supabase客户端实例，只要环境变量存在
// 但要处理可能的环境变量不存在的情况
let supabaseClient: SupabaseClient | null = null;

try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
}

// 导出客户端实例，在无法初始化时返回一个模拟对象以避免错误
export const supabase = supabaseClient || {
  auth: {
    exchangeCodeForSession: async () => ({ error: null }),
    verifyOtp: async () => ({ error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    signOut: async () => ({ error: null }),
    signInWithOtp: async () => ({ error: null })
  }
} as unknown as SupabaseClient;