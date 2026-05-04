---
id: MA-07
title: 多代理与并行协作
load: on-demand
depends: [rules/02-default-principles.md]
related: [rules/04-progress-verify.md, rules/08-git.md]
---

# 多代理与并行协作

## 子代理派发

- 复杂推理/架构分析：最高推理模型；代码实现/测试/重构：Codex 优化模型。
- 模型不可用时自动回退同等级模型并说明。

## 并行开发总控

### 执行模式

- 优先当前会话内子代理并行；仅用户要求或确需外部隔离/长期运行时切换 worktree。
- 会话内并行持续推进跟踪子任务，不因确认中断。
- 复杂但不需真实并行默认 `executing-plans`；适合并行且平台稳定时用 `subagent-driven-development`。
- 非必要不创建 worktree。

### 调度闭环

- spawn 记录 id/target -> wait 统一用 wait_agent -> 多子代理维护 pending 集合 -> 完成后及时 close。
- 仅在 BLOCKED、需改 scope_write、需调 shared contract/types/schema/根配置、写/依赖冲突、需用户决策时打断。

### 并行准入

- 适合：2-4 个边界清晰、scope 明确、可独立验证、无同文件写冲突的子任务。
- 不适合：改动集中在 1-2 文件、涉及 shared contract/types/schema、根因未明、依赖升级/迁移/CI/根配置、拆分返工风险大。

### Ownership / Blocked / Worktree

- 禁止两子任务修改同一文件/配置/contract/shared types。
- package.json/lockfile/根配置/CI/schema/migration/shared contracts/路由总入口/环境变量模板默认串行处理。
- scope_write 外文件、未完成依赖、共享 contract 调整、根配置变更、验证失败超界、冲突或拆分不合理时须停止上报。
- 多分支时用 worktree 隔离；子任务不得自行 merge/rebase/push/delete worktree（除非用户要求）。

### 收尾整合

子任务完成 ≠ 项目完成。收尾须：汇总改动、检查冲突、分析依赖与合并顺序、必要时补 integration task、运行最终验证、输出 merge plan。

### 外部并行规划

仅用户要求 worktree 方案/多 Codex 提示词/外部并行规划时输出。包含：是否适合并行、拆分方案、子任务提示、收尾验证。不适合时输出原因与单线程方案。
