# Trae Project Rules

**项目**：vercel + supabase + nextjs + antd + pnpm  
**版本**：2025-06-25

---

## 1. 技术栈锁定

- 运行时：Node.js 20（Vercel Serverless 默认）
- 包管理器：必须 pnpm（仓库含 `pnpm-lock.yaml`）
- 前端框架：Next.js 14 App Router
- UI 框架：Ant Design 5.x（官方组件 + css-in-js）
- 数据库：Supabase（PostgreSQL 15，Row Level Security 默认开启）
- 环境变量：统一 `.env` 管理，禁止硬编码密钥

## 2. 目录规范

```
src/
├─ app/              # Next.js App Router
├─ components/       # 通用 AntD 组件
├─ libs/supabase.ts  # 单例导出 createClient
├─ hooks/            # 自定义 React Hook
├─ styles/           # 全局样式，antd 主题变量
├─ types/            # TypeScript 类型
└─ middleware.ts     # 鉴权/国际化路由守卫
```

- 页面级组件放在 `app/**/page.tsx`
- 公用组件必须带 `index.tsx` 并默认导出

## 3. 代码风格

- TypeScript 严格模式：开启
- 函数组件 + hooks，禁止 class 组件
- AntD 组件按需自动引入（已配 `plugin:next-plugin-antd`）
- 任何数据库操作必须走 RLS 策略，前端只用 `anonKey`
- 敏感逻辑（支付、admin）必须写成 Vercel Edge Function 或 Next.js Route Handler，并用 `serviceRoleKey`（服务端 only）

## 4. 分支与提交

- main 分支自动部署到 Vercel Production
- dev 分支自动部署到 Preview
- 提交信息：`feat: 新增用户注册` / `fix: 修复验证码冷却倒计时`

## 5. 性能与体验

- 所有列表页必须分页或虚拟滚动（AntD Table virtual）
- 首屏组件动态导入：`dynamic(() => import(...), { ssr: false })`
- 图片统一走 Next.js Image（`priority` 给首屏大图）
- 打包体积 > 500 kB 时启用 pnpm `auto-install-peers=false` + 手动分析 `pnpm analyze`

## 6. 安全红线

- 不允许关闭 RLS 生产表；测试表需备注 `/* TEST ONLY */`
- 任何上传文件先过 ClamAV 扫描（用 Vercel Blob + Serverless 函数）
- 环境变量 `NEXT_PUBLIC_*` 只能放非敏感值

## 7. 一键命令

```bash
pnpm dev        # 本地开发
pnpm build      # 构建 + 类型检查
pnpm lint       # ESLint + Prettier
pnpm test       # Vitest 单元测试
```

> Trae 生成代码必须遵循以上规则，否则直接重写成符合标准。
