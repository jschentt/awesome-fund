# 快速部署指南

## 📦 部署文件说明

本项目包含以下部署相关文件：

- `deploy.sh` - 本地部署脚本，自动将项目部署到服务器
- `server-start.sh` - 服务器端启动脚本，用于在服务器上启动应用
- `.deploy-config` - 部署配置文件（已添加到.gitignore）
- `DEPLOYMENT.md` - 详细部署文档

## 🚀 快速开始

### 1. 配置SSH密钥

```bash
# 生成SSH密钥（如果还没有）
ssh-keygen -t rsa -b 4096

# 复制公钥到服务器
ssh-copy-id -p 22 root@47.120.30.113
```

### 2. 修改部署配置

编辑 `.deploy-config` 文件，修改服务器用户名等信息：

```bash
nano .deploy-config
```

### 3. 准备服务器环境

在服务器上执行：

```bash
# 安装Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装pnpm
npm install -g pnpm

# 安装PM2
npm install -g pm2

# 创建部署目录
sudo mkdir -p /var/www/awesome-fund
sudo chown -R $USER:$USER /var/www/awesome-fund
```

### 4. 配置环境变量

在服务器上创建 `.env` 文件：

```bash
ssh root@47.120.30.113
cd /www/awesome-fund
nano .env
```

添加必要的环境变量（参考 `.env.example` 或项目文档）

### 5. 执行部署

在本地项目根目录执行：

```bash
./deploy.sh
```

## 📝 部署流程

脚本会自动执行以下步骤：

1. ✓ 检查SSH连接
2. ✓ 本地构建项目 (`pnpm build`)
3. ✓ 创建服务器目录
4. ✓ 上传项目文件（排除 node_modules 等）
5. ✓ 上传构建产物 (.next 目录)
6. ✓ 在服务器上安装依赖
7. ✓ 重启应用（使用PM2或nohup）

## 🔍 部署后验证

```bash
# 查看应用日志
ssh root@47.120.30.113 'tail -f /var/log/awesome-fund.log'

# 查看PM2状态
ssh root@47.120.30.113 'pm2 status'

# 测试访问
curl http://47.120.30.113:3000
```

## ⚠️ 常见问题

### SSH连接失败

- 检查服务器地址是否正确
- 确认SSH密钥已配置
- 检查防火墙设置

### PM2命令不存在

```bash
npm install -g pm2
```

### 端口被占用

```bash
# 查找占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>
```

## 📚 详细文档

更多详细信息请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🔒 安全建议

1. 不要在代码中硬编码敏感信息
2. 定期更新依赖包
3. 限制SSH访问，使用密钥认证
4. 配置防火墙，只开放必要的端口
5. 定期备份数据库

## 📞 技术支持

如遇到问题，请检查：

- 服务器日志: `/var/log/awesome-fund.log`
- PM2日志: `pm2 logs awesome-fund`
- 网络连接状态
