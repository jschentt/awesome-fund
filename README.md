# awesome-fund

<p align="center">
  <img src="app/favicon.ico" />
</p>

This is an [Onlook](https://onlook.com/) project set up with
[Next.js](https://nextjs.org/), [TailwindCSS](https://tailwindcss.com/) and
[ShadCN](https://ui.shadcn.com).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in Onlook to see the result.

# Git配置刷新验证 - 2025年10月31日 星期五 10时51分55秒 CST

## Supabase集成

本项目已集成Supabase用于数据存储和身份验证。

### 环境变量配置

项目使用以下环境变量进行Supabase配置：

```
NEXT_PUBLIC_SUPABASE_URL=https://akigqnpmzpfhvdhuggrr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFraWdxbnBtenBmaHZkaHVnZ3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4OTAwMDIsImV4cCI6MjA3NzQ2NjAwMn0.g6L4bgUyzlV3-UsxRuYX-sjoDzI_Xwamg6Ngo-1fEGw
```

### 使用Supabase

可以通过导入`lib/supabase.ts`中的`supabase`实例来使用Supabase服务：

```typescript
import { supabase } from '@/lib/supabase';

// 示例：获取数据
const { data, error } = await supabase.from('your_table');
```

## 数据库初始化

项目支持通过代码自动创建数据库表和初始化数据。

### 前提条件

1. 确保在`.env.local`文件中配置了正确的`SUPABASE_SERVICE_ROLE_KEY`
2. 首先需要在Supabase Dashboard中执行以下SQL创建`exec_sql`函数：

```sql
-- 从 lib/db/sql_functions.sql 文件中获取
CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS void AS $$
BEGIN
  EXECUTE query;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'SQL执行错误: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO anon, authenticated;
```

### 执行初始化

运行以下命令执行数据库初始化：

```bash
pnpm db:init
```

这将自动创建`posts`表并插入初始数据。
