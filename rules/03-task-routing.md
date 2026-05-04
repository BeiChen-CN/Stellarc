---
id: TR-03
title: 任务分流模型
load: on-task-type
depends: [rules/02-default-principles.md]
related: [rules/04-progress-verify.md, rules/05-engineering.md]
---

# 任务分流模型

## 只读任务

- 分析、解释、架构说明、代码阅读、纯信息型问答等不改文件的审查可直接处理。
- 真实问题排查但未进入修改时，优先 `systematic-debugging`。

## 实现任务与质量门禁

- 适用：新功能、bug 修复、行为变更、重构及页面/组件/API/脚本/数据逻辑改动。
- 按复杂度分流：轻量走轻路径，中型走短计划，大型走完整流程。
- Review 用 `requesting-code-review` / `receiving-code-review`；完成前执行 `verification-before-completion`。

## 方案决策框架

- **结构性缺陷**（架构耦合、重复代码、技术债务）-> 根治性方案。
- **局部缺陷**（边界缺失、条件判断错误）-> 最小必要修改。
- 根治性改动面大或涉及接口变更时须暂停确认（流程升级见 [→ rules/02-default-principles.md#流程升级/降级](02-default-principles.md#流程升级--降级)）。
- 选定方案后执行静态逻辑检查：入口 -> 核心逻辑 -> 边界/异常 -> 出口，确认数据流无断裂。
