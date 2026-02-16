<p align="center">
  <img src="build/icon.png" alt="Stellarc" width="120">
</p>

<h1 align="center">Stellarc</h1>

<p align="center">离线课堂随机点名工具</p>

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

---

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

---

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
        <li>CSV 导出，HTML 课堂报告</li>
        <li>按学期筛选</li>
      </ul>
    </td>
    <td valign="top">
      <strong>外观</strong>
      <ul>
        <li>28+ 种颜色主题，11 种设计风格</li>
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
        <li>多终端同步（推送 / 拉取）</li>
        <li>同步冲突检测（支持强制覆盖）</li>
        <li>恢复点（创建 / 恢复最近快照）</li>
        <li>启动自检修复</li>
      </ul>
    </td>
  </tr>
</table>

---

## 开发

**环境要求：** Node.js >= 18，npm >= 9

```bash
git clone https://github.com/BeiChen-CN/Stellarc.git
cd Stellarc
npm install
npm run dev
```

<details>
<summary>构建安装包</summary>

```bash
npm run build:win      # Windows (NSIS)
npm run build:mac      # macOS (DMG)
npm run build:linux    # Linux (AppImage + deb)
```

</details>

<details>
<summary>全部命令</summary>

| 命令                | 说明                    |
| ------------------- | ----------------------- |
| `npm run dev`       | 启动开发服务器（HMR）   |
| `npm run build`     | 类型检查 + 生产构建     |
| `npm run typecheck` | TypeScript 全量类型检查 |
| `npm run lint`      | ESLint 检查             |
| `npm run format`    | Prettier 格式化         |
| `npm test`          | 运行测试                |
| `npm run test:ui`   | 运行 Playwright UI 回归 |

</details>

---

## 架构

三进程 Electron 架构，主进程通过控制器模式处理 IPC 请求，渲染进程为 React SPA，Zustand 管理状态。

新增 IPC 功能需同步修改三处：控制器（`src/main/controllers/`）、桥接层（`src/preload/index.ts`）、类型声明（`src/preload/index.d.ts`）。

<details>
<summary>项目结构</summary>

```
src/
├── main/                  # 主进程 (Node.js)
│   ├── controllers/       #   IPC 控制器
│   ├── migrations/        #   数据迁移
│   └── health/            #   启动自检
├── preload/               # IPC 桥接层
└── renderer/src/          # 渲染进程 (React)
    ├── views/             #   页面（6 个视图）
    ├── components/        #   UI 组件
    ├── store/             #   Zustand store（7 个）
    ├── engine/selection/  #   抽选策略引擎
    ├── lib/               #   工具函数 + 音效合成
    └── assets/            #   样式 + 静态资源
```

</details>

<details>
<summary>数据存储</summary>

运行时数据位于系统用户数据目录（`%APPDATA%` / `~/Library/Application Support` / `~/.config`）：

| 路径                 | 内容           |
| -------------------- | -------------- |
| `data/classes.json`  | 班级与学生数据 |
| `data/history.json`  | 抽选历史记录   |
| `data/settings.json` | 应用设置       |
| `data/photos/`       | 学生照片       |

所有文件操作通过路径校验限制在 `data/` 目录内。

</details>

---

## 策略插件

参考 `strategy-plugins.example.json` 创建 `strategy-plugins.json`，设置页可热重载。

<details>
<summary>插件格式与字段说明</summary>

```json
{
  "id": "my-strategy",
  "name": "自定义策略",
  "enabled": true,
  "minAppVersion": "1.0.0",
  "signature": "abcdef12",
  "baseMultiplier": 1.0,
  "scoreFactor": 0.5,
  "pickDecayFactor": 0.3,
  "minWeight": 0.1,
  "maxWeight": 5.0
}
```

| 字段                      | 说明                             |
| ------------------------- | -------------------------------- |
| `enabled`                 | 是否启用该插件（默认启用）       |
| `minAppVersion`           | 最低应用版本，不满足会跳过加载   |
| `signature`               | 简易签名校验值，不匹配会拒绝加载 |
| `baseMultiplier`          | 基础权重倍数                     |
| `scoreFactor`             | 积分加成系数（正分越高权重越高） |
| `pickDecayFactor`         | 抽中衰减系数（抽中越多权重越低） |
| `minWeight` / `maxWeight` | 权重下限 / 上限                  |

插件安全策略：

- 未配置 `signature` 的插件默认跳过加载
- `minAppVersion` 不满足时自动跳过
- 详情可在设置页「抽选规则」查看（加载 / 跳过 / 错误）

---

## 数据治理与诊断

- 学生管理页支持一键数据治理（规范化 + 去重）
- 设置页支持诊断面板：迁移状态、自检详情、最近事件日志
- 关键事件写入 `diagnostics-events.json`（同步 / 快捷键 / 插件）

</details>

---

## 技术栈

<table>
  <tr>
    <td><strong>框架</strong></td>
    <td>Electron 39 + electron-vite</td>
  </tr>
  <tr>
    <td><strong>前端</strong></td>
    <td>React 19 + TypeScript 5.9</td>
  </tr>
  <tr>
    <td><strong>样式</strong></td>
    <td>Tailwind CSS + CSS Variables（shadcn/ui 风格）</td>
  </tr>
  <tr>
    <td><strong>状态</strong></td>
    <td>Zustand</td>
  </tr>
  <tr>
    <td><strong>动画</strong></td>
    <td>Framer Motion</td>
  </tr>
  <tr>
    <td><strong>图表</strong></td>
    <td>Recharts</td>
  </tr>
  <tr>
    <td><strong>验证</strong></td>
    <td>Zod v4</td>
  </tr>
  <tr>
    <td><strong>测试</strong></td>
    <td>Vitest</td>
  </tr>
  <tr>
    <td><strong>规范</strong></td>
    <td>ESLint + Prettier</td>
  </tr>
</table>

---

## CI / 发布门禁

- PR 与主分支推送会执行 `.github/workflows/ci.yml`：
  - `npm run typecheck`
  - `npm run lint`
  - `npm test`
  - `npm run build`
- 推送 `v*` 标签会自动触发 `.github/workflows/release.yml`，构建多平台产物并上传到 GitHub Release。
- Release 描述会优先读取 `CHANGELOG.md` 对应版本章节，自动生成更新日志。

---

## 许可证

[MIT](LICENSE)
