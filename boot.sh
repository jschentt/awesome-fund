#!/bin/bash
set -e   # 任何命令失败立即退出

LOG_DIR=/www/awesome-fund/logs

# 1. 确保目录和文件存在
mkdir -p "$LOG_DIR"
touch "$LOG_DIR/out.log" "$LOG_DIR/error.log"

# 2. 安全 flush（即使文件不存在也不抛异常）
pm2 flush || true

# 3. 清旧进程并重启
pm2 delete awesome-fund 2>/dev/null || true

# 4. 安装依赖包
npm config set registry https://registry.npmmirror.com || true
pnpm install --frozen-lockfile || npm install --legacy-peer-deps

# 5. 启动服务
pm2 start ecosystem.config.js