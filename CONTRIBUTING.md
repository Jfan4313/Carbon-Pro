# 贡献指南 (Contributing)

感谢你对零碳项目收益评估软件的兴趣！我们欢迎所有形式的贡献，包括代码提交、Bug 报告、功能建议和文档改进。

---

## 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发流程](#开发流程)
- [Git 提交规范](#git-提交规范)
- [Pull Request 流程](#pull-request-流程)
- [代码规范](#代码规范)

---

## 行为准则

- 尊重他人，保持友善和包容的沟通
- 接受建设性的反馈
- 专注于对社区最有利的事情

---

## 如何贡献

### 报告 Bug

如果你发现了 Bug，请：

1. 在 [GitHub Issues](https://github.com/Jfan4313/Carbon-Pro/issues) 搜索是否已有相同问题
2. 如果没有，创建新的 Issue，包含：
   - 清晰的标题和描述
   - 重现步骤
   - 预期行为 vs 实际行为
   - 环境信息（浏览器、操作系统等）
   - 截图（如适用）

### 提出功能建议

1. 在 [GitHub Issues](https://github.com/Jfan4313/Carbon-Pro/issues) 创建 Feature Request
2. 描述清楚：
   - 功能的用途和价值
   - 期望的行为
   - 可能的实现方式

### 提交代码

1. Fork 本仓库
2. 创建你的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat(module): 添加新功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

---

## 开发流程

### 环境设置

```bash
# 克隆仓库
git clone https://github.com/Jfan4313/Carbon-Pro.git
cd Carbon-Pro

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 启动 Electron 开发
npm run electron:dev
```

### 分支策略

本项目使用简化的分支模型：

```
main          ← 生产分支，保持稳定
├── feature/* ← 功能分支（如：feature/solar-angle）
├── fix/*     ← 修复分支（如：fix/excel-export）
└── hotfix/*  ← 紧急修复（如：hotfix/security-patch）
```

### 分支命名规范

- `feature/<功能描述>` - 新功能
  - 示例：`feature/solar-optimization`
  - 示例：`feature/esg-dashboard`
- `fix/<问题描述>` - Bug 修复
  - 示例：`fix/excel-encoding`
  - 示例：`fix/mobile-sidebar`
- `hotfix/<紧急问题描述>` - 紧急修复
  - 示例：`hotfix/security-vulnerability`
- `docs/<文档类型>` - 文档更新
  - 示例：`docs/readme-update`

---

## Git 提交规范

本项目采用 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

### 提交格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型 (type)

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(solar): 添加光伏板角度优化计算` |
| `fix` | 修复 Bug | `fix(report): 修复 Excel 导出中文乱码问题` |
| `docs` | 文档更新 | `docs(readme): 更新部署说明` |
| `style` | 代码格式调整 | `style(sidebar): 统一缩进格式` |
| `refactor` | 代码重构 | `refactor(storage): 简化储能计算逻辑` |
| `perf` | 性能优化 | `perf(charts): 优化图表渲染性能` |
| `test` | 测试相关 | `test(api): 添加 Supabase 连接测试` |
| `chore` | 构建/工具更新 | `chore(deps): 升级 React 到 v19` |
| `revert` | 回滚提交 | `revert: 回滚 feat(solar-angle)` |

### 范围 (scope)

| 范围 | 说明 |
|-------|------|
| `solar` | 光伏模块 |
| `storage` | 储能模块 |
| `ev` | 充电桩 |
| `hvac` | 空调系统 |
| `microgrid` | 微电网 |
| `vpp` | 虚拟电厂 |
| `ai` | AI 管理平台 |
| `carbon` | 碳资产管理 |
| `dashboard` | 仪表盘 |
| `report` | 报告中心 |
| `auth` | 认证 |
| `config` | 配置相关 |
| `deploy` | 部署配置 |
| `docs` | 文档 |

### 提交示例

**好的提交：**
```bash
# 简单的 Bug 修复
git commit -m "fix(report): 修复 Excel 导出中文乱码"

# 新功能
git commit -m "feat(solar): 添加光伏板角度优化计算

- 根据经纬度计算最佳倾角
- 考虑季节变化调整
- 提升发电效率约 5%"

# 文档更新
git commit -m "docs(readme): 更新部署说明文档

添加 Vercel 部署步骤和配置说明"
```

**不好的提交：**
```bash
# 太简略
git commit -m "update code"

# 不规范的大小写
git commit -m "Fix: something wrong"

# 没有范围
git commit -m "feat: 添加功能"
```

---

## Pull Request 流程

### PR 标题格式

使用与提交消息相同的格式：

```
feat(solar): 添加光伏板角度优化计算
fix(report): 修复 Excel 导出中文乱码问题
docs(readme): 更新部署说明
```

### PR 描述模板

```markdown
## 变更类型
- [ ] 新功能 (feat)
- [ ] Bug 修复 (fix)
- [ ] 文档更新 (docs)
- [ ] 性能优化 (perf)
- [ ] 代码重构 (refactor)

## 变更说明
简要描述这个 PR 的变更内容和目的。

## 相关 Issue
Closes #(issue 编号)

## 测试
- [ ] 本地测试通过
- [ ] 跨浏览器测试（Chrome, Firefox, Safari, Edge）
- [ ] 移动端测试（如适用）

## 截图（如适用）
（添加截图展示变更效果）

## 检查清单
- [ ] 代码符合项目规范
- [ ] 提交信息符合规范
- [ ] 更新了相关文档
- [ ] 添加了必要的注释
```

### PR 审查流程

1. 自动检查：CI/CD 会自动运行构建和测试
2. 代码审查：维护者会审查代码
3. 反馈：根据反馈进行修改
4. 合并：审查通过后合并到 main 分支

---

## 代码规范

### TypeScript 规范

```typescript
// 使用接口定义类型
interface SolarConfig {
  capacity: number;
  angle: number;
  efficiency: number;
}

// 使用默认参数
function calculateSolarOutput(
  config: SolarConfig,
  options: { season?: 'summer' | 'winter' } = {}
): number {
  // 实现逻辑
}

// 使用可选链
const value = module?.data?.investment ?? 0;
```

### React 组件规范

```tsx
// 使用函数组件
const SolarPanel: React.FC<SolarProps> = ({ capacity, onChange }) => {
  // 使用 Hooks
  const [efficiency, setEfficiency] = useState(18);

  // 处理函数使用 useCallback
  const handleChange = useCallback((value: number) => {
    onChange?.(value);
  }, [onChange]);

  return (
    <div className="solar-panel">
      {/* 组件内容 */}
    </div>
  );
};
```

### 样式规范

- 优先使用 Tailwind CSS 类
- 使用语义化的颜色值（`text-slate-800` 而非 `text-gray-800`）
- 响应式设计优先（移动优先）

```tsx
// 好的实践
<div className="p-4 sm:p-6 md:p-8 flex flex-col md:flex-row">

// 避免内联样式
<div style={{ padding: '16px' }}>
```

---

## 问题排查

### 常见开发问题

**依赖安装失败：**
```bash
# 清理缓存重新安装
rm -rf node_modules package-lock.json
npm install
```

**构建错误：**
```bash
# 检查 TypeScript 类型错误
npm run build

# 检查 Lint 错误（如果有配置）
npm run lint
```

**Vite 启动慢：**
```bash
# 检查是否有代理设置
# 考虑使用 npm 淘宝镜像
npm config set registry https://registry.npmmirror.com
```

---

## 联系方式

- GitHub Issues: [https://github.com/Jfan4313/Carbon-Pro/issues](https://github.com/Jfan4313/Carbon-Pro/issues)
- 邮箱: （请在 Issue 中联系）

---

## 许可证

提交代码即表示你同意你的代码将按照项目的 [MIT License](LICENSE) 进行分发。
