# Changelog

本文件记录 Stellarc 的所有重要变更。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)。

## 2.0.0 - 2026-08-29

### 新增

- 公平抽选引擎：基于权重的随机抽选，支持连抽、分组与临时禁选
- 沉浸模式：全屏抽选舞台与悬浮岛两种形态
- 数据统计与报表：积分/权重趋势图表，支持 CSV、Markdown、HTML 报告导出
- 数据安全：ZIP 备份与恢复（失败自动回滚）、启动自检、数据迁移（v1 → v2）
- 新手引导：首次启动的班级创建与名单导入流程
- 跨平台安装包：Windows（NSIS）、macOS（DMG）、Linux（AppImage/deb），
  支持 GitHub Release 自动更新

### 变更

- 数据存储迁移至用户数据目录（`app.getPath('userData')/data`）
- 三进程架构：主进程控制器统一 Zod 参数校验与错误日志
