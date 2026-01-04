#!/bin/bash

# 部署脚本 - 将项目部署到服务器 47.120.30.113
# 使用方法: ./deploy.sh

set -e  # 遇到错误立即退出

# 配置变量
SERVER_HOST="47.120.30.113"
SERVER_USER="root"  # 根据实际情况修改
SERVER_DIR="/www/awesome-fund"  # 服务器上的部署目录
LOCAL_BUILD_DIR=".next"
PORT="22"  # SSH端口

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 检查SSH连接
check_ssh_connection() {
    print_message "$YELLOW" "检查SSH连接..."
    if ssh -p $PORT -o ConnectTimeout=5 -o BatchMode=yes $SERVER_USER@$SERVER_HOST exit 2>/dev/null; then
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

# 清理服务器上的旧文件和进程
clean_server() {
    print_message "$YELLOW" "清理服务器上的旧文件和进程..."
    
    ssh -p $PORT $SERVER_USER@$SERVER_HOST << ENDSSH
        # 停止并删除 PM2 进程
        if command -v pm2 &> /dev/null; then
            echo "停止 PM2 进程: awesome-fund"
            pm2 delete awesome-fund 2>/dev/null || echo "PM2 进程不存在或已停止"
        else
            echo "PM2 未安装，跳过 PM2 清理"
        fi
        
        # 删除旧部署目录
        echo "删除旧部署目录: $SERVER_DIR"
        rm -rf $SERVER_DIR || echo "目录不存在或删除失败"
        
        echo "✓ 服务器清理完成"
ENDSSH
    
    print_message "$GREEN" "✓ 服务器清理完成"
}

# 本地构建项目
build_project() {
    print_message "$YELLOW" "开始本地构建项目..."
    pnpm build
    
    # 复制 static 目录到 standalone（Next.js 14 standalone 模式需要）
    print_message "$YELLOW" "复制静态资源到 standalone 目录..."
    if [ -d ".next/static" ]; then
        mkdir -p .next/standalone/.next
        cp -r .next/static .next/standalone/.next/
        print_message "$GREEN" "✓ 静态资源复制完成"
    else
        print_message "$YELLOW" "⚠ 未找到 .next/static 目录"
    fi
    
    # 复制 public 目录到 standalone
    if [ -d "public" ]; then
        cp -r public .next/standalone/
        print_message "$GREEN" "✓ public 目录复制完成"
    fi
    
    print_message "$GREEN" "✓ 项目构建完成"
}

# 创建服务器目录
create_server_directory() {
    print_message "$YELLOW" "创建服务器目录..."
    ssh -p $PORT $SERVER_USER@$SERVER_HOST "mkdir -p $SERVER_DIR"
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
        -e "ssh -p $PORT" \
        ./ $SERVER_USER@$SERVER_HOST:$SERVER_DIR/
    
    print_message "$GREEN" "✓ 文件上传完成"
}

# 上传构建产物
upload_build() {
    print_message "$YELLOW" "上传构建产物..."
    
    rsync -avz --progress \
        --exclude 'cache' \
        -e "ssh -p $PORT" \
        .next/ $SERVER_USER@$SERVER_HOST:$SERVER_DIR/.next/ || {
            print_message "$YELLOW" "⚠ 部分构建产物传输失败，但继续部署..."
        }
    
    print_message "$GREEN" "✓ 构建产物上传完成"
}

# 在服务器上安装依赖
install_dependencies() {
    print_message "$YELLOW" "在服务器上安装依赖..."
    ssh -p $PORT $SERVER_USER@$SERVER_HOST "cd $SERVER_DIR && pnpm install --prod --ignore-scripts"
    print_message "$GREEN" "✓ 依赖安装完成"
}

# 在服务器上重启应用
restart_application() {
    print_message "$YELLOW" "在服务器上重启应用..."
    
    # 使用PM2管理进程（如果已安装）
    ssh -p $PORT $SERVER_USER@$SERVER_HOST << ENDSSH
        cd $SERVER_DIR
        
        # 检查PM2是否安装
        if command -v pm2 &> /dev/null; then
            # 停止旧进程
            pm2 delete awesome-fund 2>/dev/null || true
            
            # 启动新进程
            pm2 start ecosystem.config.js
            
            # 保存PM2进程列表
            pm2 save
        else
            # 如果没有PM2，使用nohup启动
            pkill -f "next start" || true
            nohup npm start > /var/log/awesome-fund.log 2>&1 &
        fi
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
    echo ""
    echo "查看日志命令:"
    echo "  ssh -p $PORT $SERVER_USER@$SERVER_HOST 'tail -f /var/log/awesome-fund.log'"
    echo ""
    echo "访问应用:"
    echo "  https://maiqishare.xyz"
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
    
    # 清理服务器上的旧文件和进程
    clean_server
    
    # 本地构建
    build_project
    
    # 创建服务器目录
    create_server_directory
    
    # 上传文件
    upload_files
    
    # 上传构建产物
    upload_build
    
    # 安装依赖
    install_dependencies
    
    # 重启应用
    restart_application
    
    # 显示部署信息
    show_deployment_info
}

# 执行主函数
main
