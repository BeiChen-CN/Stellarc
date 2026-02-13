<p align="center">
  <img src="build/icon.png" alt="Stellarc" width="120">
</p>

<h1 align="center">Stellarc</h1>

<p align="center">
  隐私优先 · 算法公平 · 高度可定制的离线课堂随机点名工具
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-39-47848F?logo=electron&logoColor=white" alt="Electron">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-blue" alt="Platform">
</p>

---

## 功能概览

**抽选核心**
- 加权随机抽选引擎，内置 3 种策略预设（经典 / 均衡 / 动量）
- 冷却机制防止连续抽中同一学生
- 支持单人 / 多人抽选、随机分组
- 7 种抽选动画风格（滚动、老虎机、翻转、转盘、弹跳、打字机、涟漪）

**班级管理**
- 多班级切换，学生增删改查
- 学生照片管理，支持拖拽上传
- 积分系统，权重手动调节
- 操作可撤销（Undo）

**数据与统计**
- 完整的抽选历史记录
- 可视化统计面板（Top 10、频率趋势、班级分布、积分排行）
- 公平性均衡指数
- CSV 导出

**个性化**
- 18 种颜色主题 + 9 种设计风格
- Material Design 3 色调渗透模式
- 深色 / 浅色模式
- 自定义背景图片 + 动态取色
- 课堂活动模板一键套用

**安全与可靠**
- 完全离线运行，数据存储在本地
- 启动时自动数据迁移 + 自检修复
- ZIP 备份 / 恢复，失败自动回滚
- 路径遍历防护，文件操作限制在数据目录内

---

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/BeiChen-CN/Stellarc.git
cd Stellarc

# 安装依赖
npm install

# 启动开发模式
npm run dev
```

### 构建安装包

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

---

## 项目结构

```
src/
├── main/                        # 主进程 (Node.js)
│   ├── controllers/             #   IPC 控制器
│   │   ├── BaseController.ts    #     抽象基类 (Zod 验证 + 错误捕获)
│   │   ├── FileController.ts    #     文件读写 + 照片管理
│   │   ├── AppController.ts     #     快捷键 + 备份恢复 + 主题
│   │   └── DialogController.ts  #     原生对话框
│   ├── migrations/              #   数据迁移 (版本化 schema 升级)
│   └── health/                  #   启动自检与修复
│
├── preload/                     # IPC 桥接层
│   ├── index.ts                 #   contextBridge 实现
│   └── index.d.ts               #   TypeScript 类型声明
│
└── renderer/src/                # 渲染进程 (React SPA)
    ├── views/                   #   页面视图 (6 个)
    ├── components/              #   UI 组件
    ├── store/                   #   Zustand 状态管理 (7 个 store)
    ├── engine/selection/        #   抽选策略引擎
    ├── lib/                     #   工具函数 + 音效合成
    └── assets/                  #   样式 + 静态资源
```

---

## 策略插件

支持通过 JSON 文件扩展自定义抽选策略：

1. 参考 `strategy-plugins.example.json` 创建 `strategy-plugins.json`
2. 在设置页热重载插件

```json
{
  "id": "my-strategy",
  "name": "自定义策略",
  "baseMultiplier": 1.0,
  "scoreFactor": 0.5,
  "pickDecayFactor": 0.3,
  "minWeight": 0.1,
  "maxWeight": 5.0
}
```

| 字段 | 说明 |
|------|------|
| `baseMultiplier` | 基础权重倍数 |
| `scoreFactor` | 积分加成系数（正分越高权重越高） |
| `pickDecayFactor` | 抽中衰减系数（抽中越多权重越低） |
| `minWeight` / `maxWeight` | 权重下限 / 上限 |

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Electron 39 + electron-vite |
| 前端 | React 19 + TypeScript 5.9 |
| 样式 | Tailwind CSS + CSS Variables (shadcn/ui 风格) |
| 状态 | Zustand |
| 动画 | Framer Motion |
| 图表 | Recharts |
| 验证 | Zod v4 |
| 日志 | electron-log |
| 更新 | electron-updater |
| 测试 | Vitest |
| 代码规范 | ESLint + Prettier |

---

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 (HMR) |
| `npm run build` | 类型检查 + 生产构建 |
| `npm run typecheck` | TypeScript 全量类型检查 |
| `npm run lint` | ESLint 检查 |
| `npm run format` | Prettier 格式化 |
| `npm test` | 运行测试 |
| `npm run build:win` | 打包 Windows 安装包 |
| `npm run build:mac` | 打包 macOS 应用 |
| `npm run build:linux` | 打包 Linux 应用 |

---

## 数据存储

运行时数据位于系统用户数据目录：

| 文件 | 内容 |
|------|------|
| `data/classes.json` | 班级与学生数据 |
| `data/history.json` | 抽选历史记录 |
| `data/settings.json` | 应用设置 |
| `data/photos/` | 学生照片 |
| `migration-state.json` | 迁移状态 |
| `health-report.json` | 自检报告 |

所有文件操作通过路径安全校验，限制在 `data/` 目录内。

---

## 许可证

[MIT](LICENSE)
