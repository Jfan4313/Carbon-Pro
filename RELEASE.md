# 版本发布流程 (Release Process)

本文档描述零碳项目收益评估软件的版本发布流程和检查清单。

---

## 目录

- [发布前准备](#发布前准备)
- [版本发布流程](#版本发布流程)
- [GitHub Release 创建](#github-release-创建)
- [部署流程](#部署流程)
- [版本回滚](#版本回滚)
- [发布后检查](#发布后检查)

---

## 发布前准备

### 1. 功能验证

在发布新版本前，确保：

- [ ] 所有计划的功能已实现
- [ ] 所有已知 Bug 已修复
- [ ] 关键功能已测试
- [ ] 文档已更新

### 2. 测试检查清单

**功能测试：**
- [ ] 项目创建和编辑
- [ ] 各改造模块功能正常
- [ ] 报告导出（Excel/PDF/Word）
- [ ] 登录/认证功能
- [ ] 管理员模式

**兼容性测试：**
- [ ] Chrome 浏览器
- [ ] Firefox 浏览器
- [ ] Safari 浏览器
- [ ] Edge 浏览器
- [ ] 移动端浏览器（iOS Safari / Chrome）

**性能测试：**
- [ ] 首页加载时间 < 3 秒
- [ ] 报告导出时间 < 10 秒
- [ ] 图表渲染无卡顿

### 3. 文档更新

在发布前更新以下文档：

- [ ] `CHANGELOG.md` - 添加新版本变更记录
- [ ] `README.md` - 更新版本信息和功能说明
- [ ] `package.json` - 更新版本号

---

## 版本发布流程

### 步骤 1：确定版本号

根据变更类型确定版本号：

| 变更类型 | 版本变更 | 示例 |
|---------|---------|------|
| 重大 API 变更/架构重构 | `MAJOR` +1 | v1.0.0 → v2.0.0 |
| 新增向下兼容功能 | `MINOR` +1 | v1.0.0 → v1.1.0 |
| Bug 修复 | `PATCH` +1 | v1.0.0 → v1.0.1 |

### 步骤 2：更新 package.json

```bash
# 手动编辑或使用 npm version
npm version patch    # v1.0.0 → v1.0.1
npm version minor    # v1.0.0 → v1.1.0
npm version major    # v1.0.0 → v2.0.0
```

### 步骤 3：更新 CHANGELOG.md

在 `CHANGELOG.md` 顶部添加新版本记录：

```markdown
## [v1.0.1] - 2026-03-14

### 修复
- 修复 Excel 导出中文乱码问题 (#123)
- 修复移动端侧边栏滑动卡顿

### 优化
- 优化报告加载性能，提升 30% 速度

### 文档
- 更新 README.md 部署说明
```

### 步骤 4：提交代码

```bash
git add .
git commit -m "release: v1.0.1

主要更新：
- 修复 Excel 导出中文乱码问题
- 优化报告加载性能
- 更新文档说明"
```

### 步骤 5：创建版本标签

```bash
# 创建带注释的标签
git tag -a v1.0.1 -m "v1.0.1 - 修复版本

主要修复：
- 修复 Excel 导出中文乱码问题
- 优化报告加载性能
- 更新文档说明"

# 推送代码和标签
git push origin main
git push origin v1.0.1
```

---

## GitHub Release 创建

### 步骤 1：访问 GitHub Releases

访问：https://github.com/Jfan4313/Carbon-Pro/releases/new

### 步骤 2：填写 Release 信息

**Choose a tag**: 选择刚推送的标签（如 `v1.0.1`）

**Release title**:
```
v1.0.1 - 修复版本
```

**Description**:
```markdown
## v1.0.1 - 2026-03-14

### 🐛 Bug 修复
- 修复 Excel 导出中文乱码问题
- 修复移动端侧边栏滑动卡顿

### ⚡ 性能优化
- 优化报告加载性能，提升 30% 速度

### 📝 文档更新
- 更新部署说明文档
- 添加版本管理规范

## 下载

### Web 版本
- [在线访问](https://carbon-pro.vercel.app)

### 桌面版
- [macOS (dmg)](./dist-electron/xxx.dmg)
- [Windows (exe)](./dist-electron/xxx.exe)
- [Linux (AppImage)](./dist-electron/xxx.AppImage)

## 安装

### Web 版本
无需安装，直接访问在线地址

### 桌面版
```bash
# macOS
下载 .dmg 文件，双击拖拽到 Applications 文件夹

# Windows
下载 .exe 文件，双击安装

# Linux
下载 .AppImage 文件，添加执行权限后运行
chmod +x xxx.AppImage
./xxx.AppImage
```

## 升级说明
- v1.0.0 用户可直接升级，无需数据迁移

## 完整变更日志
查看 [CHANGELOG.md](https://github.com/Jfan4313/Carbon-Pro/blob/main/CHANGELOG.md)
```

**Set as the latest release**: ✅ 勾选

### 步骤 3：上传构建产物（桌面版）

如果打包了桌面应用，上传到 Release：

```bash
# 构建 Electron 应用
npm run electron:build

# 上传 dist-electron/ 目录下的文件到 GitHub Release
```

### 步骤 4：发布

点击 "Publish release" 按钮

---

## 部署流程

### Web 版本部署（Vercel）

如果连接了 Vercel，代码推送后会自动触发部署。

**手动触发部署**：
```bash
npm install -g vercel
vercel --prod
```

**验证部署**：
1. 访问 Vercel Dashboard 查看部署日志
2. 访问生产地址验证功能

### 桌面版发布流程

#### macOS
```bash
# 构建
npm run electron:build

# 输出位置
dist-electron/零碳项目收益评估软件-1.0.1.dmg
dist-electron/零碳项目收益评估软件-1.0.1-mac.zip
```

#### Windows
```bash
# 构建（在 Windows 环境下）
npm run electron:build:win

# 输出位置
dist-electron/零碳项目收益评估软件 Setup 1.0.1.exe
dist-electron/零碳项目收益评估软件-1.0.1.exe
```

#### Linux
```bash
# 构建（在 Linux 环境下）
npm run electron:build:linux

# 输出位置
dist-electron/零碳项目收益评估软件-1.0.1.AppImage
dist-electron/零碳项目收益评估软件_1.0.1_amd64.deb
```

---

## 版本回滚

### 场景 1：发布后发现严重 Bug

**快速修复流程：**
```bash
# 1. 回滚到上一个稳定版本
git checkout v1.0.0

# 2. 创建修复分支
git checkout -b hotfix-v1.0.2

# 3. 修复问题
git add .
git commit -m "hotfix: 修复严重 Bug"

# 4. 创建新版本标签
git tag -a v1.0.2 -m "v1.0.2 - 紧急修复"
git push origin main
git push origin v1.0.2
```

### 场景 2：回滚到上一个版本

```bash
# 查看所有版本标签
git tag -l

# 回滚到指定版本
git checkout v1.0.0

# 重新部署（如果需要）
# Web 版本：推送到 Vercel 会自动部署
# 桌面版：重新构建并上传
```

### 场景 3：撤销最近一次发布

```bash
# 删除远程标签（谨慎操作）
git push origin :refs/tags/v1.0.1

# 删除本地标签
git tag -d v1.0.1

# 回滚代码
git reset --hard HEAD~1
git push --force
```

---

## 发布后检查

### 功能验证

- [ ] Web 版本部署成功，可正常访问
- [ ] 所有功能正常工作
- [ ] 用户数据迁移正常（如有）
- [ ] 桌面版安装包可正常下载和安装

### 监控

- [ ] 检查 Vercel 部署日志
- [ ] 检查 GitHub Issues 是否有新报告
- [ ] 监控错误日志（如配置了 Sentry 等）

### 通知

- [ ] 更新项目文档
- [ ] 通知用户（如有邮件列表或通知渠道）
- [ ] 在社交媒体/社区发布更新

---

## 发布检查清单总结

### 代码检查
- [ ] 版本号已更新（package.json）
- [ ] CHANGELOG.md 已更新
- [ ] README.md 已更新
- [ ] 代码已提交到 main 分支

### 测试检查
- [ ] 功能测试通过
- [ ] 兼容性测试通过
- [ ] 性能测试通过

### 发布检查
- [ ] Git 标签已创建并推送
- [ ] GitHub Release 已创建
- [ ] 桌面版构建产物已上传（如适用）
- [ ] Web 版本已部署（如适用）

### 发布后检查
- [ ] 部署验证成功
- [ ] 功能验证通过
- [ ] 用户通知已发送

---

## 紧急发布流程

### 紧急场景示例

- 严重安全漏洞
- 数据丢失风险
- 无法使用的致命 Bug

### 快速发布步骤

```bash
# 1. 切换到最新稳定版本
git checkout v1.0.0

# 2. 创建 hotfix 分支
git checkout -b hotfix/security-patch

# 3. 紧急修复
# ... 修复代码 ...
git add .
git commit -m "hotfix(security): 修复安全漏洞"
git push origin hotfix/security-patch

# 4. 合并到 main（通过 PR）
# ... 在 GitHub 上创建 PR ...

# 5. 创建紧急版本标签
git checkout main
git tag -a v1.0.1 -m "v1.0.1 - 紧急安全修复"
git push origin main
git push origin v1.0.1

# 6. 立即部署
vercel --prod
```

---

## 相关文档

- [CHANGELOG.md](./CHANGELOG.md) - 版本更新日志
- [CONTRIBUTING.md](./CONTRIBUTING.md) - 贡献者指南
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 部署说明
