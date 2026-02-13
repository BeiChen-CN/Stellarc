<p align="center">
  <img src="build/icon.png" alt="Stellarc" width="120">
</p>

<h1 align="center">Stellarc</h1>

<p align="center">
  离线课堂随机点名工具
</p>

<p align="center">
  <a href="https://github.com/BeiChen-CN/Stellarc/releases/latest"><img src="https://img.shields.io/github/v/release/BeiChen-CN/Stellarc?label=版本&color=blue" alt="Release"></a>
  <img src="https://img.shields.io/github/downloads/BeiChen-CN/Stellarc/total?label=下载&color=green" alt="Downloads">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/Windows%20%7C%20macOS%20%7C%20Linux-blue" alt="Platform">
</p>

> 基于 [Spotlight](https://github.com/BeiChen-CN/spotlight) 重构

## 下载

<table>
  <tr>
    <th>平台</th>
    <th>格式</th>
    <th>下载</th>
  </tr>
  <tr>
    <td>Windows</td>
    <td><code>.exe</code></td>
    <td rowspan="3"><a href="https://github.com/BeiChen-CN/Stellarc/releases/latest">前往 Releases</a></td>
  </tr>
  <tr>
    <td>macOS</td>
    <td><code>.dmg</code></td>
  </tr>
  <tr>
    <td>Linux</td>
    <td><code>.AppImage</code> / <code>.deb</code></td>
  </tr>
</table>

Windows 安装流程：许可协议 → 选择安装目录 → 选择是否创建桌面快捷方式和开机自启（默认勾选） → 安装。

安装后支持自动更新。

## 功能

<table>
  <tr>
    <td width="50%" valign="top">
      <strong>抽选</strong>
      <ul>
        <li>加权随机抽选，内置经典 / 均衡 / 动量三种策略</li>
        <li>冷却机制，防止连续抽中同一人</li>
        <li>单人或多人抽选，随机分组</li>
        <li>8 种动画风格，3 档速率</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <strong>班级管理</strong>
      <ul>
        <li>多班级切换，学生增删改查</li>
        <li>照片管理，拖拽上传</li>
        <li>积分系统，权重调节</li>
        <li>撤销操作</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td valign="top">
      <strong>统计</strong>
      <ul>
        <li>抽选历史记录</li>
        <li>Top 10、频率趋势、班级分布、积分排行</li>
        <li>均衡指数</li>
        <li>CSV 导出，HTML 报告</li>
        <li>按学期筛选</li>
      </ul>
    </td>
    <td valign="top">
      <strong>外观</strong>
      <ul>
        <li>18 种颜色主题，9 种设计风格</li>
        <li>深色 / 浅色模式，M3 色调渗透</li>
        <li>自定义背景图片</li>
        <li>课堂活动模板</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td colspan="2" valign="top">
      <strong>数据</strong>
      <ul>
        <li>完全离线，本地存储</li>
        <li>ZIP 备份恢复，失败自动回滚</li>
        <li>多终端同步</li>
        <li>启动自检修复</li>
      </ul>
    </td>
  </tr>
</table>

## 开发

```bash
git clone https://github.com/BeiChen-CN/Stellarc.git
cd Stellarc
npm install
npm run dev
```

<details>
<summary>构建安装包</summary>

```bash
npm run build:win      # Windows
npm run build:mac      # macOS
npm run build:linux    # Linux
```

</details>

<details>
<summary>其他命令</summary>

| 命令 | 说明 |
|------|------|
| `npm run build` | 生产构建 |
| `npm run typecheck` | 类型检查 |
| `npm run lint` | ESLint 检查 |
| `npm run format` | Prettier 格式化 |
| `npm test` | 运行测试 |

</details>

## 项目结构

```
src/
├── main/                  # 主进程
│   ├── controllers/       #   IPC 控制器
│   ├── migrations/        #   数据迁移
│   └── health/            #   启动自检
├── preload/               # IPC 桥接层
└── renderer/src/          # 渲染进程 (React)
    ├── views/             #   页面
    ├── components/        #   组件
    ├── store/             #   Zustand store
    ├── engine/selection/  #   抽选引擎
    └── lib/               #   工具函数
```

## 策略插件

参考 `strategy-plugins.example.json` 创建 `strategy-plugins.json`，设置页可热重载。

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

## 数据存储

运行时数据位于系统用户数据目录（`%APPDATA%` / `~/Library/Application Support` / `~/.config`）：

| 路径 | 内容 |
|------|------|
| `data/classes.json` | 班级与学生数据 |
| `data/history.json` | 抽选历史记录 |
| `data/settings.json` | 应用设置 |
| `data/photos/` | 学生照片 |

所有文件操作通过路径校验限制在 `data/` 目录内。

## 架构

三进程 Electron 架构，主进程通过控制器模式处理 IPC 请求，渲染进程为 React SPA，Zustand 管理状态。新增 IPC 功能需同步修改三处：控制器（`src/main/controllers/`）、桥接层（`src/preload/index.ts`）、类型声明（`src/preload/index.d.ts`）。

## 技术栈

Electron 39 · React 19 · TypeScript · Tailwind CSS · Zustand · Framer Motion · Recharts · Zod · Vitest

## 许可证

[MIT](LICENSE)
