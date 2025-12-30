// PM2 部署配置文件
module.exports = {
    apps: [
        {
            // 应用名称
            name: 'awesome-fund',
            // 应用入口文件（Next.js standalone server）
            script: './.next/standalone/server.js',
            // 应用实例数量
            instances: 1,
            // 自动重启
            autorestart: true,
            // 失活超时时间
            kill_timeout: 5000,
            // 最大内存限制
            max_memory_restart: '1G',
            // 日志配置
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            error_file: '/var/log/awesome-fund-error.log',
            out_file: '/var/log/awesome-fund.log',
            combine_logs: true,
            merge_logs: true,
            // 环境变量配置
            env: {
                NODE_ENV: 'production',
                HOST: '0.0.0.0',
                PORT: 3000,
                // Supabase 配置（需要在服务器上配置）
                NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
                NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
            },
            // 环境变量配置（开发环境）
            env_dev: {
                NODE_ENV: 'development',
                HOST: '0.0.0.0',
                PORT: 3000,
            },
        },
    ],
};
