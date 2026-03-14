# 🚀 零碳项目收益评估软件 - Vercel 部署指南

## 前置要求

- ✅ GitHub 账号（用于代码托管）
- ✅ Vercel 账号（用于部署）
- ✅ Cloudflare 账号（域名DNS管理）
- ✅ Node.js 18+ （本地开发）
- ✅ Git 已安装

---

## 部署架构

```
GitHub 仓库 → Vercel 自动部署 → Cloudflare DNS → 自定义域名
```

---

## 快速部署步骤

### 1️⃣ 创建 GitHub 仓库

```bash
# 初始化 Git 仓库（如果还没初始化）
cd "/Users/su/Desktop/code/项目/零碳项目收益评估软件前端"
git init

# 添加所有文件
git add .

# 提交
git commit -m "feat: 添加 Vercel 部署配置"

# 推送到 GitHub（替换 YOUR_USERNAME/REPO_NAME）
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

### 2️⃣ 在 Vercel 部署

#### 方式 A: Web 控制台（推荐）

1. 访问 [vercel.com](https://vercel.com) 并登录
2. 点击 "Add New Project"
3. 选择 "Continue with GitHub"
4. 授权 Vercel 访问您的 GitHub 仓库
5. 选择 `zero-carbon-valuation` 仓库
6. Vercel 会自动检测 `vercel.json` 配置
7. 点击 "Deploy" 开始部署

**部署时间**: 约 1-3 分钟

#### 方式 B: 命令行

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署到生产环境
vercel --prod
```

### 3️⃣ 配置自定义域名

#### 获取 Vercel 分配的域名

部署完成后，Vercel 会自动分配一个域名，如：
- `zero-carbon-valuation.vercel.app`

#### 在 Vercel 添加自定义域名

1. 进入项目 → Settings → Domains
2. 点击 "Add Domain"
3. 输入您的域名（如 `app.yourdomain.com`）
4. Vercel 会生成 DNS 配置信息：
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com
   ```

#### 在 Cloudflare 配置 DNS

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 选择您的域名
3. 进入 DNS → Records
4. 添加新记录：
   
   | Type  | Name | Target/Content        | Proxy |
   |-------|-------|----------------------|--------|
   | CNAME | app   | cname.vercel-dns.com | 已代理  |

5. 点击 "Save"

#### 验证 DNS

```bash
# 检查 DNS 是否生效
dig app.yourdomain.com

# 或使用在线工具
# https://www.whatsmydns.net/
```

DNS 生效通常需要 5-30 分钟。

### 4️⃣ 配置环境变量（可选）

在 Vercel 项目 Settings → Environment Variables 中添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `NODE_ENV` | `production` | 生产环境标识 |
| `VITE_API_BASE_URL` | `https://api.yourdomain.com` | 后端 API 地址 |

**注意**: 带有 `VITE_` 前缀的环境变量会自动注入到前端代码中。

---

## 验证部署

### 1. 访问应用

- **Vercel 默认域名**: `https://zero-carbon-valuation.vercel.app`
- **自定义域名**: `https://app.yourdomain.com`

### 2. 检查控制台

在浏览器开发者工具中检查：
- ✅ 所有资源正确加载
- ✅ 无 CORS 错误
- ✅ LocalStorage 正常工作
- ✅ IndexedDB 正常初始化

### 3. 测试关键功能

- [ ] 项目创建和保存
- [ ] 各模块计算功能
- [ ] 报告导出
- [ ] 数据持久化（刷新页面后数据保留）

---

## 持续部署（自动更新）

每次向 GitHub 推送代码后，Vercel 会自动部署：

```bash
# 修改代码后
git add .
git commit -m "fix: 修复某个问题"
git push

# Vercel 自动触发部署！
```

---

## 常见问题

### Q: 部署后页面空白？

**A**: 检查 `vite.config.ts` 中的 `base` 配置是否为 `'./'`。当前配置正确。

### Q: API 调用失败？

**A**: 检查：
1. 环境变量 `VITE_API_BASE_URL` 是否正确设置
2. 后端 CORS 是否允许 Vercel 域名
3. API 是否已启动并可访问

### Q: 自定义域名无法访问？

**A**: 检查：
1. Cloudflare DNS 记录是否正确
2. DNS 是否已生效（使用 `dig` 检查）
3. Vercel 是否正确识别域名

### Q: 如何查看部署日志？

**A**: 
1. 进入 Vercel 项目
2. 点击 "Deployments" 标签页
3. 点击具体部署记录查看日志

---

## 本地预览构建结果

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

---

## 相关文件

| 文件 | 用途 |
|------|------|
| `vercel.json` | Vercel 部署配置 |
| `.gitignore` | Git 忽略规则 |
| `vite.config.ts` | Vite 构建配置 |
| `package.json` | 项目依赖和脚本 |

---

## 部署完成后清单

- [ ] GitHub 仓库已创建并推送
- [ ] Vercel 项目已部署
- [ ] 自定义域名已添加到 Vercel
- [ ] Cloudflare DNS 已配置
- [ ] 环境变量已设置
- [ ] 应用可以通过自定义域名访问
- [ ] 关键功能测试通过

---

**部署支持**: 如有问题，请参考 [Vercel 文档](https://vercel.com/docs)
