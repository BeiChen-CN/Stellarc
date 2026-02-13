# Stellarc - 课堂随机抽选与互动平台

Stellarc 是一款离线优先的桌面端课堂随机抽选应用，基于 Electron + React + TypeScript 构建，支持班级管理、策略抽选、分组互动、历史追踪与统计分析。

## 亮点能力

- 离线可用，本地数据存储（JSON + 本地图片）
- 抽选策略引擎（权重、冷却、防重复、策略预设）
- 多种动画（含转盘动画，现支持多人抽选场景）
- 历史记录与可视化统计（含公平性指标）
- 数据备份/恢复 + 启动迁移 + 失败回滚
- 全局快捷键触发抽选（支持注册失败反馈）
- 背景图片与动态取色
- 课堂活动预设可一键套用推荐规则（同步调整动画与公平策略）

## 技术栈

- Electron + Vite
- React 19 + TypeScript
- Zustand
- Tailwind CSS
- Framer Motion
- Recharts
- Zod

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 类型检查

```bash
npm run typecheck
```

### 构建

```bash
npm run build
```

## 数据与安全

- 数据目录位于 Electron `userData/data`
- 文件路径通过主进程安全校验，避免越权访问
- 启动时执行数据迁移，失败自动回滚到迁移前快照
- 若数据 schema 已是最新版本，将自动跳过迁移，避免重复备份
- 启动时执行数据自检（`health-report.json`），自动修复缺失/损坏基础文件

## Q4 插件化（策略）

- 插件文件：`strategy-plugins.json`（可参考 `strategy-plugins.example.json`）
- 设置页可热重载插件并显示加载数量/错误信息

插件字段说明：

- `id`：策略唯一 ID（仅小写字母、数字、中划线）
- `name`：显示名称
- `baseMultiplier`：基础权重倍数
- `scoreFactor`：积分加成系数（正分越高，权重越高）
- `pickDecayFactor`：抽中次数衰减系数（抽中越多，权重越低）
- `minWeight` / `maxWeight`：权重下限 / 上限

## 多终端同步（可选）

- 在设置页启用“目录同步”并选择一个共享文件夹
- 支持“推送到目录”与“从目录拉取”两种手动同步方式
- 同步目录内数据位置：`<你的目录>/stellarc-sync/data`

## 操作可恢复（Undo）

- 学生管理页支持撤销最近一次班级/学生编辑操作
- 可撤销操作包括：新增/删除班级、增删学生、修改状态/权重/积分/头像

## 可观测性与诊断

- 设置页提供诊断面板：迁移状态 + 自检修复统计
- 诊断源文件：
  - `migration-state.json`
  - `health-report.json`

## 测试体系

- 单元测试框架：Vitest
- 运行测试：`npm test`
- 监听模式：`npm run test:watch`
- 已覆盖：
  - 文件 URL 转换工具（路径兼容）
  - 策略插件加载/重置

## 发布与更新链路

发布前建议执行：

1. `npm run typecheck`
2. `npm test`
3. `npm run build`

更新链路检查项：

- 检查更新 -> 下载更新 -> 重启安装
- 升级后查看 `migration-state.json` 与 `health-report.json`
- 若升级异常可使用备份恢复能力回滚数据

## 目录结构

```text
src/
  main/
    controllers/         # 主进程 IPC 控制器
    migrations/          # 数据迁移与回滚
  preload/               # IPC 桥接层
  renderer/src/
    components/          # UI 组件
    engine/selection/    # 抽选策略引擎与策略注册表
    store/               # Zustand 状态管理
    views/               # 页面视图
```

## 常用脚本

- `npm run dev`：开发模式
- `npm run start`：预览生产构建
- `npm run typecheck`：全量类型检查
- `npm run lint`：ESLint
- `npm run build`：构建应用
- `npm run build:win`：打包 Windows 安装包
