#!/bin/bash

# 部署脚本 - 将项目部署到服务器 47.120.30.113
# 使用方法: ./deploy.sh

set -e  # 遇到错误立即退出

# 配置变量
SERVER_HOST="47.120.30.113"
SERVER_USER="root"
SERVER_DIR="/www/awesome-fund"
LOCAL_BUILD_DIR=".next"
SSH_PORT="22"

# 应用配置
APP_NAME="awesome-fund"
APP_PORT="3000"
LOG_FILE="/var/log/awesome-fund.log"
ERROR_LOG_FILE="/var/log/awesome-fund-error.log"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 检查SSH连接
check_ssh_connection() {
    print_message "$YELLOW" "检查SSH连接..."
    if ssh -p $SSH_PORT -o ConnectTimeout=5 -o BatchMode=yes $SERVER_USER@$SERVER_HOST exit 2>/dev/null; then
        print_message "$GREEN" "✓ SSH连接正常"
        return 0
    else
        print_message "$RED" "✗ SSH连接失败，请检查："
        echo "  1. 服务器地址是否正确: $SERVER_HOST"
        echo "  2. SSH密钥是否已配置"
        echo "  3. 服务器是否可访问"
        exit 1
    fi
}

# 本地构建项目
build_project() {
    print_message "$YELLOW" "开始本地构建项目..."
    pnpm build
    print_message "$GREEN" "✓ 项目构建完成"
}

# 创建服务器目录
create_server_directory() {
    print_message "$YELLOW" "创建服务器目录..."
    ssh -p $SSH_PORT $SERVER_USER@$SERVER_HOST "mkdir -p $SERVER_DIR"
    print_message "$GREEN" "✓ 服务器目录创建完成"
}

# 上传文件到服务器
upload_files() {
    print_message "$YELLOW" "上传文件到服务器..."
    
    # 排除不需要上传的文件和目录
    rsync -avz --progress \
        --exclude 'node_modules' \
        --exclude '.next' \
        --exclude '.git' \
        --exclude '.env.local' \
        --exclude '.env.production.local' \
        --exclude 'dist' \
        --exclude '.DS_Store' \
        --exclude 'coverage' \
        --exclude '.trae' \
        --exclude '.husky' \
        --exclude 'ecosystem.json' \
        --exclude 'server-start.sh' \
        -e "ssh -p $SSH_PORT" \
        ./ $SERVER_USER@$SERVER_HOST:$SERVER_DIR/
    
    print_message "$GREEN" "✓ 文件上传完成"
}

# 上传构建产物
upload_build() {
    print_message "$YELLOW" "上传构建产物..."
    
    rsync -avz --progress \
        --exclude 'cache' \
        -e "ssh -p $SSH_PORT" \
        .next/ $SERVER_USER@$SERVER_HOST:$SERVER_DIR/.next/
    
    print_message "$GREEN" "✓ 构建产物上传完成"
}

# 在服务器上检查依赖
check_server_dependencies() {
    print_message "$YELLOW" "检查服务器依赖..."
    
    ssh -p $SSH_PORT $SERVER_USER@$SERVER_HOST << 'ENDSSH'
        # 检查Node.js和pnpm是否安装
        if ! command -v node &> /dev/null; then
            echo "✗ Node.js未安装"
            exit 1
        fi
        
        if ! command -v pnpm &> /dev/null; then
            echo "✗ pnpm未安装"
            exit 1
        fi
        
        echo "✓ 依赖检查通过"
ENDSSH
    
    print_message "$GREEN" "✓ 服务器依赖检查完成"
}

# 在服务器上检查系统内存
check_server_memory() {
    print_message "$YELLOW" "检查服务器内存..."
    
    ssh -p $SSH_PORT $SERVER_USER@$SERVER_HOST << 'ENDSSH'
        # 获取可用内存（MB）
        available_mem=$(free -m | awk 'NR==2{print $7}')
        total_mem=$(free -m | awk 'NR==2{print $2}')
        
        # 获取可用swap（MB）
        available_swap=$(free -m | awk 'NR==3{print $4}')
        total_swap=$(free -m | awk 'NR==3{print $2}')
        
        # 计算总可用内存（可用内存 + 可用swap）
        total_available=$((available_mem + available_swap))
        
        echo "总内存: ${total_mem}MB, 可用内存: ${available_mem}MB"
        echo "总Swap: ${total_swap}MB, 可用Swap: ${available_swap}MB"
        echo "总可用资源: ${total_available}MB"
        
        # 检查总可用资源是否足够（可用内存 + 可用swap）
        if [ "$total_available" -lt 512 ]; then
            echo "⚠ 警告: 可用资源不足512MB（可用内存+可用swap），可能会影响依赖安装"
            echo "建议: 1) 增加swap空间 2) 跳过依赖安装 3) 使用预构建的node_modules"
            exit 1
        fi
        
        # 如果可用内存不足但有足够的swap，给出提示
        if [ "$available_mem" -lt 512 ] && [ "$available_swap" -gt 100 ]; then
            echo "⚠ 提示: 可用内存不足512MB，但有${available_swap}MB swap可用"
            echo "系统会使用swap空间，可能会稍慢但应该可以正常工作"
        fi
ENDSSH
    
    print_message "$GREEN" "✓ 服务器内存检查完成"
}

# 在服务器上安装依赖
install_dependencies() {
    print_message "$YELLOW" "在服务器上安装依赖..."
    ssh -p $SSH_PORT $SERVER_USER@$SERVER_HOST "cd $SERVER_DIR && pnpm install --prod --ignore-scripts"
    print_message "$GREEN" "✓ 依赖安装完成"
}

# 在服务器上重启应用
restart_application() {
    print_message "$YELLOW" "在服务器上重启应用..."
    
    ssh -p $SSH_PORT $SERVER_USER@$SERVER_HOST << 'ENDSSH'
        cd $SERVER_DIR
        
        # 停止旧进程
        echo "停止旧进程..."
        pkill -f "node .next/standalone/server.js" || true
        
        # 检查PM2是否安装
        if command -v pm2 &> /dev/null; then
            echo "使用PM2启动应用..."
            
            # 删除所有 awesome-fund 相关的进程
            pm2 delete all 2>/dev/null || true
            
            # 等待进程完全停止
            sleep 2
            
            # 使用 PM2 启动应用（配置直接写在命令中）
            pm2 start npm \
                --name "awesome-fund" \
                --cwd $SERVER_DIR \
                -- run server \
                --env NODE_ENV=production \
                --env HOST=0.0.0.0 \
                --env PORT=3000 \
                --log "/var/log/awesome-fund.log" \
                --error "/var/log/awesome-fund-error.log" \
                --time \
                --merge-logs \
                --autorestart \
                --max-restarts 10 \
                --min-uptime 10s \
                --max-memory-restart 1G
            
            # 保存PM2进程列表
            pm2 save
            
            # 设置开机自启
            pm2 startup systemd -u $USER --hp /home/$USER 2>/dev/null || true
            
            # 显示PM2进程列表
            echo "PM2 进程列表:"
            pm2 list
        else
            echo "PM2未安装，使用nohup启动..."
            
            # 创建日志目录
            mkdir -p /var/log
            
            # 使用nohup启动，设置 HOST=0.0.0.0
            HOST=0.0.0.0 PORT=3000 nohup npm run server > /var/log/awesome-fund.log 2> /var/log/awesome-fund-error.log &
            
            # 保存PID
            echo $! > $SERVER_DIR/app.pid
        fi
ENDSSH
    
    # 等待应用启动
    print_message "$YELLOW" "等待应用启动..."
    
    ssh -p $SSH_PORT $SERVER_USER@$SERVER_HOST << 'ENDSSH'
        max_attempts=30
        attempt=0
        
        while [ $attempt -lt $max_attempts ]; do
            # 检查 0.0.0.0:3000 或 localhost:3000
            if curl -s http://0.0.0.0:3000 > /dev/null 2>&1 || \
               curl -s http://localhost:3000 > /dev/null 2>&1; then
                echo "✓ 应用启动成功！"
                
                # 显示应用监听地址
                if command -v pm2 &> /dev/null; then
                    pm2 logs --lines 5 --nostream | grep -E "(Local|Network|ready|started)" || true
                fi
                
                exit 0
            fi
            attempt=$((attempt + 1))
            sleep 2
            echo -n "."
        done
        
        echo ""
        echo "⚠ 应用启动超时，请检查日志:"
        
        if command -v pm2 &> /dev/null; then
            pm2 logs --lines 20 --nostream
        else
            tail -20 /var/log/awesome-fund.log
        fi
        
        exit 1
ENDSSH
    
    print_message "$GREEN" "✓ 应用重启完成"
}

# 显示部署信息
show_deployment_info() {
    print_message "$GREEN" "=========================================="
    print_message "$GREEN" "部署完成！"
    print_message "$GREEN" "=========================================="
    echo ""
    echo "服务器地址: $SERVER_HOST"
    echo "部署目录: $SERVER_DIR"
    echo "应用端口: $APP_PORT"
    echo ""
    echo "查看日志命令:"
    echo "  ssh -p $SSH_PORT $SERVER_USER@$SERVER_HOST 'pm2 logs awesome-fund --lines 100'"
    echo "  ssh -p $SSH_PORT $SERVER_USER@$SERVER_HOST 'tail -f /var/log/awesome-fund.log'"
    echo ""
    echo "常用命令:"
    echo "  查看状态: ssh -p $SSH_PORT $SERVER_USER@$SERVER_HOST 'pm2 status'"
    echo "  重启应用: ssh -p $SSH_PORT $SERVER_USER@$SERVER_HOST 'pm2 restart awesome-fund'"
    echo "  停止应用: ssh -p $SSH_PORT $SERVER_USER@$SERVER_HOST 'pm2 stop awesome-fund'"
    echo ""
    echo "访问应用:"
    echo "  https://maiqishare.xyz/fund"
    echo ""
}

# 主函数
main() {
    print_message "$GREEN" "=========================================="
    print_message "$GREEN" "开始部署到服务器: $SERVER_HOST"
    print_message "$GREEN" "=========================================="
    echo ""
    
    # 检查SSH连接
    check_ssh_connection
    
    # 本地构建
    build_project
    
    # 创建服务器目录
    create_server_directory
    
    # 上传文件
    upload_files
    
    # 上传构建产物
    upload_build
    
    # 检查服务器依赖
    check_server_dependencies
    
    # 检查服务器内存
    check_server_memory
    
    # 安装依赖
    install_dependencies
    
    # 重启应用
    restart_application
    
    # 显示部署信息
    show_deployment_info
}

# 执行主函数
main
