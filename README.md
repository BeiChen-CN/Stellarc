<p align="center">
  <img src="build/icon.png" alt="Stellarc" width="120">
</p>

<h1 align="center">Stellarc</h1>

<p align="center">隐私优先、算法公平、高度可定制的离线课堂随机点名工具</p>

<p align="center">
  <a href="https://github.com/BeiChen-CN/Stellarc/releases/latest"><img src="https://img.shields.io/github/v/release/BeiChen-CN/Stellarc?color=blue" alt="Release"></a>
  <img src="https://img.shields.io/github/stars/BeiChen-CN/Stellarc?style=social" alt="Stars">
  <img src="https://img.shields.io/github/downloads/BeiChen-CN/Stellarc/total?color=green" alt="Downloads">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/Windows%20%7C%20macOS%20%7C%20Linux-blue" alt="Platform">
</p>

<p align="center">
  <sub>基于 <a href="https://github.com/BeiChen-CN/spotlight">Spotlight</a> 重构</sub>
</p>

## 截图

<table>
  <tr>
    <td><img src="https://free.picui.cn/free/2026/05/04/69f8a7daeb346.png" alt="首页抽选结果" width="720"></td>
    <td><img src="https://free.picui.cn/free/2026/05/04/69f8a7dad16d9.png" alt="设置页外观配置" width="720"></td>
  </tr>
</table>

---

## 下载

| 平台 | 格式 | 下载 |
| --- | --- | --- |
| Windows | `.exe` | [前往 Releases](https://github.com/BeiChen-CN/Stellarc/releases/latest) |
| macOS | `.dmg` | [前往 Releases](https://github.com/BeiChen-CN/Stellarc/releases/latest) |
| Linux | `.AppImage` / `.deb` | [前往 Releases](https://github.com/BeiChen-CN/Stellarc/releases/latest) |

---

## 功能

| 模块 | 能力 |
| --- | --- |
| 随机点名 | 加权随机、冷却防连抽、单人/多人抽选、随机分组、8 种抽取动画、3 档速率。 |
| 沉浸模式 | 进入后缩为悬浮球, 点击展开小浮球动作; 沉浸抽取固定单人, 结果展示在顶部灵动岛。 |
| 灵动岛样式 | 内置 Classic Island、Focus Beam、Capsule Slot、Pulse Badge 四套样式, 设置页可用迷你预览卡片切换。 |
| 班级管理 | 多班级切换, 学生增删改查, 照片管理, 学号展示, 积分与权重调整。 |
| 历史与统计 | 抽选历史、Top 10、频率趋势、班级分布、积分排行、均衡指数、CSV 与课堂报告导出。 |
| 外观设置 | 28+ 主题色、12 种设计风格、深浅色模式、投屏模式、自定义背景、动态取色。 |
| 新手引导 | 精简为 3 个核心步骤: 准备班级、开始点名、按需调整和复盘。 |
| 数据安全 | 完全离线、本地存储、ZIP 备份恢复、启动自检、失败自动回滚。 |

---

## 开发

**环境要求:** Node.js >= 18, npm >= 9

```bash
git clone https://github.com/BeiChen-CN/Stellarc.git
cd Stellarc
npm install
npm run dev
```

开发服务默认使用 `http://127.0.0.1:4173`。如果端口被旧进程占用, 先结束残留的 `electron-vite dev` 进程再启动。

### 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动 Electron + Vite 开发环境。 |
| `npm run start` | 预览已构建产物。 |
| `npm run typecheck` | 同时检查主进程与渲染进程 TypeScript。 |
| `npm run test` | 运行 Vitest 单元测试。 |
| `npm run test:ui` | 运行 Playwright UI 回归测试。 |
| `npm run lint` | 运行 ESLint。 |
| `npm run format` | 使用 Prettier 格式化。 |
| `npm run build` | 类型检查并生成生产构建。 |
| `npm run build:report` | 构建后输出 bundle 体积报告。 |
| `npm run assets:installer` | 生成 NSIS 安装器 bitmap 资源。 |

### 构建安装包

```bash
npm run build:win      # Windows (NSIS)
npm run build:mac      # macOS (DMG)
npm run build:linux    # Linux (AppImage + deb)
```

### 质量检查

```bash
npm run typecheck
npm run test
npm run test:ui -- tests/ui/immersive-mode.spec.ts
npm run build
npx knip --no-exit-code
```

`knip.json` 已配置 Electron、Vite、Playwright 与 Vitest 的入口, 用于辅助检查未使用文件和导出。不要仅凭无配置的 knip 结果删除入口文件或打包资源。

---

## 架构

Stellarc 是三进程 Electron 应用:

- 主进程: `src/main/`, 负责窗口、IPC、数据迁移、自检和本地文件访问。
- 预加载层: `src/preload/`, 暴露受控的 `electronAPI` 给渲染进程。
- 渲染进程: `src/renderer/src/`, React SPA, 使用 Zustand 管理状态。

新增 IPC 功能通常需要同步修改:

- `src/main/index.ts` 或 `src/main/controllers/`
- `src/preload/index.ts`
- `src/preload/index.d.ts`

### 项目结构

```text
src/
├── main/                  # Electron 主进程
│   ├── controllers/       # IPC 控制器
│   ├── health/            # 启动自检
│   ├── migrations/        # 数据迁移
│   └── immersiveWindow.ts # 沉浸模式窗口壳状态
├── preload/               # IPC 桥接层
└── renderer/src/          # React 渲染进程
    ├── components/        # 通用 UI 组件
    ├── engine/selection/  # 抽选策略引擎
    ├── store/             # Zustand store
    ├── views/             # 页面
    └── lib/               # 工具函数
```

### 沉浸模式

沉浸模式只作用于随机点名页的 `pick` 模式:

- `src/main/immersiveWindow.ts` 负责 `normal / ball / menu / island / expanded` 窗口壳计算。
- `src/renderer/src/views/home/hooks/useImmersiveUI.ts` 维护沉浸 UI 状态机。
- `src/renderer/src/views/home/ImmersiveShell.tsx` 渲染悬浮球、小浮球菜单、顶部灵动岛和展开态。
- `src/renderer/src/views/home/immersiveIslandVariants.tsx` 集中维护四套灵动岛视觉样式。
- 开发预览页: `http://127.0.0.1:4173/?preview=immersive-island`。

### 数据存储

运行时数据位于系统用户数据目录:

| 路径 | 内容 |
| --- | --- |
| `data/classes.json` | 班级与学生数据 |
| `data/history.json` | 抽选历史记录 |
| `data/settings.json` | 应用设置 |
| `data/photos/` | 学生照片 |
| `data/diagnostics-events.json` | 诊断事件日志 |

所有文件操作都通过路径校验限制在应用数据目录内。

---

## 数据治理与诊断

- 学生管理页支持一键数据治理: 规范化、去重和数据修复。
- 设置页提供诊断信息: 迁移状态、自检详情和最近事件。
- 快捷键、自检等关键事件会写入 `diagnostics-events.json`。
- 数据迁移失败时保留回滚路径, 避免破坏用户数据。

---

## 技术栈

| 类型 | 技术 |
| --- | --- |
| 框架 | Electron 39 + electron-vite |
| 前端 | React 19 + TypeScript 5.9 |
| 样式 | Tailwind CSS + CSS Variables |
| 状态 | Zustand |
| 动画 | Framer Motion |
| 图表 | Recharts |
| 验证 | Zod v4 |
| 测试 | Vitest + Playwright |
| 规范 | ESLint + Prettier + knip |

---

## CI / 发布

- PR 与主分支推送会执行 `.github/workflows/ci.yml`:
  - `npm run typecheck`
  - `npm run lint`
  - `npm test`
  - `npm run build`
- 推送 `v*` 标签会触发 `.github/workflows/release.yml`, 构建多平台产物并上传到 GitHub Release。
- Release 描述优先读取 `CHANGELOG.md` 对应版本章节。

---

## Stars History

[![Stellarc Stars History](https://api.star-history.com/svg?repos=BeiChen-CN/Stellarc&type=Date)](https://www.star-history.com/#BeiChen-CN/Stellarc&Date)

---

## 许可证

[MIT](LICENSE)
