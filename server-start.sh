#!/bin/bash

# 服务器端启动脚本
# 在服务器上使用，用于启动Next.js应用

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 应用配置
APP_NAME="awesome-fund"
APP_DIR="/www/awesome-fund"
APP_PORT="3000"
LOG_FILE="/var/log/awesome-fund.log"
ERROR_LOG_FILE="/var/log/awesome-fund-error.log"

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 检查Node.js和pnpm是否安装
check_dependencies() {
    print_message "$YELLOW" "检查依赖..."
    
    if ! command -v node &> /dev/null; then
        print_message "$RED" "✗ Node.js未安装"
        exit 1
    fi
    
    if ! command -v pnpm &> /dev/null; then
        print_message "$RED" "✗ pnpm未安装"
        exit 1
    fi
    
    print_message "$GREEN" "✓ 依赖检查通过"
}

# 检查系统内存
check_memory() {
    print_message "$YELLOW" "检查系统内存..."
    
    # 获取可用内存（MB）
    local available_mem=$(free -m | awk 'NR==2{print $7}')
    local total_mem=$(free -m | awk 'NR==2{print $2}')
    
    print_message "$GREEN" "总内存: ${total_mem}MB, 可用内存: ${available_mem}MB"
    
    if [ "$available_mem" -lt 512 ]; then
        print_message "$RED" "⚠ 警告: 可用内存不足512MB，可能会影响依赖安装"
        print_message "$YELLOW" "建议: 1) 增加swap空间 2) 跳过依赖安装 3) 使用预构建的node_modules"
        return 1
    fi
    
    return 0
}

# 检查.env文件
check_env_file() {
    print_message "$YELLOW" "检查环境变量文件..."
    
    if [ ! -f "$APP_DIR/.env" ]; then
        print_message "$YELLOW" "⚠ .env文件不存在，创建示例文件..."
        cat > "$APP_DIR/.env" << EOF
# 环境变量配置
# 请根据实际情况修改以下配置

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
EOF
        print_message "$YELLOW" "⚠ 请编辑 $APP_DIR/.env 文件并填入正确的配置"
    else
        print_message "$GREEN" "✓ .env文件存在"
    fi
}

# 安装依赖
install_dependencies() {
    print_message "$YELLOW" "安装依赖..."
    cd "$APP_DIR"
        pnpm install --prod
    print_message "$GREEN" "✓ 依赖安装完成"
}

# 停止旧进程
stop_old_process() {
    print_message "$YELLOW" "停止旧进程..."
    
    # 查找并杀死占用端口的进程
    if lsof -Pi :$APP_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        PID=$(lsof -Pi :$APP_PORT -sTCP:LISTEN -t)
        kill -9 $PID
        print_message "$GREEN" "✓ 已停止旧进程 (PID: $PID)"
    else
        print_message "$GREEN" "✓ 没有运行中的旧进程"
    fi
}

# 使用PM2启动应用
start_with_pm2() {
    print_message "$YELLOW" "使用PM2启动应用..."
    
    if command -v pm2 &> /dev/null; then
        cd "$APP_DIR"
        
        # 检查PM2进程是否存在
        if pm2 list | grep -q "$APP_NAME"; then
            print_message "$YELLOW" "重启现有PM2进程..."
            pm2 restart "$APP_NAME"
        else
            print_message "$YELLOW" "启动新的PM2进程..."
            pm2 start npm --name "$APP_NAME" -- start
        fi
        
        # 保存PM2进程列表
        pm2 save
        
        # 设置开机自启
        pm2 startup systemd -u $USER --hp /home/$USER
        
        print_message "$GREEN" "✓ PM2启动完成"
        print_message "$GREEN" "查看日志: pm2 logs $APP_NAME"
        print_message "$GREEN" "查看状态: pm2 status"
    else
        print_message "$YELLOW" "PM2未安装，使用nohup启动..."
        start_with_nohup
    fi
}

# 使用nohup启动应用
start_with_nohup() {
    print_message "$YELLOW" "使用nohup启动应用..."
    cd "$APP_DIR"
    
    # 创建日志目录
    mkdir -p /var/log
    
    # 使用nohup启动
    nohup npm start > "$LOG_FILE" 2> "$ERROR_LOG_FILE" &
    
    # 保存PID
    echo $! > "$APP_DIR/app.pid"
    
    print_message "$GREEN" "✓ 应用已启动"
    print_message "$GREEN" "查看日志: tail -f $LOG_FILE"
}

# 等待应用启动
wait_for_app() {
    print_message "$YELLOW" "等待应用启动..."
    
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:$APP_PORT > /dev/null 2>&1; then
            print_message "$GREEN" "✓ 应用启动成功！"
            return 0
        fi
        
        attempt=$((attempt + 1))
        sleep 2
        echo -n "."
    done
    
    print_message "$RED" "✗ 应用启动超时"
    return 1
}

# 显示应用信息
show_app_info() {
    print_message "$GREEN" "=========================================="
    print_message "$GREEN" "应用启动信息"
    print_message "$GREEN" "=========================================="
    echo ""
    echo "应用名称: $APP_NAME"
    echo "应用目录: $APP_DIR"
    echo "运行端口: $APP_PORT"
    echo "访问地址: http://$(hostname -I | awk '{print $1}'):$APP_PORT"
    echo ""
    echo "日志文件:"
    echo "  - 标准输出: $LOG_FILE"
    echo "  - 错误输出: $ERROR_LOG_FILE"
    echo ""
    echo "常用命令:"
    echo "  - 查看日志: tail -f $LOG_FILE"
    echo "  - 查看状态: pm2 status"
    echo "  - 重启应用: pm2 restart $APP_NAME"
    echo "  - 停止应用: pm2 stop $APP_NAME"
    echo ""
}

# 主函数
main() {
    print_message "$GREEN" "=========================================="
    print_message "$GREEN" "启动Next.js应用"
    print_message "$GREEN" "=========================================="
    echo ""
    
    # 检查依赖
    check_dependencies
    
    # 检查系统内存
    check_memory
    
    # 检查环境变量文件
    check_env_file
    
    # 安装依赖
    install_dependencies
    
    # 停止旧进程
    stop_old_process
    
    # 启动应用
    start_with_pm2
    
    # 等待应用启动
    wait_for_app
    
    # 显示应用信息
    show_app_info
}

# 执行主函数
main
