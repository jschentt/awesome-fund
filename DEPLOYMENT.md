# 部署脚本使用说明

## 概述

本项目包含一个自动化部署脚本 `deploy.sh`，可以将项目部署到服务器 `47.120.30.113`。

## 前置要求

### 本地环境

- Node.js 20+
- pnpm 包管理器
- SSH 客户端
- rsync 工具

### 服务器环境

- Node.js 20+
- pnpm 包管理器
- PM2（推荐，用于进程管理）
- SSH 访问权限

## 配置说明

### 1. 修改部署配置

编辑 `.deploy-config` 文件，根据实际情况修改以下配置：

```bash
SERVER_HOST="47.120.30.113"  # 服务器地址
SERVER_USER="root"           # SSH用户名
SERVER_DIR="/www/awesome-fund"  # 部署目录
SSH_PORT="22"                # SSH端口
```

### 2. 配置SSH密钥

确保本地可以通过SSH密钥无密码登录到服务器：

```bash
# 生成SSH密钥（如果还没有）
ssh-keygen -t rsa -b 4096

# 将公钥复制到服务器
ssh-copy-id -p 22 root@47.120.30.113
```

或者手动复制公钥：

```bash
# 查看本地公钥
cat ~/.ssh/id_rsa.pub

# 在服务器上添加公钥
ssh root@47.120.30.113
mkdir -p ~/.ssh
echo "你的公钥内容" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### 3. 服务器环境准备

在服务器上执行以下命令：

```bash
# 安装Node.js 20（如果还没有）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装pnpm
npm install -g pnpm

# 安装PM2（推荐）
npm install -g pm2

# 创建部署目录
sudo mkdir -p /www/awesome-fund
sudo chown -R $USER:$USER /www/awesome-fund
```

### 4. 配置环境变量

在服务器上创建 `.env` 文件：

```bash
ssh root@47.120.30.113
cd /www/awesome-fund
cp .env.example .env  # 如果有示例文件
# 或者直接创建
nano .env
```

添加必要的环境变量：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# 其他环境变量...
```

## 使用方法

### 基本部署

```bash
# 在项目根目录执行
./deploy.sh
```

### 部署流程

脚本会自动执行以下步骤：

1. **检查SSH连接** - 验证是否可以连接到服务器
2. **本地构建** - 执行 `pnpm build` 构建项目
3. **创建服务器目录** - 在服务器上创建部署目录
4. **上传文件** - 使用 rsync 同步项目文件（排除 node_modules 等）
5. **上传构建产物** - 上传 .next 目录
6. **安装依赖** - 在服务器上执行 `pnpm install --prod`
7. **重启应用** - 使用 PM2 或 nohup 重启应用

### 部署后验证

```bash
# 查看应用日志
ssh root@47.120.30.113 'tail -f /var/log/awesome-fund.log'

# 如果使用PM2，查看进程状态
ssh root@47.120.30.113 'pm2 list'

# 查看PM2日志
ssh root@47.120.30.113 'pm2 logs awesome-fund'

# 测试访问
curl http://47.120.30.113:3000
```

## 常见问题

### 1. SSH连接失败

**问题**: 提示 "SSH连接失败"

**解决方案**:

- 检查服务器地址是否正确
- 确认SSH密钥已配置
- 检查防火墙设置
- 尝试手动SSH连接: `ssh -p 22 root@47.120.30.113`

### 2. rsync命令不存在

**问题**: 提示 "rsync: command not found"

**解决方案**:

- macOS: 已预装
- Linux: `sudo apt-get install rsync` (Ubuntu/Debian)

### 3. PM2命令不存在

**问题**: 提示 "pm2: command not found"

**解决方案**:

```bash
npm install -g pm2
```

### 4. 端口被占用

**问题**: 提示 "Port 3000 is already in use"

**解决方案**:

```bash
# 查找占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 或者修改应用端口
```

### 5. 权限问题

**问题**: 提示 "Permission denied"

**解决方案**:

```bash
# 确保服务器目录权限正确
ssh root@47.120.30.113
chown -R $USER:$USER /www/awesome-fund
chmod -R 755 /www/awesome-fund
```

## 高级配置

### 使用不同的部署目录

修改 `.deploy-config` 中的 `SERVER_DIR` 变量：

```bash
SERVER_DIR="/home/user/awesome-fund"
```

### 自定义排除文件

编辑 `deploy.sh` 中的 `rsync` 命令，添加更多排除规则：

```bash
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.git' \
    --exclude 'your-custom-folder' \
    ...
```

### 使用不同的进程管理器

如果不想使用PM2，可以修改 `deploy.sh` 中的 `restart_application` 函数，使用其他进程管理器如 systemd。

## 监控和维护

### 设置开机自启

如果使用PM2：

```bash
ssh root@47.120.30.113
pm2 startup
pm2 save
```

### 定期日志清理

```bash
# 添加到crontab
0 0 * * * find /var/log -name "awesome-fund*.log" -mtime +7 -delete
```

### 备份部署

建议在部署前备份当前版本：

```bash
ssh root@47.120.30.113
cd /www
cp -r awesome-fund awesome-fund.backup.$(date +%Y%m%d)
```

## 安全建议

1. **不要在代码中硬编码敏感信息**，使用环境变量
2. **定期更新依赖包**，修复安全漏洞
3. **限制SSH访问**，使用密钥认证而非密码
4. **配置防火墙**，只开放必要的端口
5. **定期备份数据库**，防止数据丢失

## 技术支持

如遇到问题，请检查：

1. 服务器日志: `/var/log/awesome-fund.log`
2. PM2日志: `pm2 logs awesome-fund`
3. Next.js构建日志
4. 网络连接状态

## 更新日志

- 2025-01-XX: 初始版本，支持自动化部署到指定服务器
